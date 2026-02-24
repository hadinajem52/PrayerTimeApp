import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const PRAYER_ORDER = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];

export const PRAYER_ICONS = {
  imsak: 'cloudy-night',
  fajr: 'sunrise',
  shuruq: 'partly-sunny',
  dhuhr: 'sunny',
  asr: 'sunny-snowing',
  maghrib: 'sunset',
  isha: 'moon-outline',
  midnight: 'moon',
};

export const LOCATION_NAMES = {
  beirut: { en: 'Beirut', ar: 'بيروت' },
  tyre: { en: 'Tyre', ar: 'صور' },
  saida: { en: 'Saida', ar: 'صيدا' },
  baalbek: { en: 'Baalbek', ar: 'بعلبك' },
  hermel: { en: 'Hermel', ar: 'الهرمل' },
  tripoli: { en: 'Tripoli', ar: 'طرابلس' },
  'nabatieh-bintjbeil': { en: 'Nabatieh-Bint Jbeil', ar: 'النبطية-بنت جبيل' },
};

export const LOCATION_ICONS = {
  beirut: 'city',
  tyre: 'beach',
  saida: 'waves',
  baalbek: 'pillar',
  hermel: 'mountain',
  tripoli: 'lighthouse',
  'nabatieh-bintjbeil': 'home-group',
};

export const getIconComponent = (prayerKey) => {
  if (prayerKey === 'fajr' || prayerKey === 'maghrib') return Feather;
  if (prayerKey === 'asr') return MaterialIcons;
  return Ionicons;
};
