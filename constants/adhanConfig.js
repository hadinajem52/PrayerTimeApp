/**
 * Catalogue of the bundled adhan recordings.
 *
 * Each voice ships two variants, both living in android/app/src/main/res/raw as
 * `adhan_<id>_<variant>.ogg` (Ogg/Opus, mono, loudness-normalised - see
 * scripts/optimize-adhans.py).  The same files back both the notification
 * channel sound and the in-app preview player, so there is only ever one copy
 * in the APK.
 *
 * `id` doubles as part of the Android resource name, so it must stay
 * [a-z0-9_] - aapt rejects anything else.
 */

export const ADHAN_VOICES = [
  {
    id: 'imam_ridha',
    name: { en: 'Imam Ridha Shrine', ar: 'حرم الإمام الرضا' },
  },
  {
    id: 'sheikh_shibr_maela',
    name: { en: 'Imam Ali Shrine - Sheikh Shibr Maela', ar: 'حرم الإمام علي - الشيخ شبر معلى' },
  },
  {
    id: 'adel_karbalai',
    name: { en: 'Adhan by Qari Adel Al-Karbalai', ar: 'الأذان بصوت القارئ عادل الكربلائي' },
  },
  {
    id: 'ali_rabeii',
    name: { en: 'Adhan by Qari Ali Al-Rabeii', ar: 'الأذان بصوت القارئ علي الربيعي' },
  },
  {
    id: 'hajj_mostapha_sarraf',
    name: { en: 'Adhan by Hajj Mostapha Al-Sarraf', ar: 'الأذان بصوت الحاج مصطفى الصراف' },
  },
  {
    id: 'hajj_ali_kaebi',
    name: { en: 'Adhan by Hajj Ali Al-Kaabi', ar: 'الأذان بصوت الحاج علي الكعبي' },
  },
  {
    id: 'hajj_ossama_karbalai',
    name: { en: 'Adhan by Hajj Ossama Al-Karbalai', ar: 'الأذان بصوت الحاج اسامة الكربلائي' },
  },
  {
    id: 'seyyed_mostapha_ghalebi',
    name: { en: 'Adhan by Seyyed Mostapha Al-Ghalebi', ar: 'الأذان بصوت السيد مصطفى الغالبي' },
  },
];

export const DEFAULT_ADHAN_VOICE = 'imam_ridha';
export const DEFAULT_ADHAN_FULL = false; // false = shortened recitation

/** Resource name in res/raw, which is also what notifee wants for `sound`. */
export function adhanSoundName(voiceId, useFullVersion) {
  return `adhan_${voiceId}_${useFullVersion ? 'full' : 'cutted'}`;
}

/**
 * A channel's sound is immutable once Android has created it, so every
 * voice/variant pair needs its own channel. Bump the suffix if the underlying
 * audio ever changes so existing installs pick the new file up.
 */
export function adhanChannelId(voiceId, useFullVersion) {
  return `prayer-sound-${voiceId}-${useFullVersion ? 'full' : 'cutted'}-v3`;
}

/** Every channel id this module can produce starts with this. */
export const ADHAN_CHANNEL_PREFIX = 'prayer-sound-';

export function isKnownAdhanVoice(voiceId) {
  return ADHAN_VOICES.some(v => v.id === voiceId);
}

export function getAdhanVoice(voiceId) {
  return ADHAN_VOICES.find(v => v.id === voiceId)
    || ADHAN_VOICES.find(v => v.id === DEFAULT_ADHAN_VOICE);
}

export function getAdhanVoiceName(voiceId, language = 'en') {
  const voice = getAdhanVoice(voiceId);
  return voice.name[language] || voice.name.en;
}
