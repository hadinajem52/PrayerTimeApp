const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @expo/vector-icons requires a whole icon font per family (3.0 MB across the
// six families this app imports), and Metro copies each one into res/raw whole.
// scripts/subset-icon-fonts.py writes glyph-subset copies of those same faces
// into assets/fonts/; redirect the vendored requires there so the APK carries
// ~38 KB of font instead. Falls through to the original font if a subset is
// missing, so a fresh checkout that has not run the script still builds.
const SUBSET_DIR = path.join(__dirname, 'assets', 'fonts');
const VENDOR_FONTS = 'vendor/react-native-vector-icons/Fonts/';

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.ttf') && moduleName.includes(VENDOR_FONTS)) {
    const subset = path.join(SUBSET_DIR, path.basename(moduleName));
    if (fs.existsSync(subset)) {
      return { type: 'assetFiles', filePaths: [subset] };
    }
  }
  return (upstreamResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
