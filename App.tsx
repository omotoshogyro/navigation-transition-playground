import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { DemoConfigProvider, useDemoConfig } from './src/DemoConfig';
import DemoScreen from './src/screens/DemoScreen';
import TabsFlow from './src/tabs/TabsFlow';

const Stack = createStackNavigator();

/**
 * Mirrors how mobile-native wires it up: a JS stack (NOT native-stack — the
 * card interpolators only exist on @react-navigation/stack) whose
 * screenOptions is the transition object.
 *
 * See src/navigation/NavigationStack.tsx:253 in mobile-native.
 */
function DemoNavigator() {
  const { screenOptions } = useDemoConfig();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Demo" component={DemoScreen} initialParams={{ depth: 0 }} />
      <Stack.Screen name="Tabs" component={TabsFlow} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DemoConfigProvider>
          <NavigationContainer
            theme={{
              ...DarkTheme,
              colors: { ...DarkTheme.colors, background: '#000' },
            }}>
            <StatusBar style="light" />
            <DemoNavigator />
          </NavigationContainer>
        </DemoConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
