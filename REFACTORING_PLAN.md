# Refactoring Plan

Generated: February 24, 2026  
Current state: `App.js` 2025 lines · `Settings.js` 996 lines · `styles.js` 656 lines

Each phase is self-contained and shippable. Stop at any phase and the app remains fully functional. Phases are ordered from zero-risk to most invasive.

---

## Phase 1 — Delete Dead Files ✂️
**Risk: None** · **Effort: 5 min**

These files are either completely empty or fully written but never imported anywhere in the codebase.

| File | Reason |
|---|---|
| `services/AlarmBypassScheduler.js` | Empty file, zero bytes, never imported |
| `utils/NotificationPermissionManager.js` | Empty file, zero bytes, never imported |
| `context/TimeFormatContext.js` | Full implementation, but zero imports — superseded by `useSettings()` |
| `components/NextPrayerWidget.js` | Never imported in the app; also calls `useSettings()` keys that don't exist (`selectedCity`, `timeFormat24h`, `arabicNumerals`) |

**Steps:**
1. `git grep -r "AlarmBypassScheduler\|NotificationPermissionManager\|TimeFormatContext\|NextPrayerWidget"` — confirm zero hits outside own file.
2. Delete all four files.
3. Run the app and verify no crash.

---

## Phase 2 — Remove Unused Dependency 📦
**Risk: None** · **Effort: 5 min**

`package.json` declares two async-storage packages. The app uses only the modern scoped one.

```
"react-native-async-storage": "^0.0.1"   ← deprecated stub, never imported
"@react-native-async-storage/async-storage": "2.2.0"  ← the real one (keep)
```

**Steps:**
1. `yarn remove react-native-async-storage`
2. Rebuild (`expo run:android`) and verify no broken imports.

---

## Phase 3 — Extract Shared Prayer Constants 🗂️
**Risk: Low** · **Effort: 15 min**

`PRAYER_ICONS` and `getIconComponent` are copy-pasted identically in both `App.js` and `components/PrayerRow.js`. Move them to a single source of truth.

**Create:** `constants/prayerConfig.js`

```js
// constants/prayerConfig.js
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
  beirut: { en: "Beirut", ar: "بيروت" },
  tyre: { en: "Tyre", ar: "صور" },
  saida: { en: "Saida", ar: "صيدا" },
  baalbek: { en: "Baalbek", ar: "بعلبك" },
  hermel: { en: "Hermel", ar: "الهرمل" },
  tripoli: { en: "Tripoli", ar: "طرابلس" },
  "nabatieh-bintjbeil": { en: "Nabatieh-Bint Jbeil", ar: "النبطية-بنت جبيل" },
};

export const LOCATION_ICONS = {
  beirut: "city",
  tyre: "beach",
  saida: "waves",
  baalbek: "pillar",
  hermel: "mountain",
  tripoli: "lighthouse",
  "nabatieh-bintjbeil": "home-group",
};

export const getIconComponent = (prayerKey) => {
  if (prayerKey === 'fajr' || prayerKey === 'maghrib') return Feather;
  if (prayerKey === 'asr') return MaterialIcons;
  return Ionicons;
};
```

**Then in `App.js`:**
- Remove the inline declarations of `PRAYER_ICONS`, `LOCATION_NAMES`, `LOCATION_ICONS`, `getIconComponent`, and the `prayerOrder` inline array.
- Add: `import { PRAYER_ICONS, LOCATION_NAMES, LOCATION_ICONS, PRAYER_ORDER, getIconComponent } from './constants/prayerConfig';`

**Then in `components/PrayerRow.js`:**
- Remove the local `PRAYER_ICONS` and `getIconComponent` declarations.
- Add: `import { PRAYER_ICONS, getIconComponent } from '../constants/prayerConfig';`

**Verify:** App renders correctly, prayer icons appear, location names display.

---

## Phase 4 — Remove Duplicate `convertToArabicNumerals` in App.js 🔁
**Risk: Low** · **Effort: 10 min**

`App.js` defines its own `convertToArabicNumerals` as a `useCallback` (line 764) even though `toArabicNumerals` from `utils/timeFormatters.js` is already imported and used in the same file (line 50 and 323). They are identical logic.

