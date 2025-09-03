# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20 SSR (Server-Side Rendering) application that generates Google Calendar embed links with custom timezone and week selection. The app is deployed to Firebase Hosting with Cloud Functions.

## Essential Commands

### Development
```bash
# Start development server (non-SSR)
npm start

# Build with SSR
npm run build:ssr

# Test SSR locally (use PORT env var to change from default 4000)
npm run serve:ssr:LocalGoogleCalendarLinkMaker
PORT=5000 npm run serve:ssr:LocalGoogleCalendarLinkMaker

# Run tests
npm test
```

### Deployment (Firebase)
```bash
# Deploy to Firebase (builds, compiles functions, and deploys)
npm run deploy:firebase

# Test Firebase deployment locally
npm run firebase:serve

# Login to Firebase (required before first deployment)
firebase login
firebase use --add  # Select or create project
```

## Architecture

### SSR Configuration
- **Server**: Express server in `src/server.ts` exports `reqHandler` for Firebase Functions
- **Firebase Function**: `functions/src/index.ts` wraps the Angular SSR server
- **Platform Detection**: Uses `isPlatformBrowser()` to prevent localStorage access during SSR

### Main Application Structure
- **Single Component App**: `src/app/app.ts` contains all logic (signals-based state management)
- **No routing**: Single-page application with `<router-outlet />` placeholder
- **Minimal dependencies**: Only Angular core, forms, and common modules

### State Management
- Uses Angular signals for reactive state
- localStorage for persistence (calendar URL, timezone, recent timezones)
- Computed signals for derived state (filtered timezones, generated link)

### Key Features Implementation
1. **Typeahead Timezone Selector**: Filters 20 popular timezones, saves last 4 selections
2. **Week Selection**: "This Week", "Next Week", or custom date picker (within next year)
3. **Link Generation**: Formats Google Calendar embed URL with timezone and date range

## Critical SSR Considerations

Always check `isBrowser` before accessing browser-only APIs:
```typescript
if (this.isBrowser) {
  // localStorage, window, document access here
}
```

## Firebase Functions Setup

The TypeScript functions must be compiled before deployment:
- Functions source: `functions/src/index.ts`
- Compiled output: `functions/lib/index.js`
- The deployment script handles compilation automatically

## Bundle Size Optimization

The app targets minimal bundle size:
- Initial bundle budget: 500kB warning, 1MB error
- Current size: ~80KB gzipped
- Avoid adding heavy dependencies