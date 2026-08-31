#!/usr/bin/env python3
"""
Encode the adhan master recordings into the Android notification-sound resources.

Sources live in audio-sources/ (not shipped, not tracked). Output goes straight
to android/app/src/main/res/raw/ as Ogg/Opus, which is the only copy that ends
up in the APK - the settings preview player reads the same files by raw resource
name, so nothing is duplicated into the JS bundle.

Pipeline per file:
  - downmix to mono          (notification audio plays through one speaker; two
                              of the masters are already dual-mono anyway)
  - trim leading/trailing silence
  - loudnorm to -14 LUFS     (the masters span -9.6 to -24.0 LUFS, so switching
                              muezzin would otherwise change the volume 4x.
                              -14 is chosen to sit within ~1 dB of the adhan
                              that shipped in 1.0.30 at -13.1 LUFS, so the
                              update doesn't quietly turn everyone's adhan
                              down. Two-pass, because single-pass loudnorm
                              guesses and can miss the target by 2-3 dB.)
  - Opus @ 48 kbps           (the 320 kbps masters are transcodes with a hard
                              16 kHz brick wall, so there is no detail to keep)

Usage:  python scripts/optimize-adhans.py [--dry-run]

Requires ffmpeg on PATH.
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'audio-sources')
OUT_DIR = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'raw')

# voice id -> (cutted master, full master).  The voice id also drives the
# resource name (adhan_<id>_<variant>) and must stay [a-z0-9_] for aapt.
VOICES = {
    'imam_ridha':             ('imam_ridha_adhan_cutted.mp3',                  'imam-ridha-adhan-full.mp3'),
    'adel_karbalai':          ('adhan-adel-karbalai_cutted.mp3',               'adhan-adel-karbalai_full.mp3'),
    'ali_rabeii':             ('adhan-ali-rabeii_cutted.mp3',                  'adhan-ali-rabeii_full.mp3'),
    'hajj_mostapha_sarraf':   ('adhan-hajj-mostapha-sarraf_cutted.mp3',        'adhan-hajj-mostapha-sarraf_full.mp3'),
    'sheikh_shibr_maela':     ('adhan-imam-ali-sheikh-shibr-maela-cutted.mp3', 'adhan-imam-ali-sheikh-shibr-maela-full.mp3'),
    'hajj_ali_kaebi':         ('hajj-ali-kaebi_cutted.mp3',                    'hajj-ali-kaebi_full.mp3'),
    'hajj_ossama_karbalai':   ('hajj-ossama-karbalai_cutted.mp3',              'hajj-ossama-karbalai_full.mp3'),
    'seyyed_mostapha_ghalebi': ('seyyed-mostapha-ghalebi_cutted.mp3',          'seyyed-mostapha-ghalebi_full.mp3'),
}

TRIM = ('silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,'
        'areverse,'
        'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,'
        'areverse')
TARGET_I = -14.0    # matches the 1.0.30 adhan (-13.1 LUFS) closely enough
TARGET_TP = -1.5
TARGET_LRA = 11.0
# Opus reconstruction overshoots the PCM peak by ~3 dB on this material, which
# would push the louder recitations past 0 dBFS. Limiting before the encoder
# pulls that back without costing any measured loudness.
LIMITER = 'alimiter=limit=0.708:level=false'   # 0.708 ~= -3 dBFS
BITRATE = '48k'


def _measure(src):
    """Pass 1: ask loudnorm what the trimmed mono signal actually measures."""
    out = subprocess.run(
        ['ffmpeg', '-hide_banner', '-i', src, '-map', '0:a:0', '-ac', '1',
         '-af', f'{TRIM},loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json',
         '-f', 'null', '-'],
        capture_output=True, text=True,
    ).stderr
    # The JSON block is the last thing loudnorm writes to stderr.
    start = out.rindex('{')
    end = out.index('}', start) + 1
    return json.loads(out[start:end])


def encode(src, dst):
    m = _measure(src)
    # Pass 2: feed the measurements back so loudnorm corrects exactly rather
    # than guessing from a look-ahead window.
    normalize = (
        f'loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}'
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
        f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
        f":offset={m['target_offset']}:linear=true"
    )
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', '-i', src,
         # Several masters carry embedded cover art, which ffmpeg's default
         # stream selection happily maps into the Ogg as a Theora video track.
         # Android then opens the file, sees video on stream 0, and plays
         # nothing. Take the audio track only, and leave the tags behind.
         '-map', '0:a:0', '-map_metadata', '-1', '-vn',
         '-ac', '1',
         '-af', f'{TRIM},{normalize},{LIMITER}',
         '-c:a', 'libopus', '-b:a', BITRATE, '-application', 'audio', '-vbr', 'on',
         dst],
        check=True,
    )


def write_keep_rules(sound_names):
    """
    res/raw sounds are referenced only by name from JS, so the resource shrinker
    cannot see them. Regenerate the keep rules here so they always match the
    audio that was just written.

    The filename matters. Metro emits its own res/raw/keep.xml naming the icon
    font assets, and the resource merger lets that generated copy win over
    anything src/main/res/raw contributes - so a file called keep.xml here is
    silently replaced and the sounds get shrunk away. keep_adhan_sounds.xml is a
    name Metro never writes, so both files survive into the merged resources.
    AGP's ToolsAttributeUsageRecorder walks every *.xml under res/raw and reads
    tools:keep off any <resources> root, so the name is free to be anything.

    values/ is not an option: tools:keep on a <resources> element there is
    dropped when the file is compiled into resources.arsc, and the rules with it.
    """
    keep = ','.join(f'@raw/{n}' for n in sound_names)

    with io.open(os.path.join(OUT_DIR, 'keep_adhan_sounds.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                '<resources xmlns:tools="http://schemas.android.com/tools"\n'
                f'    tools:keep="{keep}" />\n')


def main():
    dry_run = '--dry-run' in sys.argv

    missing = [f for pair in VOICES.values() for f in pair
               if not os.path.exists(os.path.join(SRC_DIR, f))]
    if missing:
        print('Missing masters in audio-sources/:', *missing, sep='\n  ')
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    total_src = total_out = 0
    sound_names = []

    for voice_id, (cutted, full) in VOICES.items():
        for variant, src_name in (('cutted', cutted), ('full', full)):
            src = os.path.join(SRC_DIR, src_name)
            name = f'adhan_{voice_id}_{variant}'
            sound_names.append(name)
            dst = os.path.join(OUT_DIR, f'{name}.ogg')
            if not dry_run:
                encode(src, dst)
            src_mb = os.path.getsize(src) / 1048576
            out_mb = os.path.getsize(dst) / 1048576 if os.path.exists(dst) else 0
            total_src += src_mb
            total_out += out_mb
            print(f'  {os.path.basename(dst):<44}{src_mb:>7.2f}M ->{out_mb:>7.2f}M')

    if not dry_run:
        write_keep_rules(sorted(sound_names))
        print(f'\n  keep rules regenerated for {len(sound_names)} sounds')

    saved = 100 - 100 * total_out / total_src if total_src else 0
    print(f'\n  {"TOTAL":<44}{total_src:>7.1f}M ->{total_out:>7.1f}M   ({saved:.0f}% smaller)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
