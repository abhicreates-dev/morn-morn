import "./polyfills";
import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import './global.css';

// Screens (HabitCreation is lazy-loaded so Solana MWA native module is not loaded in Expo Go)
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import MotivationScreen from './screens/MotivationScreen';
import VerificationScreen from './screens/VerificationScreen';
import ResultScreen from './screens/ResultScreen';

const HabitCreationScreen = React.lazy(() =>
  Constants.appOwnership === 'expo'
    ? import('./screens/HabitCreationScreenExpoGo').then((m) => ({ default: m.default }))
    : import('./screens/HabitCreationScreen').then((m) => ({ default: m.default }))
);

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Home: undefined;
  HabitCreation: undefined;
  Motivation: undefined;
  Verification: { taskId: string; taskTitle?: string; taskDescription?: string };
  Result: { success: boolean };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Suspense fallback={null}>
          <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#2f3e46' },
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="HabitCreation" component={HabitCreationScreen} />
            <Stack.Screen name="Motivation" component={MotivationScreen} />
            <Stack.Screen name="Verification" component={VerificationScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
          </Stack.Navigator>
        </Suspense>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
