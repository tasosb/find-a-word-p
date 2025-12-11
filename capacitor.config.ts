import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fillaword.game',
  appName: 'Fill-A-Word',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;