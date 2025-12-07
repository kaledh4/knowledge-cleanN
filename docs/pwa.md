# Progressive Web App (PWA) Guide

KnowledgeVerse is built as a Progressive Web App, allowing users to install it on their devices and use it offline.

## What is a PWA?

A Progressive Web App combines the best features of web and native apps:

- 📱 **Installable**: Can be installed on home screen like a native app
- 🔌 **Offline-capable**: Works without internet connection
- ⚡ **Fast**: Loads instantly with cached resources
- 🔔 **Engaging**: Can send push notifications (future feature)
- 🔄 **Auto-updating**: Always up to date without app store updates

## Installation

### On Desktop (Chrome, Edge, Brave)

1. Visit the KnowledgeVerse website
2. Look for the install icon in the address bar (⊕ or ⬇)
3. Click "Install" or "Add to Desktop"
4. The app will open in its own window

### On Mobile (iOS)

1. Open in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Name it and tap "Add"
5. The app icon appears on your home screen

### On Mobile (Android)

1. Open in Chrome
2. Tap the menu (⋮)
3. Tap "Install app" or "Add to Home Screen"
4. Confirm the installation
5. The app icon appears on your home screen

## Offline Support

KnowledgeVerse uses a Service Worker to cache resources and enable offline functionality.

### What Works Offline?

✅ **Available Offline:**
- Previously viewed pages
- Static assets (CSS, JS, images)
- Cached knowledge entries (if viewed before)
- App shell and navigation

⚠️ **Requires Internet:**
- Creating new entries (needs Supabase connection)
- Updating entries
- Syncing across devices
- AI features
- Authentication (first time login)

### Caching Strategy

**Network First (Data):**
```javascript
// For API calls and dynamic content
urlPattern: /^https?.*/
handler: 'NetworkFirst'
```
- Tries to fetch from network first
- Falls back to cache if offline
- Updates cache with fresh data

**Cache First (Assets):**
```javascript
// For images and static files
urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/
handler: 'CacheFirst'
```
- Serves from cache immediately
- Updates cache in background
- Expires after 30 days

## Offline Page

When completely offline and visiting a new page, users see a custom offline page located at `/offline`.

### Customizing the Offline Page

Edit `src/app/offline/page.tsx`:

```typescript
export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1>You're Offline</h1>
        <p>Please check your internet connection</p>
      </div>
    </div>
  );
}
```

## Service Worker Configuration

The Service Worker is configured in `next.config.ts` using `next-pwa`:

```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
});
```

### Configuration Options

- `dest: 'public'` - Where to output the service worker
- `register: true` - Auto-register the service worker
- `skipWaiting: true` - Activate new service worker immediately
- `disable: development` - Disabled in dev mode (easier debugging)
- `runtimeCaching` - Define caching strategies
- `fallbacks` - Offline fallback pages

## Web App Manifest

The manifest file defines how the app appears when installed. It's generated automatically but can be customized in `public/manifest.json`:

```json
{
  "name": "KnowledgeVerse",
  "short_name": "KnowledgeVerse",
  "description": "Personal Knowledge Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Manifest Properties

- **name**: Full app name shown during installation
- **short_name**: Name shown on home screen (max 12 characters)
- **start_url**: URL opened when app launches
- **display**: `standalone` (no browser UI) or `fullscreen`
- **theme_color**: Color of address bar (Android)
- **background_color**: Splash screen background
- **icons**: App icons in various sizes

## Creating App Icons

You need icons in multiple sizes for different devices:

### Required Sizes

- **192x192** - Standard Android icon
- **512x512** - High-res Android icon, splash screen
- **180x180** - iOS icon (save as `apple-touch-icon.png`)

### Using a Tool

1. Create a 512x512 square image
2. Use a PWA icon generator:
   - [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Place generated icons in `/public`

### Manual Creation

```bash
# Using ImageMagick
convert icon.png -resize 192x192 public/icon-192.png
convert icon.png -resize 512x512 public/icon-512.png
convert icon.png -resize 180x180 public/apple-touch-icon.png
```

## Testing PWA Features

### Chrome DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check:
   - **Manifest**: Verify all properties
   - **Service Workers**: Check status and cache
   - **Cache Storage**: Inspect cached files
   - **Offline**: Test offline mode

### Lighthouse Audit

1. Open DevTools
2. Go to **Lighthouse** tab
3. Select "Progressive Web App"
4. Click "Analyze page load"
5. Review the PWA score and recommendations

### PWA Checklist

- [ ] Web app manifest exists
- [ ] Service worker registered
- [ ] HTTPS enabled (required for PWA)
- [ ] Responsive design
- [ ] Fast load times (< 3s)
- [ ] Works offline
- [ ] Icons provided
- [ ] Theme color set
- [ ] Viewport meta tag configured

## Debugging Service Worker

### View Service Worker Status

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations.length);
  registrations.forEach(registration => {
    console.log('SW scope:', registration.scope);
    console.log('SW state:', registration.active?.state);
  });
});
```

### Clear Service Worker Cache

```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => {
    caches.delete(key);
    console.log('Deleted cache:', key);
  });
});
```

### Unregister Service Worker

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
    console.log('Unregistered SW');
  });
});
```

## Best Practices

### 1. Update Strategy

When deploying updates:
- Service worker will update in background
- New version activates on next page load
- Use `skipWaiting: true` for immediate activation

### 2. Cache Management

- Limit cache size with `maxEntries`
- Set expiration times with `maxAgeSeconds`
- Clear old caches on version updates

### 3. Offline UX

- Show clear offline indicators
- Disable actions that require internet
- Queue actions to retry when online

### 4. Performance

- Precache critical assets only
- Use runtime caching for dynamic content
- Monitor cache storage usage

## Advanced Features

### Background Sync (Future)

Queue actions when offline and retry when online:

```javascript
// Register a sync event
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('sync-knowledge-entries');
});
```

### Push Notifications (Future)

Send notifications to users:

```javascript
// Request permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Subscribe to push notifications
  }
});
```

## Troubleshooting

### Service Worker Not Registering

**Problem**: SW doesn't register or shows errors

**Solutions**:
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify `next.config.ts` PWA configuration
- Try clearing browser cache

### Offline Mode Not Working

**Problem**: App doesn't work offline

**Solutions**:
- Check Service Worker is active in DevTools
- Verify cache storage has files
- Try visiting pages while online first (to cache them)
- Check cache strategies in config

### App Not Installable

**Problem**: Install prompt doesn't appear

**Solutions**:
- Verify `manifest.json` is accessible
- Ensure HTTPS is enabled
- Check all required manifest fields are present
- Use Lighthouse to identify issues

### Updates Not Applying

**Problem**: New version doesn't show

**Solutions**:
- Hard refresh (Ctrl+Shift+R)
- Unregister old service worker
- Clear cache storage
- Ensure `skipWaiting: true` in config

## GitHub Pages Considerations

When hosting on GitHub Pages:

1. **Update manifest start_url**:
   ```json
   {
     "start_url": "/knowledge-cleanN/"
   }
   ```

2. **Update service worker scope** (automatic with next-pwa)

3. **Ensure HTTPS** (GitHub Pages provides this)

4. **Set basePath in next.config.ts**:
   ```typescript
   basePath: '/knowledge-cleanN'
   ```

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)

---

Your KnowledgeVerse PWA is ready to provide an app-like experience! 🚀
