# Errand Shop Mobile App (React Native / Expo)

## Overview

Customer-facing mobile app for browsing products, cart & checkout (Paystack), orders, notifications, and in-app chat. Built with React Native and Expo for cross-platform compatibility.

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State Management**: Zustand + TanStack Query
- **Payments**: Paystack (in-app checkout)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Build & Deploy**: EAS (Expo Application Services)
- **UI Components**: Custom components with React Native styling

## Features

- ✅ User Authentication (Sign up / Login)
- ✅ Product catalog browsing with search and filters
- ✅ Detailed product views
- ✅ Shopping cart management
- ✅ Checkout with Paystack integration
- ✅ Coupon system
- ✅ Order tracking and history
- ✅ Custom product requests
- ✅ Address management
- ✅ Push notifications (promotions, order updates)
- ✅ In-app support chat
- ✅ Profile management

## Prerequisites

- Node.js ≥ 18
- Expo CLI
- **iOS**: Xcode (for iOS Simulator)
- **Android**: Android Studio (for Android Emulator)
- Firebase project (for FCM)
- Paystack account with test keys

## Getting Started

### 1. Installation
```bash
npm install
# or
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Update the `.env` file with your configuration values.

### 3. Run the App
```bash
npm start
# or
pnpm start

# Then press:
# 'i' for iOS simulator
# 'a' for Android emulator
# 'w' for web (development only)
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.errandshop.ng
EXPO_PUBLIC_APP_ENV=dev
EXPO_PUBLIC_USE_MOCK=false

# Paystack Configuration
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_SENDER_ID=

# Optional Analytics
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
```

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth/              # Authentication screens
│   ├── orders/            # Order-related screens
│   └── profile/           # Profile management
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API clients and external services
│   ├── store/             # Zustand state management
│   ├── config/            # Configuration files
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, icons
├── constants/             # App constants and themes
└── components/            # Global components
```

## Key Features Implementation

### Payments (Paystack)

- Integrated Paystack React Native SDK for secure payments
- Backend generates and validates payment references
- App opens Paystack checkout and handles success/failure callbacks
- Transaction verification occurs on backend before order confirmation

### Push Notifications (FCM)

- Firebase configured for both Android (`google-services.json`) and iOS (`GoogleService-Info.plist`)
- FCM token management for user-device mapping
- Support for promotional and order update notifications

### State Management

- **Zustand stores** for:
  - Authentication state
  - Cart management
  - Order tracking
  - User profile
  - Chat system

### Custom Features

- **Custom Product Requests**: Users can request products not in catalog
- **Dynamic Delivery Pricing**: Real-time delivery cost calculation
- **Address Management**: Multiple delivery addresses per user
- **Order Tracking**: Real-time order status updates

## Build & Release

### Configure EAS (One-time setup)
```bash
eas login
eas build:configure
```

### Build for Platforms
```bash
# Android
eas build -p android

# iOS
eas build -p ios

# Both platforms
eas build -p all
```

### App Store Requirements
- **Apple App Store**: $99/year developer account
- **Google Play Store**: $25 one-time registration fee

## Development Guidelines

### Code Style
- Follow React Native best practices
- Use TypeScript for type safety
- Implement proper error handling
- Follow component composition patterns

### Testing
- Unit tests with Jest
- Component testing with React Native Testing Library
- E2E testing capabilities with Testsprite integration

## Troubleshooting

### Common Issues

**Icons showing as "?"**
```bash
# Ensure vector icons are properly installed
npm install @expo/vector-icons
# Clear Expo cache
expo start -c
```

**FCM iOS Issues**
- Verify APNs key configuration in Apple Developer Center
- Check Firebase project settings for iOS
- Ensure proper certificate setup

**Build Failures**
- Clear node_modules and reinstall dependencies
- Check EAS build logs for specific errors
- Verify all required environment variables are set

## Security Best Practices

- ✅ Never embed secret keys in the app
- ✅ Only use public keys (Paystack public key)
- ✅ All sensitive operations verified on backend
- ✅ Proper input validation and sanitization
- ✅ Secure token storage using Expo SecureStore

## API Integration

The app integrates with the Errand Shop backend API for:
- User authentication and management
- Product catalog and search
- Order processing and tracking
- Payment processing
- Push notification delivery
- Chat system functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Private - Errand Shop Ltd.

## Support

For technical support or questions, contact the development team or use the in-app support chat feature.
