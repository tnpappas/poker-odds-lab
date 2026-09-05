"""Independent check of the homepage hand math. Pure Python, no poker-engine code reused."""
import itertools
from collections import Counter

RANKS = '23456789TJQKA'
SUITS = 'shdc'
RV = {r: i for i, r in enumerate(RANKS, start=2)}

def card(s): return (RV[s[0]], s[1])

def eval5(cs):
    vals = sorted((c[0] for c in cs), reverse=True)
    suits = [c[1] for c in cs]
    flush = len(set(suits)) == 1
    cnt = Counter(vals)
    groups = sorted(cnt.items(), key=lambda kv: (kv[1], kv[0]), reverse=True)
    uniq = sorted(set(vals), reverse=True)
    straight_high = None
    if len(uniq) == 5:
        if uniq[0] - uniq[4] == 4: straight_high = uniq[0]
        elif uniq == [14, 5, 4, 3, 2]: straight_high = 5
    if straight_high and flush: return (8, straight_high)
    if groups[0][1] == 4: return (7, groups[0][0], groups[1][0])
    if groups[0][1] == 3 and groups[1][1] == 2: return (6, groups[0][0], groups[1][0])
    if flush: return (5, *vals)
    if straight_high: return (4, straight_high)
    if groups[0][1] == 3: return (3, groups[0][0], *[g[0] for g in groups[1:]])
    if groups[0][1] == 2 and groups[1][1] == 2: return (2, groups[0][0], groups[1][0], groups[2][0])
    if groups[0][1] == 2: return (1, groups[0][0], *[g[0] for g in groups[1:]])
    return (0, *vals)

def best7(cs): return max(eval5(c) for c in itertools.combinations(cs, 5))

def expand_range(spec):
    combos = set()
    def add_pair(r):
        for a, b in itertools.combinations(SUITS, 2): combos.add(frozenset({(RV[r], a), (RV[r], b)}))
    def add_suited(hi, lo):
        for s in SUITS: combos.add(frozenset({(RV[hi], s), (RV[lo], s)}))
    def add_offsuit(hi, lo):
        for a in SUITS:
            for b in SUITS:
                if a != b: combos.add(frozenset({(RV[hi], a), (RV[lo], b)}))
    for tok in spec.split(','):
        tok = tok.strip(); plus = tok.endswith('+'); tok = tok.rstrip('+')
        if len(tok) == 2 and tok[0] == tok[1]:  # pair
            start = RANKS.index(tok[0])
            for r in (RANKS[start:] if plus else [tok[0]]): add_pair(r)
        else:
            hi, lo, kind = tok[0], tok[1], tok[2]
            los = RANKS[RANKS.index(lo):RANKS.index(hi)] if plus else [lo]
            for l in los: (add_suited if kind == 's' else add_offsuit)(hi, l)
    return combos

HERO = [card('As'), card('Kh')]
RANGE = expand_range('22+,A9s+,KTs+,QTs+,JTs,ATo+,KQo')
DECK = [(RV[r], s) for r in RANKS for s in SUITS]

def equity(board):
    dead = set(HERO) | set(board)
    win = tie = lose = 0
    for combo in RANGE:
        if combo & dead: continue
        vill = list(combo)
        rem = [c for c in DECK if c not in dead and c not in combo]
        need = 5 - len(board)
        for run in itertools.combinations(rem, need):
            b = list(board) + list(run)
            h, v = best7(HERO + b), best7(vill + b)
            if h > v: win += 1
            elif h < v: lose += 1
            else: tie += 1
    n = win + tie + lose
    return (win + tie / 2) / n * 100, win / n * 100, tie / n * 100, lose / n * 100, n

for name, b in [('flop', ['Qs', 'Th', '2c']), ('turn', ['Qs', 'Th', '2c', 'Jd']), ('river', ['Qs', 'Th', '2c', 'Jd', '7c'])]:
    eq, w, t, l, n = equity([card(x) for x in b])
    print(f"{name:6} {' '.join(b):18} equity {eq:5.2f}%   win {w:5.2f}  tie {t:5.2f}  lose {l:5.2f}   ({n} runouts x combos)")
print('pot odds: bet 4 into pot 6 -> need', round(4 / (6 + 4 + 4) * 100, 1), '%')
print('range combos total:', len(RANGE))
