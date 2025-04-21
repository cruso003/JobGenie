import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColorScheme } from '@/hooks/useColorScheme';

type Props = {
  onNext: () => void;
};

export default function WelcomeScreen({ onNext }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const lottieRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations
    lottieRef.current?.play();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#111827' : '#F9FAFB' }
    ]}>
      {/* Background gradient */}
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        {/* Lottie animation at the top */}
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.animationContainer}
        >
          <LottieView
            ref={lottieRef}
            source={require('@/assets/animations/genie-welcome.json')}
            style={styles.lottie}
            loop
          />
        </MotiView>
        
        {/* Content Container */}
        <View style={styles.content}>
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 800 }}
          >
            <Text style={[
              styles.title, 
              { color: isDark ? '#FFFFFF' : '#111827' }
            ]}>
              Welcome to JobGenie
            </Text>
          </MotiView>
          
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 200 }}
          >
            <Text style={[
              styles.subtitle, 
              { color: isDark ? '#D1D5DB' : '#4B5563' }
            ]}>
              I'm your AI career assistant, here to help you find and land your dream job.
            </Text>
          </MotiView>
          
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 400 }}
          >
            <Text style={[
              styles.description, 
              { color: isDark ? '#9CA3AF' : '#6B7280' }
            ]}>
              Let's start by getting to know you a bit better. I'll use this information to personalize your job recommendations and career guidance.
            </Text>
          </MotiView>
        </View>
      </Animated.View>
      
      {/* Next button */}
      <MotiView
        from={{ translateY: 20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'timing', duration: 800, delay: 600 }}
        style={styles.buttonContainer}
      >
        <TouchableOpacity onPress={onNext} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6366F1', '#06B6D4']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Let's Get Started</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  animationContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  lottie: {
    width: 280,
    height: 280,
  },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
