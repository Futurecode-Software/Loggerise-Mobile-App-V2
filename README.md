# Loggerise Mobile v2

<p align="center">
  <img src="assets/images/loggerise-icon.png" alt="Loggerise Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Logistics & Fleet Management Mobile Application</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#design-system">Design System</a> •
  <a href="#api-integration">API</a>
</p>

---

## Overview

**Loggerise Mobile** is a comprehensive React Native/Expo mobile application for logistics and fleet management. It provides real-time access to business operations including finance, logistics, warehouse management, employee tracking, and CRM functionality.

The app supports **iOS**, **Android**, and **Web** platforms with a unified codebase.

---

## Features

### Authentication & Security

- Email/password authentication
- Google OAuth integration
- Secure token storage (encrypted)
- Remember me functionality
- Password reset flow

### Dashboard

- Real-time business metrics
- Multiple dashboard views (Overview, Logistics, Finance, CRM, Fleet, HR)
- Quick action buttons
- Recent activity feed

### Logistics Management

- **Loads/Shipments**: Track shipments with status (Pending, In Transit, Delivered)
- **Vehicles**: Fleet inventory with maintenance tracking
- **Positions**: Real-time vehicle/driver location tracking

### Finance

- Bank account management
- Multi-currency support (TRY, USD, EUR, GBP)
- Transaction history

### CRM & Contacts

- Customer/supplier management
- Contact details with multiple addresses
- Authority contacts
- Status tracking (Active, Passive, Blacklisted)

### Communication

- Real-time messaging
- Push notifications
- Unread message indicators

### AI Reports (Loggy AI)

- Natural language to SQL queries
- Interactive report generation
- Report history and management

### Additional Features

- Dark/Light theme support
- Offline detection with banner
- Haptic feedback
- Pull-to-refresh
- Infinite scroll pagination

---

## Tech Stack

| Category          | Technology                            |
| ----------------- | ------------------------------------- |
| **Framework**     | React Native 0.81.5 + Expo 54         |
| **Language**      | TypeScript 5.9                        |
| **UI**            | React 19 + Custom Components          |
| **Navigation**    | Expo Router 6 (File-based)            |
| **State**         | React Context API                     |
| **HTTP Client**   | Axios                                 |
| **Auth**          | expo-auth-session + expo-secure-store |
| **Notifications** | expo-notifications                    |
| **Animations**    | react-native-reanimated               |
| **Icons**         | lucide-react-native                   |

---

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Setup

```bash
# Clone the repository
git clone https://github.com/futurecode-ufukmert/loggerise_mobile_v2.git
cd loggerise_mobile_v2

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npx expo start
```

### Running the App

This project uses **Expo prebuild (bare workflow)**. Native `ios/` and `android/` folders are generated and committed. Use a **development build**, not Expo Go, for full features (push notifications, etc.).

**Option A – Development build (recommended)**

```bash
# Install dependencies (if not already)
npm install

# iOS (Mac only; requires Xcode)
npx expo run:ios

# Android (requires Android Studio / SDK)
npx expo run:android
```

First run compiles the native app. After that you can use `npx expo start` and open the app from the dev client (same device/simulator).

**Option B – Start Metro and open existing build**

```bash
npx expo start
```

Then open the app from the development build already installed on the device/emulator (not Expo Go).

**Web**

```bash
npx expo start --web
```

- **Expo Go** is not used for this project; push notifications and some native features require a development build.

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1/mobile

# Google OAuth (Required for Google Sign-In)
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-expo-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id

# EAS Build (Required for push notifications)
EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
```

### API URL by Platform

| Environment      | URL                                       |
| ---------------- | ----------------------------------------- |
| Android Emulator | `http://10.0.2.2:8000/api/v1/mobile`      |
| iOS Simulator    | `http://localhost:8000/api/v1/mobile`     |
| Production       | `https://api.loggerise.com/api/v1/mobile` |

---

## Project Structure

```
loggerise_v2/
├── app/                          # File-based routing (Expo Router)
│   ├── index.tsx                # Entry point (auth redirector)
│   ├── _layout.tsx              # Root layout
│   ├── (auth)/                  # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── setup-status.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── index.tsx           # Dashboard
│   │   ├── contacts.tsx        # Contacts list
│   │   ├── loads.tsx           # Loads/shipments
│   │   ├── positions.tsx       # Real-time positions
│   │   ├── more.tsx            # More menu
│   │   └── profile.tsx         # User profile
│   ├── contact/[id].tsx        # Contact detail (dynamic)
│   ├── ai-reports.tsx          # AI reports
│   ├── banks.tsx               # Bank accounts
│   ├── employees.tsx           # Employee directory
│   ├── messages.tsx            # Messaging
│   └── vehicles.tsx            # Vehicle fleet
│
├── components/
│   └── ui/                      # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── date-input.tsx      # Native date picker
│       ├── select-input.tsx    # Native select dropdown
│       ├── card.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── checkbox.tsx
│       ├── skeleton.tsx
│       └── offline-banner.tsx
│
├── services/
│   ├── api.ts                   # Axios client with interceptors
│   ├── config.ts               # API configuration
│   ├── storage.ts              # Secure & regular storage
│   ├── notifications.ts        # Push notification service
│   ├── google-auth.ts          # Google OAuth
│   └── endpoints/              # API endpoint modules
│       ├── auth.ts
│       ├── dashboard.ts
│       ├── contacts.ts
│       ├── loads.ts
│       ├── vehicles.ts
│       ├── banks.ts
│       ├── employees.ts
│       ├── positions.ts
│       ├── messaging.ts
│       └── ai-reports.ts
│
├── context/
│   └── auth-context.tsx        # Global auth state
│
├── hooks/
│   ├── use-haptics.ts          # Haptic feedback
│   ├── use-network.ts          # Network status
│   ├── use-notifications.ts    # Push notifications
│   └── use-google-auth.ts      # Google OAuth
│
├── constants/
│   └── theme.ts                # Design system (colors, typography)
│
└── assets/                      # Images, fonts, icons
```

