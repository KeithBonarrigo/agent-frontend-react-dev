# Domain Context Implementation

## Overview
We've implemented a domain context that detects, stores, and makes the current domain available throughout the application as users navigate.

## Files Created/Modified

### 1. Created: `src/contexts/DomainContext.jsx`
A context provider that:
- Detects the current domain on app load
- Stores domain information in sessionStorage (persists during browser session)
- Provides helper functions to check domain type
- Logs domain information to console

### 2. Modified: `src/App.jsx`
- Added `DomainProvider` wrapper around the entire app
- Domain context is now available to all components

### 3. Modified: `src/components/SignupForm.jsx`
- Uses `useDomain` hook to access domain information
- Updated `getDomain()` function to use context
- Added console logging to track domain assignment

### 4. Created: `src/examples/DomainUsageExample.jsx`
Example component showing how to use the domain context

## How to Use Domain Context in Any Component

```javascript
import { useDomain } from '../contexts/DomainContext';

function MyComponent() {
  const { domainInfo, isDomain, getTargetDomain, isEasyBroker, isBase, isLocal } = useDomain();

  // Access domain information
  console.log(domainInfo);
  // {
  //   hostname: "easybroker.aibridge.global",
  //   domainType: "easybroker",
  //   targetDomain: "easybroker.aibridge.global",
  //   protocol: "https:",
  //   port: "",
  //   fullUrl: "https://easybroker.aibridge.global/signup",
  //   timestamp: "2026-01-12T..."
  // }

  // Check domain type
  if (isEasyBroker) {
    // Show EasyBroker-specific content
  }

  if (isBase) {
    // Show base domain content
  }

  if (isLocal) {
    // Development mode
  }

  // Or use the helper function
  if (isDomain('easybroker')) {
    // EasyBroker logic
  }

  // Get the target domain for redirects or API calls
  const domain = getTargetDomain(); // returns 'easybroker.aibridge.global'
}
```

## Domain Detection Logic

The context automatically detects:
- **EasyBroker Domain**: Any URL containing 'easybroker' → `domainType: 'easybroker'`
- **Base Domain**: Any URL containing 'base' → `domainType: 'base'`
- **Local Development**: localhost or 127.0.0.1 → `domainType: 'local'`
- **Production**: Any other domain → `domainType: 'production'`

## Console Output

When the app loads, you'll see:
```
=== Domain Check ===
Current Domain: easybroker.aibridge.global
Domain Type: easybroker
Target Domain: easybroker.aibridge.global
Protocol: https:
Port:
Full URL: https://easybroker.aibridge.global/
===================
```

When a user signs up, you'll see:
```
🔍 Domain from context: easybroker.aibridge.global
🔍 Domain type: easybroker
🔍 User selected level: basic
✅ Assigning EasyBroker domain
📋 Final domain assignment: easybroker.aibridge.global
```

## Persistence

- Domain information is stored in **sessionStorage**
- Persists during navigation within the same browser session
- Cleared when browser tab/window is closed
- Re-detected on fresh page load

## Available Properties

### `domainInfo` object:
- `hostname`: The current domain (e.g., "easybroker.aibridge.global")
- `domainType`: Type of domain ("easybroker", "base", "local", "production")
- `targetDomain`: The canonical domain to use
- `protocol`: "http:" or "https:"
- `port`: Port number (empty for 80/443)
- `fullUrl`: Complete URL
- `timestamp`: When domain was detected

### Helper functions:
- `isDomain(type)`: Check if current domain matches type
- `getTargetDomain()`: Get the canonical domain
- `isEasyBroker`: Boolean convenience property
- `isBase`: Boolean convenience property
- `isLocal`: Boolean convenience property

## Benefits

1. **Centralized Domain Management**: One source of truth for domain information
2. **Available Everywhere**: Use in any component via `useDomain()` hook
3. **Persistent**: Stored in sessionStorage, survives page navigation
4. **Type-Safe**: Provides helper functions for type checking
5. **Debuggable**: Console logs show domain detection and assignment
6. **Flexible**: Easy to extend with additional domain types or logic
