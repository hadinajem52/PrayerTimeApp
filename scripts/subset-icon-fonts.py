#!/usr/bin/env python3
"""
Subset the @expo/vector-icons fonts down to the glyphs this app actually draws.

The six icon families the app imports ship 3.0 MB of TTF between them, and every
byte lands in res/raw because Metro bundles the whole font as an asset. The app
draws about fifty glyphs. Subsetting turns 3.0 MB into a few tens of KB, which
is the single largest saving available that costs nothing at runtime.

Which glyphs to keep is derived from the source rather than hand-listed, so a
new icon can never silently turn into a tofu box: every string literal in the
app is intersected with each family's glyph map, and anything that *could* be
an icon name is kept. That over-approximates - "close" and "star" are kept for
every family that has them, not just the one that uses them - which is the safe
direction to be wrong in and still lands well under 100 KB.

Output goes to assets/fonts/, and metro.config.js redirects the vendored font
paths there, so node_modules stays untouched and npm install cannot undo this.

Usage:  python scripts/subset-icon-fonts.py [--dry-run]

Requires fonttools (pip install fonttools).
"""

import io
import json
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(ROOT, 'node_modules', '@expo', 'vector-icons', 'build',
                      'vendor', 'react-native-vector-icons')
OUT_DIR = os.path.join(ROOT, 'assets', 'fonts')

# Source directories to scan for icon names. Anything outside this list cannot
# reach an <Icon name=...> prop.
SCAN_DIRS = ['components', 'hooks', 'services', 'utils', 'constants', 'styles']
SCAN_FILES = ['App.js', 'index.js', 'QiblaFinderWebView.js']
SCAN_EXTS = ('.js', '.jsx', '.ts', '.tsx')

# family -> the ttf files @expo/vector-icons requires for it. FontAwesome5 and
# FontAwesome6 each pull three faces regardless of which one you render, so all
# three have to be produced even though the app only ever asks for `solid`.
FAMILIES = {
    'Feather':                ['Feather.ttf'],
    'FontAwesome5':           ['FontAwesome5_Solid.ttf', 'FontAwesome5_Regular.ttf',
                               'FontAwesome5_Brands.ttf'],
    'FontAwesome6':           ['FontAwesome6_Solid.ttf', 'FontAwesome6_Regular.ttf',
                               'FontAwesome6_Brands.ttf'],
    'Ionicons':               ['Ionicons.ttf'],
    'MaterialCommunityIcons': ['MaterialCommunityIcons.ttf'],
    'MaterialIcons':          ['MaterialIcons.ttf'],
}

# glyph map to read per family (FontAwesome5/6 share one map across their faces)
GLYPHMAPS = {
    'Feather':                'Feather.json',
    'FontAwesome5':           'FontAwesome5Free.json',
    'FontAwesome6':           'FontAwesome6Free.json',
    'Ionicons':               'Ionicons.json',
    'MaterialCommunityIcons': 'MaterialCommunityIcons.json',
    'MaterialIcons':          'MaterialIcons.json',
}

# Every quoted string in the app. Icon names are kebab-case words, so anything
# with a space, slash, or capital letter cannot be one and is dropped early to
# keep the intersection cheap.
STRING_RE = re.compile(r"""['"`]([a-z0-9][a-z0-9-]{1,40})['"`]""")


def source_strings():
    seen = set()
    paths = [os.path.join(ROOT, f) for f in SCAN_FILES]
    for d in SCAN_DIRS:
        for root, dirs, files in os.walk(os.path.join(ROOT, d)):
            dirs[:] = [x for x in dirs if x != 'node_modules']
            paths += [os.path.join(root, f) for f in files if f.endswith(SCAN_EXTS)]
    for p in paths:
        if not os.path.exists(p):
            continue
        with io.open(p, encoding='utf-8', errors='ignore') as f:
            seen.update(STRING_RE.findall(f.read()))
    return seen


def load_glyphmap(name):
    path = os.path.join(VENDOR, 'glyphmaps', name)
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def subset_font(src, dst, codepoints):
    font = TTFont(src)
    opts = subset.Options()
    # Icon fonts carry no meaningful layout features and the renderer addresses
    # glyphs by codepoint, so everything except the outlines and cmap can go.
    opts.layout_features = []
    opts.name_IDs = ['*']
    opts.name_legacy = True
    opts.notdef_outline = False
    opts.recalc_bounds = True
    opts.drop_tables += ['DSIG']
    s = subset.Subsetter(options=opts)
    s.populate(unicodes=codepoints)
    s.subset(font)
    font.save(dst)
    font.close()


def main():
    dry_run = '--dry-run' in sys.argv
    strings = source_strings()
    print(f'  scanned source: {len(strings)} candidate names\n')

    if not os.path.isdir(VENDOR):
        print(f'Cannot find vendored fonts at {VENDOR}')
        return 1
    if not dry_run:
        os.makedirs(OUT_DIR, exist_ok=True)

    total_src = total_out = 0
    for family, faces in FAMILIES.items():
        glyphmap = load_glyphmap(GLYPHMAPS[family])
        names = sorted(n for n in strings if n in glyphmap)
        codepoints = {glyphmap[n] for n in names}
        if not codepoints:
            print(f'  {family}: no glyphs matched - skipping')
            continue
        print(f'  {family}: {len(names)} glyphs -> {", ".join(names)}')
        for face in faces:
            src = os.path.join(VENDOR, 'Fonts', face)
            dst = os.path.join(OUT_DIR, face)
            src_kb = os.path.getsize(src) / 1024
            if not dry_run:
                subset_font(src, dst, codepoints)
            out_kb = os.path.getsize(dst) / 1024 if os.path.exists(dst) else 0
            total_src += src_kb
            total_out += out_kb
            print(f'      {face:<32}{src_kb:>9.1f}K ->{out_kb:>8.1f}K')

    saved = 100 - 100 * total_out / total_src if total_src else 0
    print(f'\n  {"TOTAL":<36}{total_src:>9.1f}K ->{total_out:>8.1f}K   ({saved:.1f}% smaller)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
