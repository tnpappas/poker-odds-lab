#!/usr/bin/env python3
"""Assemble a MindPilot Pro HeyGen clip into a finished social video.

Usage: python3 assemble_mp_video.py <clean_clip.mp4> <captions.srt> <endscreen.png> <out.mp4> [highlight_hex] [caption_y]
  highlight_hex defaults to #1BB6D8 (MindPilot cyan). Poker Logic Lab uses #DEB25C (gold).

Steps:
  1. Convert the HeyGen SRT into a styled ASS file with word by word cyan highlight
     (Roboto Condensed Bold 72, white text, black outline + shadow, centered at y=1500).
  2. Burn the captions into the clip.
  3. Build a 4 second end screen clip from the PNG (with silent audio).
  4. Join the two with a 1 second crossfade (video xfade + audio acrossfade).
"""
import os
import re
import subprocess
import sys

CLIP, SRT, ENDSCREEN, OUT = sys.argv[1:5]
HIGHLIGHT_HEX = sys.argv[5] if len(sys.argv) > 5 else "#1BB6D8"  # brand highlight color
CAP_Y = int(sys.argv[6]) if len(sys.argv) > 6 else 1500  # caption center Y; use ~1340 for seated looks where hands rest at 1500
WORKDIR = os.path.dirname(os.path.abspath(OUT)) or "."
FONT_DIR = os.path.dirname(os.path.abspath(__file__))
END_SECONDS = 4.0
FADE_SECONDS = 1.0
FPS = 25
MAX_WORDS = 5

# Colors in ASS are &HAABBGGRR (BGR order)
WHITE = "&H00FFFFFF"
_h = HIGHLIGHT_HEX.lstrip("#")
CYAN = "&H00" + _h[4:6] + _h[2:4] + _h[0:2]   # ASS uses BGR order
BLACK = "&H00000000"


def srt_time(t):
    h, m, rest = t.split(":")
    s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def ass_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def parse_srt(path):
    text = open(path, encoding="utf-8-sig").read().strip()
    cues = []
    for block in re.split(r"\n\s*\n", text):
        lines = block.strip().splitlines()
        if len(lines) < 3:
            continue
        start, end = [srt_time(x.strip()) for x in lines[1].split("-->")]
        words = " ".join(lines[2:]).split()
        # Split long cues (the HeyGen UI export uses long lines) into chunks of
        # at most MAX_WORDS so every caption is short and reads the same way.
        n = len(words)
        chunks = max(1, -(-n // MAX_WORDS))
        per = -(-n // chunks)
        step = (end - start) / n
        for c in range(chunks):
            w = words[c * per:(c + 1) * per]
            if not w:
                continue
            cs = start + (c * per) * step
            ce = end if c == chunks - 1 else start + ((c + 1) * per) * step
            cues.append((cs, ce, w))
    return cues


def build_ass(cues, path):
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Roboto Condensed,72,{WHITE},{CYAN},{BLACK},&H80000000,-1,0,0,0,100,100,0,0,1,3,2,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for start, end, words in cues:
        n = len(words)
        step = (end - start) / n
        for i in range(n):
            ws = start + i * step
            we = end if i == n - 1 else start + (i + 1) * step
            parts = []
            for j, w in enumerate(words):
                if j == i:
                    parts.append(f"{{\\c{CYAN}}}{w}{{\\c{WHITE}}}")
                else:
                    parts.append(w)
            text = "{\\pos(540," + str(CAP_Y) + ")}" + " ".join(parts)
            events.append(f"Dialogue: 0,{ass_time(ws)},{ass_time(we)},Cap,,0,0,0,,{text}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events) + "\n")


def run(cmd):
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def duration(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", path]).decode().strip()
    return float(out)


ass_path = os.path.join(WORKDIR, "_captions.ass")
captioned = os.path.join(WORKDIR, "_captioned.mp4")
endclip = os.path.join(WORKDIR, "_endscreen.mp4")

build_ass(parse_srt(SRT), ass_path)

# 1. burn captions
run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", CLIP,
     "-vf", f"ass={ass_path}:fontsdir={FONT_DIR}",
     "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "18",
     "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", captioned])

# 2. end screen clip with silent stereo audio
run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
     "-loop", "1", "-framerate", str(FPS), "-i", ENDSCREEN,
     "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
     "-t", str(END_SECONDS),
     "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
     "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k",
     "-shortest", endclip])

# 3. crossfade join
offset = duration(captioned) - FADE_SECONDS
run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
     "-i", captioned, "-i", endclip,
     "-filter_complex",
     f"[0:v][1:v]xfade=transition=fade:duration={FADE_SECONDS}:offset={offset:.3f}[v];"
     f"[0:a][1:a]acrossfade=d={FADE_SECONDS}[a]",
     "-map", "[v]", "-map", "[a]",
     "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT])

for p in (ass_path, captioned, endclip):
    try:
        os.remove(p)
    except OSError:
        pass
print("DONE", OUT, f"{duration(OUT):.2f}s")
