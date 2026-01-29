# FotoBox AI

## Overview
A mobile-first AI product photo editor built with Expo React Native. The app captures product photos and uses Gemini 2.5 Flash Image to automatically remove backgrounds and create Amazon-ready white background product images (2000x2000 JPG).

## Current State
- MVP complete with camera capture, AI background removal, and gallery save functionality
- Express backend with Gemini AI integration for image processing
- Premium UI design with glassmorphism effects and light brand theme
- Complete workflow: Camera → Preview → Generate → Edit → Save
- OAuth authentication with Google and Apple Sign-In (unified AuthScreen)
- Subscription system with free tier (3 credits + watermark), Pro ($6.99/mo), and Unlimited ($14.99/mo)
- Credit tracking for authenticated users and local AsyncStorage for guests

## Tech Stack
- **Frontend**: Expo React Native (SDK 54), React Navigation 7
- **Backend**: Express.js with TypeScript
- **AI**: Gemini 2.5 Flash Image via Replit AI Integrations (no API key required)
- **Image Processing**: Sharp.js for resizing and white background compliance

## Project Structure
```
client/
├── components/     # Reusable UI components (Button, ThemedText, ThemedView, etc.)
├── constants/      # Theme configuration (colors, spacing, typography)
├── hooks/          # Custom hooks (useTheme, useScreenOptions)
├── lib/            # API client and query configuration
├── navigation/     # Navigation stack (RootStackNavigator)
├── screens/        # App screens (CameraScreen, PreviewScreen, ResultScreen)
└── App.tsx         # Root app component

server/
├── replit_integrations/batch/  # Batch processing utilities for AI calls
├── routes.ts       # API endpoints (/api/health, /api/amazon-main)
└── index.ts        # Express server setup

assets/images/      # App icons, splash screens, and optimized preview images
├── scenes/         # Lifestyle scene previews (20 WebP images, ~644KB)
├── mockups/        # Mockup template previews (optimized WebP)
├── platforms/      # E-commerce platform previews (8 WebP images, ~80KB)
└── ui/             # UI illustrations (tips, states, hero)
```

