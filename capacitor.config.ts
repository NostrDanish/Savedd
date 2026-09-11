import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.savedd.app',
  appName: 'SAVEDD',
  webDir: 'dist',
  // Phase 0 demo: the WebView loads the live site so /api/* Vercel rewrites
  // just work. Production (M1) can drop `url` and bundle dist/ instead.
  server: {
    url: 'https://savedd.com',
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'savedd.com',
      '*.savedd.com',
      'savedd.savedd.workers.dev',
    ],
  },
  android: {
    allowMixedContent: false,
    // Parchment (light theme) so the splash matches first paint.
    backgroundColor: '#F3EDE2',
  },
  ios: {
    backgroundColor: '#F3EDE2',
    contentInset: 'never',
    scheme: 'savedd',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
    },
  },
};

export default config;
