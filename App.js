import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/loginScreen';
import SignUpScreen from './screens/signUpScreen';
import MainScreen from './screens/mainScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
          <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen
         name="Login" 
         component={LoginScreen}
         options={{
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="MainScreen"
          component={MainScreen}
          options={{
            animation:'none'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>

  );
}
