// components/ui/LoadingIndicator.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

type Props = {
  message?: string;
};

export default function LoadingIndicator({ message = 'Loading...' }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <LottieView
          source={require('@/assets/animations/loading-genie.json')} 
          style={styles.animation}
          autoPlay
          loop
        />
        
        <Text style={[
          styles.message,
          { color: isDark ? '#D1D5DB' : '#4B5563' }
        ]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  animation: {
    width: 150,
    height: 150,
  },
  message: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
});
