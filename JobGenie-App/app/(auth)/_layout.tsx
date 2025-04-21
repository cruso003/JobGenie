import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
  } from "@react-navigation/native";
  import { Stack } from "expo-router";
  import React from "react";
  import { useColorScheme } from "react-native";
  
  export default function AuthLayout() {
    const colorScheme = useColorScheme();
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Authentication-related screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
        </Stack>
      </ThemeProvider>
    );
  }
  