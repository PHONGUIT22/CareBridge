# 🌉 CareBridge — Clinical Medication Adherence & Caregiver Bridge for Seniors

[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-blue.svg)](https://expo.dev)
[![React Native 0.81](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/Storage-Local%20SQLite-003B57.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![RevenueCat](https://img.shields.io/badge/In--App%20Purchases-RevenueCat-E74C3C.svg)](https://www.revenuecat.com)
[![Google AdMob](https://img.shields.io/badge/Ads-Google%20Mobile%20Ads-34A853.svg)](https://developers.google.com/admob)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Shipathon 2026 Submission**  
> *Empowering elderly individuals and their caregivers with an accessible, high-contrast, local-first medication manager that bridges clinical compliance with human empathy.*

---

## 💡 Problem & Mission

As our population ages, **polypharmacy** (taking 4+ medications daily) becomes a dangerous hurdle for seniors. Cognitive decline, poor vision, tremors, and complex timing schedules lead to medication non-adherence—the leading cause of preventable elderly hospitalizations. Meanwhile, caregivers face constant stress and lack clear, timely records when communicating with physicians.

**CareBridge** resolves this by delivering:
1. **Senior-First Accessibility:** Giant touch targets (≥ 48×48px), bold typography, high contrast colors (`#1E3A8A` Navy on pure white), voice reading, and visual pill photos.
2. **Dual Experience:** Seamlessly transforms between an everyday mobile health tracker and an ambient, hands-free **Nightstand Desk Clock** (with Samsung Galaxy Z Fold / Flex Mode adaptation).
3. **Clinical Record Keeping:** Visual punch-card compliance matrix, vitals trend analytics, and 1-tap professional doctor PDF export.
4. **Local-First Privacy:** 100% offline-first architecture via local SQLite with zero latency and complete patient data ownership.

---

## ✨ Key Features

### 1. 📅 Daily Medication Hub & Compliance Dashboard
- **Modern Clinical Health Interface:** Clean cards with pastel classification badges, pill doses, and one-touch "Take Dose" actions.
- **Hero Dashboard:** Real-time compliance score ring, contextual greeting, and today's vital summary.
- **Visual Pill Photo Identification (Visual ID):** Camera and gallery integration allowing seniors to recognize pills by sight rather than confusing generic chemical names.
- **Quick Vitals Bar:** Record Blood Pressure (Systolic/Diastolic), Blood Sugar, and Heart Rate directly from the home screen.

### 2. 🗓️ Full-Month Calendar Matrix & Habit Punch-Card
- **Full-Month Modal (30/31 Days):** Quick month navigation with color-coded adherence indicators:
  - 🟢 **Green (100%):** All doses taken.
  - 🟡 **Amber:** Partial adherence.
  - 🔴 **Red:** Missed doses.
  - 🔵 **Navy:** Currently inspected day.
- **Habit Matrix Screen:** Punch-card layout displaying daily adherence records across the entire calendar year.

### 3. ⏰ Hands-Free Nightstand Desk Mode (Foldable / Flex Mode Support)
- **High-Contrast Night Clock:** Clean digital clock, upcoming dose countdown, and large tactile "I TOOK MY PILL" button.
- **Flex Mode Awareness:** Automatically pivots to dual-pane split layout when deployed on foldable devices (like Samsung Galaxy Z Fold) angled at 90 degrees or in landscape orientation.
- **Voice Guidance:** Integrated Text-to-Speech (`expo-speech`) reads medication instructions aloud for visually impaired seniors.

### 4. 📈 Vitals Analytics & Clinical PDF Report
- **Trend Charts:** Interactive Line Charts (`react-native-chart-kit`) visualizing Blood Pressure, Blood Sugar, and Pulse variations over time.
- **Export Doctor Report:** Generates a structured clinical PDF with patient details, adherence percentage, prescription schedules, and vitals history (`expo-print`, `expo-sharing`).

### 5. 💎 Sustainable Hybrid Monetization
- **RevenueCat Integration:** In-App Purchase paywall unlocking Unlimited Prescriptions, Multi-month PDF Exports, and Deep Analytics.
- **Google Mobile Ads (AdMob):** Rewarded video ads allowing Free-tier users to unlock PDF exports and refill prescription pill counts without barrier.

---

## 🏛️ Architecture & Project Structure

```
CareBridge/
├── App.tsx                        # App entry point, AlertProvider & Navigation
├── index.ts                       # Expo root registration
├── app.json                       # Expo configuration & plugins
├── package.json                   # Dependencies & build scripts
├── src/
│   ├── components/                # Reusable accessible UI components
│   │   ├── CalendarStrip.tsx      # 7-day horizontal calendar with month picker
│   │   ├── FullMonthCalendarModal.tsx # 30/31-day modal with compliance dots
│   │   ├── MedicineCard.tsx       # Senior-friendly medication card
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
│   │   ├── admobService.ts        # Google AdMob rewarded & banner ads
│   │   ├── revenuecat.ts          # RevenueCat In-App Purchases & Pro state
│   │   └── pdfService.ts          # Clinical PDF document generator
│   └── utils/
│       └── dateUtils.ts           # ISO date formatting & calculation helpers
```

---

## 🚀 Getting Started

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

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Verify TypeScript compilation:**
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
| **Navigation** | `@react-navigation/*` | `^7.x` | Senior-friendly tab bar navigation |
| **Monetization** | `react-native-purchases` | `^10.8.1` | RevenueCat subscription management |
| **Advertising** | `react-native-google-mobile-ads` | `16.3.4` | Google AdMob rewarded video ads |
| **Audio & Native** | `expo-speech` & `expo-haptics` | SDK 54 | Text-to-Speech & tactile haptics |
| **Charts** | `react-native-chart-kit` | `^7.0.2` | SVG-based vitals analytics |
| **Document Export** | `expo-print` & `expo-sharing` | SDK 54 | Clinical PDF rendering & sharing |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

© 2026 **PHONGUIT22 / CareBridge Team**. Built with passion for Shipathon 2026.