---

## Available Scripts

```bash
# Start Metro bundler (use with existing dev build)
npx expo start

# Run on iOS (builds native app if needed)
npm run ios
# or: npx expo run:ios

# Run on Android (builds native app if needed)
npm run android
# or: npx expo run:android

# Regenerate native projects (e.g. after adding a native plugin)
npx expo prebuild --clean

# Start with cache cleared
npx expo start -c

# Run linting
npm run lint

# Reset project (clean install)
npm run reset-project
```

---

## API Integration

The app communicates with a Laravel backend via RESTful API.

### Authentication Flow

1. User enters credentials or taps Google Sign-In
2. App sends request to `/login` or `/login/google`
3. Backend returns user data and auth token
4. Token stored securely using `expo-secure-store`
5. Token automatically added to subsequent requests

### API Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string,
  meta?: { current_page, last_page, per_page, total }
}

// Error Response
{
  message: string,
  errors?: { field: string[] },
  status?: number
}
```

### Error Handling

| Status | Handling                              |
| ------ | ------------------------------------- |
| 401    | Clear auth, redirect to login         |
| 403    | Permission denied                     |
| 422    | Validation errors displayed per field |
| 500+   | Server error message                  |

---

## UI Components

All components follow the [Design System](./DESIGN_SYSTEM.md) standards.

### Button

```tsx
import { Button } from "@/components/ui";

<Button
  onPress={handleSubmit}
  variant="primary" // primary | outline | destructive
  size="md" // sm | md | lg
  disabled={isLoading}
>
  Submit
</Button>;
```

### Input

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
/>;
```

### DateInput (New!)

```tsx
import { DateInput } from "@/components/ui";

<DateInput
  label="Tescil Tarihi"
  placeholder="Tarih seçiniz"
  value={dateValue} // YYYY-MM-DD format
  onChangeText={setDateValue}
  error={errors.date}
/>;
```

**Features:**

- ✅ Native date picker (iOS spinner, Android calendar)
- ✅ Turkish display format (DD/MM/YYYY)
- ✅ Backend-ready format (YYYY-MM-DD)
- ✅ Calendar icon indicator
- ✅ Error handling & disabled states

### SelectInput

```tsx
import { SelectInput } from "@/components/ui/select-input";

<SelectInput
  label="Araç Tipi"
  options={[
    { label: "Çekici", value: "truck_tractor" },
    { label: "Römork", value: "trailer" },
  ]}
  selectedValue={selectedValue}
  onValueChange={setValue}
  error={errors.type}
/>;
```

### Card

```tsx
import { Card } from "@/components/ui";

<Card style={styles.card}>
  <Text>Card Content</Text>
</Card>;
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Aktif</Badge>
<Badge variant="warning">Beklemede</Badge>
<Badge variant="danger">İptal</Badge>
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui";

<Checkbox value={isChecked} onValueChange={setIsChecked} />;
```

---

## Design System

Loggerise Mobile follows a comprehensive design system for consistency and quality.

**📖 Full Documentation**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

### Quick Reference

**Brand Colors:**

- **Primary**: `#13452d` (Dark Green) - Ana marka rengi
- **Primary Light**: `#227d53` - Hover, success
- **Secondary**: `#5fbd92` - İkincil aksiyonlar
- **Accent**: `#b4f25a` - Vurgular

**Status Colors:**

- **Success**: `#227d53` | **Warning**: `#f5a623`
- **Danger**: `#d0021b` | **Info**: `#3b82f6`

**Typography Scale:**

```tsx
import { Typography } from '@/constants/theme';

<Text style={Typography.headingLG}>Başlık</Text>
<Text style={Typography.bodyMD}>Normal Metin</Text>
<Text style={Typography.bodySM}>Küçük Metin</Text>
```

**Spacing System (8px based):**

```tsx
import { Spacing } from '@/constants/theme';

padding: Spacing.lg,      // 16px
marginBottom: Spacing.md, // 12px
gap: Spacing.sm,          // 8px
```

**UI Components:**

- `<Input />` - Standard text input
- `<DateInput />` - Native date picker (iOS spinner, Android calendar)
- `<Button />` - Multiple variants (primary, outline, destructive)
- `<Card />` - Content containers with shadow
- `<Badge />` - Status indicators
- `<Checkbox />` - Checkbox with custom styling
- `<SelectInput />` - Dropdown select with native picker

**Theme Support:**

- ✅ Light & Dark mode automatic detection
- ✅ Platform-specific styling (iOS/Android)
- ✅ Accessibility compliance (WCAG AA)

---

## Build & Deployment

### Development Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --platform android --profile development
eas build --platform ios --profile development
```

### Production Build

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Submit to Stores

```bash
# App Store
eas submit --platform ios

# Google Play
eas submit --platform android
```

---

## Backend Requirements

This mobile app requires the **Loggerise Laravel Backend** with:

- Laravel Sanctum for API authentication
- Mobile API routes (`/api/v1/mobile/*`)
- Push notification token storage
- Google OAuth verification

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Made with ❤️ by <a href="https://loggerise.com">Loggerise</a>
</p>
