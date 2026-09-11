# 💊 CareBridge — Clinical Medication Adherence & Caregiver Bridge for Seniors

[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-blue.svg)](https://expo.dev)
[![React Native 0.81](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/Storage-Local%20SQLite-003B57.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Notifications](https://img.shields.io/badge/Notifications-expo--notifications-orange.svg)](https://docs.expo.dev/versions/latest/sdk/notifications/)
[![RevenueCat](https://img.shields.io/badge/In--App%20Purchases-RevenueCat-E74C3C.svg)](https://www.revenuecat.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Shipathon 2026 Submission — Next Gen Award (Student Track)**  
> *Empowering elderly individuals and their caregivers with an accessible, high-contrast, local-first medication manager that bridges clinical compliance with human empathy.*

---

## 💡 Problem & Mission

As our population ages, **polypharmacy** (taking 4+ medications daily) becomes a dangerous hurdle for seniors. Cognitive decline, poor vision, tremors, and complex timing schedules lead to medication non-adherence—the leading cause of preventable elderly hospitalizations. Meanwhile, caregivers face constant stress and lack clear, timely records when communicating with physicians.

**CareBridge** resolves this by delivering:
1. **Senior-First Accessibility:** Giant touch targets (≥ 48×48px), bold typography, high contrast colors (`#1E3A8A` Navy on pure white), voice reading, and visual pill photos.
2. **Dual Experience:** Seamlessly transforms between an everyday mobile health tracker and an ambient, hands-free **Nightstand Desk Clock** (with Samsung Galaxy Z Fold / Flex Mode adaptation).
3. **Local Daily Push Notifications:** Automated offline-first dose alarms powered by `expo-notifications` without requiring cloud push servers or privacy-invasive tracking.
4. **Clinical Record Keeping:** Visual punch-card compliance matrix, vitals trend analytics, and 1-tap professional doctor PDF export.
5. **Local-First Privacy:** 100% offline-first architecture via local SQLite with zero latency and complete patient data ownership.

---

## ⚖️ Hackathon Judges & Evaluators Setup

> **Zero-Config Notice:** The app includes hardcoded public fallback test keys in `services/revenuecat.ts`. You can skip creating `.env` and run the project immediately out-of-the-box.

For hackathon evaluation and review, CareBridge includes RevenueCat test credentials pre-configured in `.env.example`:

1. **Create your local `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Environment Variables included:**
   ```env
   EXPO_PUBLIC_RC_ANDROID_KEY=goog_ljnYRHEnlYgxgoPbHMzpJbgpBkr
   EXPO_PUBLIC_RC_TEST_KEY=test_NBVokGjAXCxzSkUOhtioMYGEFLL
   ```
   - `EXPO_PUBLIC_RC_ANDROID_KEY`: Google Play production / sandbox key for RevenueCat.
   - `EXPO_PUBLIC_RC_TEST_KEY`: Development / test store key allowing judges to simulate In-App Purchases and unlock Pro tiers without actual billing.

3. **[Demo] Instant Unlock Pro (No Sandbox Store Account Needed):**
   - Inside the Paywall modal, tap **`[Demo] Instant Unlock Pro`** to immediately activate the CareBridge Pro tier on Expo Go, physical devices, or emulators where native Google Play / Apple StoreKit billing is unavailable. This instantly unlocks the Doctor Clinical PDF Export and 52-Week Habit Punch Card without requiring store sandbox credentials.
   - Evaluators can also tap **`[Judge Demo] Reset to Free Plan`** at any time to re-test the free tier restrictions.

   > **💡 Evaluator Tip — Instant Pro Access & Verification:**
   > 1. Tap **`[Demo] Instant Unlock Pro`** inside the Paywall → The header badge immediately turns green (**PRO ACTIVE**), unlocking unlimited prescriptions (beyond the 2-med free limit), 90-day vitals charts, and Doctor PDF Export.
   > 2. Open Paywall again and tap **`[Judge Demo] Reset to Free Plan`** → The badge reverts to amber (**UPGRADE PRO**), re-enabling the 2-prescription free-tier restriction.

---

## ✨ Key Features

### 1. 📅 Daily Medication Hub & Compliance Dashboard
- **Modern Clinical Health Interface:** Clean cards with pastel classification badges, pill doses, and one-touch "Take Dose" actions.
- **Care Routine Exemption from Free Limit:** Non-prescription daily care routines (e.g., hydration, morning walk, blood pressure check) are completely exempt from the 2-medication Free limit, enabling patients to track holistic daily health habits without hitting paywalls.
- **Hero Dashboard:** Real-time compliance score ring, contextual greeting, and today's vital summary.
- **Clinical Medication Diary & Symptom Tracking:** Seniors and caregivers can attach clinical notes and 1-tap symptom observations (`Taken with meal`, `Empty stomach`, `Mild dizziness`, `Nausea`, `Normal / No side effects`) directly to any dose. Notes are displayed as prominent actionable pills on medication cards and persisted in local SQLite.
- **Visual Pill Photo Identification (Visual ID):** Camera and gallery integration allowing seniors to recognize pills by sight rather than confusing generic chemical names.
- **Quick Vitals Bar:** Record Blood Pressure (Systolic/Diastolic), Blood Sugar, and Heart Rate directly from the home screen.

### 2. 🔔 Local Daily Push Notifications (`expo-notifications`)
- **Recurring Daily Alarms:** Automatically schedules daily recurring local push notifications for each prescription's exact reminder time ("HH:mm").
- **Zero-Latency Offline Triggers:** Powered entirely on-device via `expo-notifications` (`SchedulableTriggerInputTypes.DAILY`). No internet or remote push server needed.
- **Foreground Alert Banners:** Custom notification handler ensures alerts drop down with sound even while actively using the app.
- **Automatic Sync:** Adding, updating, or deleting prescriptions immediately reschedules or cancels corresponding notification alarms.

### 3. 🗓️ Full-Month Calendar Matrix & Habit Punch-Card
- **Full-Month Modal (30/31 Days):** Quick month navigation with color-coded adherence indicators:
  - 🟢 **100% Taken:** All scheduled doses taken.
  - 🟡 **Partial:** Some doses missed.
  - 🔴 **Missed:** No doses taken.
  - 🔵 **Active Selection:** Currently inspected day.
- **Habit Matrix Screen (`HistoryScreen.tsx`):** Interactive punch-card cards (`MedicationPunchCard.tsx`) displaying weekly compliance matrices across the year, continuous streak counters, adherence rates, and quick today check-in / delete actions with clean header alignment.

### 4. ⏰ Hands-Free Nightstand Desk Mode (Foldable / Flex Mode Support)
- **High-Contrast Night Clock:** Clean digital clock, upcoming dose countdown, and large tactile "I TOOK MY PILL" button.
- **Flex Mode Awareness:** Automatically pivots to dual-pane split layout when deployed on foldable devices (like Samsung Galaxy Z Fold) angled at 90 degrees or in landscape orientation.
- **Intelligent Gated Voice Guidance:** Integrated Text-to-Speech (`expo-speech`) automatically announces upcoming medication instructions ONLY when within a ±30-minute window of the scheduled dose time, and mutes immediately upon dose confirmation or when navigating away.

### 5. 📈 Vitals Analytics & Clinical PDF Report
- **Trend Charts with Zero-Crash Guard:** Interactive Line Charts (`react-native-chart-kit`) visualizing Blood Pressure, Blood Sugar, and Pulse variations over time. Includes division-by-zero chart safety with informative empty-state feedback when fewer than 2 consecutive data points are available.
- **Refactored A4 Clinical PDF Report:** Generates a structured clinical PDF with enlarged mobile-readable typography (32px titles, 36px metric callouts, 15px base text), high-contrast table hierarchy, and print pagination rules (`page-break-inside: avoid;`) preventing awkward row breaks across pages. Includes a **Detailed Intake Audit with Clinical Notes & Observations** (`expo-print`, `expo-sharing`) allowing physicians to evaluate real side effects alongside compliance.

### 6. 💎 In-App Purchases & CareBridge Pro (RevenueCat)
- **RevenueCat Integration:** Native In-App Purchase paywall unlocking Unlimited Prescriptions, Multi-month PDF Exports, and Deep Analytics.
- **Offline Entitlement Cache:** Pro status is cached locally so patients never lose access to their critical medical tools during network outages.
- **Interactive Judge Demo Controls:** The Paywall modal includes a **`[Demo] Instant Unlock Pro`** bypass button for testing on Expo Go / Simulators without billing accounts, alongside **`[Judge Demo] Reset to Free Plan`** to test paywall triggers repeatedly without clearing app data.

### 7. ⚡ 60fps Micro-Animations & Ergonomics
- **Native-Driver Animations:** Fluid, lightweight 60fps micro-interactions powered strictly by React Native's built-in `Animated` API with `useNativeDriver: true` (zero external animation library bloat, preserving 100% Expo Go compatibility).
- **Spring Tab Bar Buttons:** Tactile scale spring (`1.0 -> 1.06`) and haptic selection feedback on tab focus without causing sibling layout reflow.
- **Subtle Tab Switch Transitions:** Screen contents smoothly fade in and slide up (180ms ease-out) via the reusable `AnimatedScreenWrapper`.
- **Spring Pop-in Modals & Smooth Toast:** Modal cards gently pop in with scale and opacity springs (`CustomAlertModal`, `DoseNoteModal`), and toast alerts enter and exit with smooth vertical slide and fade transitions.

---

## 🏛️ Architecture & Project Structure

```
CareBridge/
├── App.tsx                        # App entry point, AlertProvider & Navigation
├── index.ts                       # Expo root registration
├── app.json                       # Expo configuration & plugins
├── package.json                   # Dependencies & build scripts
├── .env.example                   # Environment configuration template
├── src/
│   ├── components/                # Reusable accessible UI components
│   │   ├── AnimatedScreenWrapper.tsx # Reusable 60fps fade/slide screen transition wrapper
│   │   ├── CalendarStrip.tsx      # 7-day horizontal calendar with month picker
│   │   ├── FullMonthCalendarModal.tsx # 30/31-day modal with compliance dots
│   │   ├── MedicineCard.tsx       # Senior-friendly medication card with clinical note trigger
│   │   ├── MedicationPunchCard.tsx # Yearly adherence punch-card card with matrix grid
│   │   ├── DoseNoteModal.tsx      # Clinical diary & 1-tap symptom observation modal
│   │   ├── QuickVitalsBar.tsx     # 1-tap vitals log bar
│   │   ├── SeniorClock.tsx        # High-contrast live digital clock
│   │   ├── CustomAlertModal.tsx   # Uniform accessible modal alerts
│   │   └── PaywallModal.tsx       # RevenueCat subscription modal
│   ├── context/
│   │   └── AlertContext.tsx       # Global alert state provider
│   ├── database/                  # Local-First SQLite Repository
│   │   ├── db.ts                  # SQLite database connection & schema
│   │   ├── medicineRepo.ts        # Prescriptions & schedules
│   │   ├── logRepo.ts             # Daily intake logs & adherence stats
│   │   ├── vitalsRepo.ts          # Blood pressure, sugar, heart rate
│   │   └── caregiverRepo.ts       # Caregiver profile & sync
│   ├── hooks/
│   │   ├── useMedicines.ts        # Prescription data hooks
│   │   └── useFlexMode.ts         # Foldable hinge & orientation detection
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Bottom tab navigator with Senior Pill Badges
│   ├── screens/
│   │   ├── MedicineManagerScreen.tsx # Main schedule & prescriptions screen
│   │   ├── HistoryScreen.tsx      # Adherence matrix & PDF clinical export
│   │   ├── AnalyticsScreen.tsx    # Vitals trend charts & analytics
│   │   ├── DeskModeScreen.tsx     # Nightstand desk clock & voice dose
│   │   ├── EditorialHeroScreen.tsx # Onboarding & introduction
│   │   └── AuthWelcomeScreen.tsx  # Caregiver portal & guest sign-in
│   ├── services/
│   │   ├── demoDataService.ts     # 30-day clinical historical data seeder
│   │   ├── notificationService.ts # Local daily push notification scheduler
│   │   ├── revenuecat.ts          # RevenueCat In-App Purchases & Pro state
│   │   ├── pdfService.ts          # Clinical PDF document generator
│   │   └── speechService.ts       # Voice synthesis instructions
│   └── utils/
│       └── dateUtils.ts           # ISO date formatting & calculation helpers
```

---

## 🚀 Getting Started

### 🧑‍⚖️ Instant Demo Account for Evaluators
To experience CareBridge with a vibrant 30-day compliance punch-card matrix, realistic biometric trend analytics, and clinical diary notes, sign in on the welcome screen with:
- **Email:** `demo@gmail.com`
- **Password:** `1234`
*(Or tap the one-touch **"Demo (Evaluator Quick Access)"** button under the login form to automatically seed 30 days of clinical intake logs, symptom observations, and vitals history into local SQLite).*

> **💡 Evaluator Tip — Instant Pro Access:** To evaluate Pro features (Doctor Clinical PDF Export & 52-Week Habit Punch Card) without configuring Sandbox store accounts on Expo Go or emulators, simply open the Paywall modal and tap **`[Demo] Instant Unlock Pro`**.

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn
- Expo CLI (`npx expo`)
- Expo Go app on mobile (or Android/iOS emulator)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PHONGUIT22/CareBridge.git
   cd CareBridge
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

5. **Verify TypeScript compilation:**
   ```bash
   npx tsc --noEmit
   ```
   *(Must pass with 0 errors)*

---

## 🛠️ Tech Stack & Dependencies

| Category | Library | Version | Description |
|---|---|---|---|
| **Framework** | Expo SDK | `~54.0.36` | Cross-platform runtime & native APIs |
| **Core** | React Native | `0.81.5` | Native mobile foundation |
| **Language** | TypeScript | `~5.9.2` | Static typing & reliability |
| **Local Database** | `expo-sqlite` | `~16.0.10` | Offline-first SQLite database |
| **Notifications** | `expo-notifications` | `~0.32.17` | Local recurring daily dose alarms |
| **Navigation** | `@react-navigation/*` | `^7.x` | Senior-friendly tab bar navigation |
| **Monetization** | `react-native-purchases` | `^10.8.1` | RevenueCat subscription management |
| **Audio & Native** | `expo-speech` & `expo-haptics` | SDK 54 | Text-to-Speech & tactile haptics |
| **Charts** | `react-native-chart-kit` | `^7.0.2` | SVG-based vitals analytics |
| **Document Export** | `expo-print` & `expo-sharing` | SDK 54 | Clinical PDF rendering & sharing |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

© 2026 **PHONGUIT22 / CareBridge Team**. Built with passion for Shipathon 2026.
