# Loggerise Mobile v2 - Project Overview

## Project Summary

Loggerise Mobile is a comprehensive React Native/Expo mobile application for logistics and fleet management. Built with TypeScript, it provides real-time access to business operations including finance, logistics, warehouse management, employee tracking, and CRM functionality. The app supports iOS, Android, and Web platforms with a unified codebase.

## Architecture & Technologies

### Framework & Language
- **Framework**: React Native 0.81.5 + Expo 54
- **Language**: TypeScript 5.9
- **UI**: React 19 + Custom Components
- **Navigation**: Expo Router 6 (File-based routing)

### State Management & Data
- **State**: React Context API
- **HTTP Client**: Axios with custom interceptors
- **Authentication**: expo-auth-session + expo-secure-store
- **Notifications**: expo-notifications

### UI & UX
- **Animations**: react-native-reanimated
- **Icons**: lucide-react-native
- **Custom UI Components**: Reusable components with design system
- **Dark/Light Theme Support**: Automatic detection with custom themes

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

## Key Features

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

## Building and Running

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npx expo start
```

### Running the App
After starting the development server:
- Press `a` - Open in Android Emulator
- Press `i` - Open in iOS Simulator
- Press `w` - Open in Web Browser
- Scan QR code - Open in Expo Go app

### Available Scripts
```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start -c

# Run linting
npm run lint

# Reset project (clean install)
npm run reset-project
```

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

## UI Components

All components follow the design system standards.

### Button
```tsx
import { Button } from '@/components/ui';

<Button
  onPress={handleSubmit}
  variant="primary" // primary | outline | destructive
  size="md"         // sm | md | lg
  disabled={isLoading}
>
  Submit
</Button>
```

### Input
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
/>
```

### DateInput (New!)
```tsx
import { DateInput } from '@/components/ui';

<DateInput
  label="Tescil Tarihi"
  placeholder="Tarih seçiniz"
  value={dateValue}  // YYYY-MM-DD format
  onChangeText={setDateValue}
  error={errors.date}
/>
```

### SelectInput
```tsx
import { SelectInput } from '@/components/ui/select-input';

<SelectInput
  label="Araç Tipi"
  options={[
    { label: 'Çekici', value: 'truck_tractor' },
    { label: 'Römork', value: 'trailer' },
  ]}
  selectedValue={selectedValue}
  onValueChange={setValue}
  error={errors.type}
/>
```

### Card
```tsx
import { Card } from '@/components/ui';

<Card style={styles.card}>
  <Text>Card Content</Text>
</Card>
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
import { Checkbox } from '@/components/ui';

<Checkbox
  value={isChecked}
  onValueChange={setIsChecked}
/>
```

## Design System

Loggerise Mobile follows a comprehensive design system for consistency and quality.

### Brand Colors:
- **Primary**: `#13452d` (Dark Green) - Ana marka rengi
- **Primary Light**: `#227d53` - Hover, success
- **Secondary**: `#5fbd92` - İkincil aksiyonlar
- **Accent**: `#b4f25a` - Vurgular

### Status Colors:
- **Success**: `#227d53` | **Warning**: `#f5a623`
- **Danger**: `#d0021b` | **Info**: `#3b82f6`

### Typography Scale:
```tsx
import { Typography } from '@/constants/theme';

<Text style={Typography.headingLG}>Başlık</Text>
<Text style={Typography.bodyMD}>Normal Metin</Text>
<Text style={Typography.bodySM}>Küçük Metin</Text>
```

### Spacing System (8px based):
```tsx
import { Spacing } from '@/constants/theme';

padding: Spacing.lg,      // 16px
marginBottom: Spacing.md, // 12px
gap: Spacing.sm,          // 8px
```

## Development Conventions

- TypeScript is used throughout the application
- File-based routing with Expo Router
- Context API for global state management
- Custom UI components following design system
- Consistent error handling with user-friendly messages
- Haptic feedback for user interactions
- Offline detection with banner
- Pull-to-refresh and infinite scroll pagination
- Dark/light theme support with automatic detection
- Accessibility compliance (WCAG AA)

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

## Backend Requirements

This mobile app requires the **Loggerise Laravel Backend** located at `C:\Users\Ufuk\Documents\GitHub\FlsV2` with:
- Laravel 12 framework
- Laravel Sanctum for API authentication
- Mobile API routes (`/api/v1/mobile/*`) defined in `mobil-api.php` endpoint file
- Push notification token storage
- Google OAuth verification

When developing features that require backend integration, it's important to check the backend implementation in the FlsV2 project to ensure compatibility with the mobile application. The `mobil-api.php` file contains all the endpoints that the mobile app consumes, and any new features may require corresponding backend endpoints to be created in that file.

## Push Notifications Configuration

The app uses Expo Notifications for push notifications. For push notifications to work properly on Android, Firebase needs to be properly configured:

1. The `@react-native-firebase/app` package is included in dependencies
2. A `google-services.json` file is placed in the project root
3. Firebase is configured in `app.config.ts` with the path to the config file
4. For production builds, you'll need to create a development build using EAS:
   ```bash
   eas build --platform android --profile development
   ```

Note: Push notifications are not supported in Expo Go on Android SDK 53+, so a development build is required for testing push notifications on Android devices.

## Status Bar and Safe Area Configuration

The app handles status bar and safe area considerations across different platforms and environments:

1. The app uses `react-native-safe-area-context` with `SafeAreaProvider` in the root layout
2. The `FullScreenHeader` component manages status bar appearance and top padding
3. Special handling is implemented for different environments:
   - iOS: Uses safe area insets consistently
   - Android standalone app with edgeToEdgeEnabled: Uses safe area insets
   - Android in Expo Go: Uses Constants.statusBarHeight due to different behavior
4. The `useConsistentStatusBarHeight()` hook provides unified status bar height calculation
5. The app.config.ts has `edgeToEdgeEnabled: true` for Android, making the status bar translucent

For proper layout rendering, the app accounts for the differences between Expo Go and standalone builds, ensuring content starts correctly below the status bar on all platforms.