**Steps:**
1. Delete the `convertToArabicNumerals` `useCallback` definition in `MainApp` (lines ~764–775).
2. Find all 3 call sites in `App.js` that use `convertToArabicNumerals(...)` and replace with `toArabicNumerals(...)`.
   - `formatDate` callback: replace `convertToArabicNumerals(dayNum, lang)` → `lang === 'ar' ? toArabicNumerals(String(dayNum)) : String(dayNum)`
   - `formattedHijriDate` memo: replace the two `convertToArabicNumerals(String(day), 'ar')` / `convertToArabicNumerals(String(year), 'ar')` → `toArabicNumerals(String(day))` / `toArabicNumerals(String(year))`
3. Remove `convertToArabicNumerals` from the `useCallback` dependency arrays of `formatDate` and `formattedHijriDate`.

**Verify:** Arabic numerals still display in date headers.

---

## Phase 5 — Extract Inline Components out of App.js 🧩
**Risk: Low–Medium** · **Effort: 45 min**

Four components are defined inside `App.js` but are completely self-contained. Extract each one to its own file. Do them one at a time; ship and test after each.

### 5a — `components/TodayIndicator.js`
Currently: `App.js` lines ~394–425  
No props except `isDarkMode`. Trivially portable.

### 5b — `components/QuoteIconButton.js`
Currently: `App.js` lines ~427–470  
Props: `isDarkMode`, `onPress`. Trivially portable.

### 5c — `components/LocationItem.js`
Currently: `App.js` lines ~472–535  
Props: `loc`, `locDisplay`, `isSelected`, `isDarkMode`, `onPress`.  
After Phase 3, it imports `LOCATION_ICONS` from `constants/prayerConfig`.

### 5d — `components/Countdown.js`
Currently: `App.js` lines ~240–390  
This is the largest. It uses: `useSettings`, `useEffect`, `useState`, `useRef`, `PRAYER_ICONS`, `getIconComponent`, `getCountdownLabel`, `toArabicNumerals`, `ProgressBar`, and several icon packages.  
Move `getCountdownLabel` helper into this file (it is only used here).

**For each sub-step:**
1. Create the new file with the extracted component JSX + logic.
2. Add the import in `App.js`.
3. Remove the component definition from `App.js`.
4. Build and run. Check the affected UI area manually.

---

## Phase 6 — Move Background Handler to `index.js` 📦
**Risk: Low** · **Effort: 20 min**

`notifee.onBackgroundEvent(...)` (~45 lines) lives inside `App.js` (lines ~173–222) at module scope. React Native's background event handler should be registered in `index.js` (the app entry point), not inside the UI module.

**Steps:**
1. Cut the entire `notifee.onBackgroundEvent(async ({ type, detail }) => { ... });` block from `App.js`.
2. Paste it into `index.js`, before the `registerRootComponent` call.
3. Move the imports it needs (`schedulePrayerNotificationsRaw`, `scheduleNightlyRefreshTrigger`) from `App.js` to `index.js`. Keep them in `App.js` too only if still used there — verify with a grep.
4. Remove the `notifee`, `EventType` imports from `App.js` if they are no longer used elsewhere in that file (they are used — `EventType` is only used in the handler, `notifee` is used for `requestPermission` etc. Check per-symbol).

**Verify:** Kill the app, let a notification trigger in the background, confirm it fires correctly.

---

## Phase 7 — Centralize Translations 🌐
**Risk: Medium** · **Effort: 60 min**

`TRANSLATIONS` is independently defined in 5 files with different key sets. Centralize per-domain to eliminate drift.

**Create:** `constants/translations/` directory with one file per domain.

| New file | Replaces TRANSLATIONS in |
|---|---|
| `constants/translations/app.js` | `App.js` |
| `constants/translations/settings.js` | `components/Settings.js` |
| `constants/translations/notifications.js` | `hooks/useNotificationScheduler.js` |
| `constants/translations/calendar.js` | `components/Calendar.js` |
| `constants/translations/monthTransition.js` | `components/MonthTransitionNotice.js` |

Each new file exports a single `TRANSLATIONS` object identically shaped to what currently exists in the original file. This keeps the consuming code change minimal — only the import line changes.

**Steps (do one file at a time):**
1. Create the new `constants/translations/<domain>.js` file by copying the existing `TRANSLATIONS` object.
2. In the source file, delete the local `const TRANSLATIONS = { ... }` and add the import.
3. Build. Test that all translated strings display correctly in both Arabic and English.
4. Repeat for the next domain.