## Key Features
1. **Camera Capture**: Uses expo-camera for live preview and photo capture
2. **Image Picker**: Fallback to gallery selection via expo-image-picker
3. **AI Background Removal**: Gemini 2.5 Flash Image removes backgrounds and places product on pure white
4. **White Compliance Guard**: Post-processing to ensure pure white background (RGB 255,255,255)
5. **Output Specs**: 2000x2000 JPG, product centered at 85% frame fill
6. **Gallery Save**: Uses expo-media-library to save processed images

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/amazon-main` - Process product photo (multipart form, file field)

## User Preferences
- Android-first design focus
- Light brand theme throughout the app (consistent coral/orange brand colors)
- Primary color: Coral (#F97316) with gradient buttons
- Glassmorphism effects with light blur overlays and glass cards
- No tabs needed - simple stack navigation
- Minimal UI with focus on the product image
- Haptic feedback on all interactive elements

## Design System
- **Primary Color**: Coral (#F97316) - used in gradient buttons and accents
- **Secondary Color**: Sky Blue (#0EA5E9) - complementary accent color
- **Light Theme**: Warm white (#FAFAF9) background throughout the app
- **Glass Effects**: Light semi-transparent overlays with backdrop blur
- **Components**: GlassCard, GradientButton, ProgressRing, SuccessAnimation, IconButton, GlassPill
- **Animations**: React Native Reanimated for smooth transitions and feedback

## Recent Changes
- **Unified Light Theme (January 2026)**: Removed dark editing theme, entire app now uses consistent brand colors with warm white backgrounds and coral accents
- Initial MVP build (January 2026)
- Implemented camera capture with expo-camera
- Added Gemini 2.5 Flash Image integration for background removal
- Created white background compliance guard with Sharp.js
- Added save to gallery functionality with expo-media-library
- Fixed network connectivity issue for Expo Go on Android (January 2026)
- **Comprehensive UI Redesign (January 2026)**:
  - Created premium glassmorphism design system
  - Dark immersive theme for all editing screens
  - New reusable components: GlassCard, GradientButton, ProgressRing, SuccessAnimation, IconButton, GlassPill
  - Added haptic feedback to all interactive elements
  - Redesigned all screens with consistent dark theme and glass effects
  - Added success animations and improved loading states
  - Updated ErrorFallback with modern styling
- **EditImageScreen Toolbar Redesign (January 2026)**:
  - Redesigned DialToolbar with 3 organized tabs: Adjust, Fine Tune, Transform
  - Adjust tab: Brightness, Contrast, Saturation, Exposure
  - Fine Tune tab: Highlights, Shadows, Warmth
  - Transform tab: Rotate, Flip, Crop, Background color picker
  - Added smooth tab switching animations (FadeInRight/FadeOutLeft)
  - Moved Platform selection and Generate button to bottom action bar
  - Updated CircularDial to use dark editing theme colors
  - Increased image preview area by reducing toolbar footprint
- **Batch Edit Photos Flow (January 2026)**:
  - Fixed to open gallery with multi-select instead of camera
  - Supports selecting up to 20 images at once
- **Monetization System (January 2026)**:
  - User authentication with JWT (login/register screens)
  - Subscription plans: Free (3 credits + watermark), Pro ($6.99/mo, 100 credits), Unlimited ($14.99/mo)
  - Credit tracking via PostgreSQL for authenticated users, AsyncStorage for guests
  - Watermark applied server-side for free tier users (FotoBox branding overlay)
  - UpgradePrompt modal when credits exhausted
  - CreditIndicator component showing remaining credits
  - PaywallScreen with subscription plan details

## Subscription & Credits System

### Subscription Plans
| Plan | Price | Credits | Watermark |
|------|-------|---------|-----------|
| Free | $0 | 3 | Yes |
| Pro | $6.99/mo | 100 | No |
| Unlimited | $14.99/mo | Unlimited | No |

### Credit Flow
1. Guest users: 3 free uses tracked in AsyncStorage with watermark
2. Authenticated free users: 3 credits tracked in database with watermark
3. Pro/Unlimited users: credits tracked in database, no watermark

### Key Files for Monetization
- `client/context/AuthContext.tsx` - Authentication state, OAuth login, and credit consumption
- `client/hooks/useCredits.ts` - Credit state management hook
- `client/screens/AuthScreen.tsx` - OAuth sign-in (Google, Apple) with guest mode
- `client/screens/PaywallScreen.tsx` - Subscription plan display
- `client/components/CreditIndicator.tsx` - Credits display widget
- `client/components/UpgradePrompt.tsx` - Upgrade modal for out-of-credits
- `server/auth.ts` - JWT authentication middleware
- `server/storage.ts` - Database operations for users/subscriptions
- `shared/schema.ts` - Database schema (users, subscriptions, usage)

### Watermark Implementation
- Watermark applied server-side via Sharp.js composite
- Query parameter `applyWatermark=true` triggers watermark on all AI endpoints
- Watermark text: "FotoBox" in semi-transparent white with shadow

## Troubleshooting: Network/Server Connectivity Issues

### Problem: "Network request failed" or "Unable to connect to server" in Expo Go

**Root Cause**: Mobile devices on external networks (cellular or different WiFi) cannot reach non-standard HTTPS ports. Replit exposes services on specific ports:
- Port 5000 (Express API) → External port 5000
- Port 8081 (Metro/Expo) → External port 80 (default HTTPS)

When the mobile app tries to connect to `https://domain:5000/api/...`, many mobile networks block this because port 5000 is non-standard. Only the default HTTPS port (443/80) is reliably accessible from mobile devices.

**Symptoms**:
- API works perfectly when tested from the Replit server (curl localhost:5000)
- API works when tested with port in URL from within Replit
- Mobile app in Expo Go fails with "Network request failed"
- No requests appear in Express server logs from the mobile device

**Solution**: Configure Metro to proxy API requests to Express

1. **Created `metro.config.js`** with a middleware that proxies `/api` requests:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith("/api")) {
        const proxy = createProxyMiddleware({
          target: "http://localhost:5000",
          changeOrigin: true,
          logLevel: "warn",
        });
        return proxy(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
```

2. **Updated `client/lib/query-client.ts`** to strip the port from API URLs:
```typescript
// Always strip port suffix as mobile devices on external networks 
// cannot reach non-standard ports. The API must be accessible on standard HTTPS.
return `https://${url.hostname}/`;  // Not url.host which includes port
```

**How it works**:
- Mobile app requests go to `https://domain/api/amazon-main` (no port)
- Replit routes this to port 8081 (Metro) via the default HTTPS mapping
- Metro's proxy middleware intercepts `/api` requests
- Requests are forwarded to Express on localhost:5000
- Response flows back through Metro to the mobile app

**Key Files**:
- `metro.config.js` - API proxy configuration
- `client/lib/query-client.ts` - API URL construction (strips port)
- `.replit` - Port mappings (port 8081 → external 80)

**Verification**:
```bash
# Test API through default HTTPS (should work from mobile)
curl https://your-domain.replit.dev/api/health

# Test API directly on port 5000 (only works internally)
curl http://localhost:5000/api/health
```
