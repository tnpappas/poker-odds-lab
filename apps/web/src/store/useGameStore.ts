import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { syncDrillCards, reviewDrill, type DrillCard, type LeakType } from '@pol/poker-engine';

export type DecisionType = 'pot_odds' | 'ev_call' | 'range_read' | 'blitz';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type Action = 'call' | 'fold' | 'raise';

export interface Decision {
  id: string;
  ts: number;
  mode: 'replay' | 'blitz';
  street: Street;
  type: DecisionType;
  userAction: Action;
  correctAction: Action;
  correct: boolean;
  userEquityEstimate?: number; // 0..1, range-read mode
  actualEquity: number; // 0..1
  evResult: number; // skill points (signed)
  potSize: number;
  betSize: number;
}

const FREE_REPLAY_LIMIT = 15;
const FREE_BLITZ_LIMIT = 5;

interface GameState {
  decisions: Decision[];
  skillPoints: number;
  plan: 'free' | 'pro' | 'lifetime';
  planLoaded: boolean; // true once entitlement has been checked against the server
  usage: { date: string; replays: number; blitz: number };
  adversaries: SavedAdversary[];
  activeAdversaryId: string | null;
  drills: DrillCard[];

  logDecision: (d: Omit<Decision, 'id' | 'ts'>) => void;
  incrementUsage: (mode: 'replay' | 'blitz') => void;
  remaining: (mode: 'replay' | 'blitz') => number;
  setPlan: (plan: 'free' | 'pro' | 'lifetime') => void;
  addAdversary: (v: Omit<SavedAdversary, 'id'>) => string;
  updateAdversary: (id: string, patch: Partial<SavedAdversary>) => void;
  deleteAdversary: (id: string) => void;
  setActiveAdversary: (id: string | null) => void;
  syncDrills: (detected: { leak: LeakType; severity: number }[]) => void;
  gradeDrill: (leak: LeakType, quality: 0 | 1 | 2 | 3) => void;
  reset: () => void;
}

export interface SavedAdversary {
  id: string;
  name: string;
  vpip: number;
  pfr: number;
  cbetFlop: number;
  cbetTurn: number;
  foldTo3bet: number;
  af: number;
  wtsd: number;
  notes?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function freshUsage() {
  return { date: today(), replays: 0, blitz: 0 };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      decisions: [],
      skillPoints: 0,
      plan: 'free',
      planLoaded: false,
      usage: freshUsage(),
      adversaries: [],
      activeAdversaryId: null,
      drills: [],

      logDecision: (d) => {
        set((s) => ({
          decisions: [
            { ...d, id: crypto.randomUUID(), ts: Date.now() },
            ...s.decisions,
          ].slice(0, 1000),
          skillPoints: Math.round((s.skillPoints + d.evResult) * 100) / 100,
        }));
        // Best-effort backend sync (no-op unless VITE_API_URL is set).
        void api.postDecision({
          street: d.street,
          decisionType: d.type,
          userAction: d.userAction,
          correctAction: d.correctAction,
          userEquityEstimate: d.userEquityEstimate ?? null,
          actualEquity: d.actualEquity,
          evResult: d.evResult,
          potSize: d.potSize,
          betSize: d.betSize,
        });
      },

      incrementUsage: (mode) => {
        set((s) => {
          const usage = s.usage.date === today() ? { ...s.usage } : freshUsage();
          if (mode === 'replay') usage.replays += 1;
          else usage.blitz += 1;
          return { usage };
        });
        void api.incrementUsage(mode);
      },

      remaining: (mode) => {
        const s = get();
        if (s.plan !== 'free') return Infinity;
        const usage = s.usage.date === today() ? s.usage : freshUsage();
        return mode === 'replay'
          ? Math.max(0, FREE_REPLAY_LIMIT - usage.replays)
          : Math.max(0, FREE_BLITZ_LIMIT - usage.blitz);
      },

      setPlan: (plan) => set({ plan, planLoaded: true }),

      addAdversary: (v) => {
        const id = crypto.randomUUID();
        set((s) => ({ adversaries: [{ ...v, id }, ...s.adversaries] }));
        return id;
      },
      updateAdversary: (id, patch) =>
        set((s) => ({ adversaries: s.adversaries.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteAdversary: (id) =>
        set((s) => ({
          adversaries: s.adversaries.filter((x) => x.id !== id),
          activeAdversaryId: s.activeAdversaryId === id ? null : s.activeAdversaryId,
        })),
      setActiveAdversary: (id) => set({ activeAdversaryId: id }),

      // Leak -> drill loop: reconcile detected leaks with scheduled drill cards.
      syncDrills: (detected) =>
        set((s) => ({ drills: syncDrillCards(detected, s.drills) })),
      gradeDrill: (leak, quality) =>
        set((s) => ({
          drills: s.drills.map((c) => (c.leak === leak ? reviewDrill(c, quality) : c)),
        })),

      reset: () => set({ decisions: [], skillPoints: 0, usage: freshUsage() }),
    }),
    {
      name: 'pol-game-state',
      // Never persist entitlement: plan is always re-verified against the server
      // on load, so a stale/edited localStorage value can't unlock the tools.
      partialize: (s) => ({
        decisions: s.decisions,
        skillPoints: s.skillPoints,
        usage: s.usage,
        adversaries: s.adversaries,
        activeAdversaryId: s.activeAdversaryId,
        drills: s.drills,
      }),
    },
  ),
);

export const LIMITS = { replay: FREE_REPLAY_LIMIT, blitz: FREE_BLITZ_LIMIT };
