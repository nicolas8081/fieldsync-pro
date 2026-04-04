import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PortalDataProvider } from './src/context/PortalDataContext';
import { AuthProvider } from './src/context/AuthContext';
import { applyGlobalMonoFont } from './src/typography/applyGlobalMonoFont';

void SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });
  const fontDefaultsApplied = useRef(false);

  if (fontsLoaded && !fontDefaultsApplied.current) {
    applyGlobalMonoFont();
    fontDefaultsApplied.current = true;
  }

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PortalDataProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </PortalDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}