**Note:** `ARABIC_MONTHS` in `MonthTransitionNotice.js` duplicates the months array already present in `App.js`'s translations. When creating `constants/translations/app.js`, export `ARABIC_MONTHS` from there and import it in `MonthTransitionNotice.js`.

---

## Phase 8 — Split `Settings.js` into Sections 🔧
**Risk: Medium** · **Effort: 60 min**

`Settings.js` (996 lines) is one screen that renders 5 fully independent sections. Decompose into section components that the parent `Settings.js` just composes together.

**Create folder:** `components/settings/`

| New Component | Responsibility |
|---|---|
| `settings/AppearanceSection.js` | Dark mode toggle, language selector |
| `settings/NotificationsSection.js` | Sound toggle, alarm permission, battery optimization |
| `settings/HijriDateSection.js` | Hijri offset slider, time format toggle, Arabic numerals |
| `settings/UpdatesSection.js` | Update prayer times button |
| `settings/FeedbackSection.js` | Rate app button, app version display |

**Each section receives as props:** `settings`, `translations`, `isDarkMode`, `language` — plus any section-specific callbacks already called inside `Settings.js`. No new state is introduced.

**Steps:**
1. Create one section file at a time. Copy the relevant JSX block and StyleSheet entries from `Settings.js`.
2. Import and render the section inside `Settings.js` where the block was.
3. Build and visually verify the section.
4. After all sections are extracted, `Settings.js` should shrink to ~150 lines (just layout/scroll container + section composition).

---

## Phase 9 — Split `styles.js` 🎨
**Risk: Low** · **Effort: 30 min**

`styles.js` (656 lines) is a single global `StyleSheet.create` call covering all screens. This causes all style objects to be parsed at startup regardless of whether the screen is visited.

**Strategy:** Create scoped style files; keep `styles.js` exporting everything unchanged as a compatibility shim until all imports are migrated.

| New file | Used by |
|---|---|
| `styles/appStyles.js` | `App.js` header, navigation bar, card, countdown |
| `styles/prayerStyles.js` | `PrayerRow.js`, `PrayersList.js` |
| `styles/settingsStyles.js` | `components/Settings.js` and its sub-sections |
| `styles/calendarStyles.js` | `components/Calendar.js` |
| `styles/skeletonStyles.js` | `components/SkeletonLoader.js` |

**Steps:**
1. Identify which style keys are used by which file (grep for each style name).
2. Create the scoped file and move the relevant key(s) into it.
3. Update the import in the consuming file.
4. Once all files are migrated, `styles.js` can be deleted.

**Note:** Do not rush Phase 9. The biggest payoff is Phases 1–5.

---

## Summary: Effort vs. Impact

| Phase | Effort | App size reduction | Risk |
|---|---|---|---|
| 1 — Delete dead files | 5 min | ~350 lines gone | ✅ None |
| 2 — Remove stale dep | 5 min | 1 package removed | ✅ None |
| 3 — Shared prayer constants | 15 min | ~40 duplicate lines | ✅ Low |
| 4 — Remove duplicate converter | 10 min | ~15 lines from MainApp | ✅ Low |
| 5 — Extract inline components | 45 min | ~350 lines from App.js | ⚠️ Low–Med |
| 6 — Move background handler | 20 min | ~50 lines from App.js | ⚠️ Low–Med |
| 7 — Centralize translations | 60 min | ~300 duplicate lines | ⚠️ Medium |
| 8 — Split Settings.js | 60 min | Settings: 996 → ~150 lines | ⚠️ Medium |
| 9 — Split styles.js | 30 min | Faster startup | ⚠️ Low |

**After Phases 1–6 alone:** `App.js` drops from 2025 → ~1600 lines, all dead weight is gone, background logic is in the right place.  
**After all phases:** `App.js` should sit around **~900 lines** of pure composition logic.

---

## Before Starting Any Phase

```bash
# Confirm clean working state
git status
git stash   # if needed

# Always create a branch per phase
git checkout -b refactor/phase-1-delete-dead-files
```

Complete each phase on its own branch, merge, then start the next. This keeps git history readable and makes rollbacks surgical.
