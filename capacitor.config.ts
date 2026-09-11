import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.savedd.app',
  appName: 'SAVEDD',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
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
