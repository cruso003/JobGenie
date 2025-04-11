import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
// Define types for sparkle props
interface SparkleProps {
  style: any;
  size?: number;
}

// Define type for sparkle state items
interface SparkleItem {
  key: number;
  style: {
    opacity: Animated.Value;
    transform: Array<{
      translateX?: Animated.Value;
      translateY?: Animated.Value;
      scale?: Animated.Value;
    }>;
    size: number;
  };
}

// A component to render a single sparkle particle
const Sparkle: React.FC<SparkleProps> = ({ style, size = 4 }) => (
  <Animated.View style={[styles.sparkle, style]}>
    <View style={[styles.sparkleInner, { width: size, height: size }]} />
  </Animated.View>
);

export function TabGenieButton({ 
  color, 
  isActive 
}: { 
  color: string; 
  isActive: boolean 
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [sparkles, setSparkles] = useState<SparkleItem[]>([]);
  const sparkleCount = useRef(0);
  
  useEffect(() => {
    // Create animation sequence for the button pulse
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Start animation
    animationRef.current.start();
    
    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Create a sparkle effect
  const createSparkle = (): SparkleItem => {
    const key = sparkleCount.current++;
    
    // Random position around the button
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 40;
    const posX = Math.cos(angle) * distance;
    const posY = Math.sin(angle) * distance;
    
    // Random size
    const size = 2 + Math.random() * 4;
    
    // Random duration
    const duration = 600 + Math.random() * 1000;
    
    // Animated values
    const opacity = new Animated.Value(0);
    const translateX = new Animated.Value(0);
    const translateY = new Animated.Value(0);
    const sparkleScale = new Animated.Value(0);
    
    // Animation sequence
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: posX,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: posY,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: duration * 0.3,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 0,
          duration: duration * 0.7,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Remove this sparkle when animation is done
      setSparkles(current => current.filter(s => s.key !== key));
    });
    
    return {
      key,
      style: {
        opacity,
        transform: [
          { translateX },
          { translateY },
          { scale: sparkleScale },
        ],
        size,
      },
    };
  };

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create multiple sparkles on press
    const newSparkles: SparkleItem[] = [];
    for (let i = 0; i < 12; i++) {
      newSparkles.push(createSparkle());
    }
    setSparkles(current => [...current, ...newSparkles]);
    
    // Navigate to the genie screen
    router.push('/genie');
  };

  // Periodically create sparkles when active
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setSparkles(current => {
          // Limit maximum number of sparkles
          if (current.length < 8) {
            return [...current, createSparkle()];
          }
          return current;
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* Render all sparkles */}
      {sparkles.map(sparkle => (
        <Sparkle 
          key={sparkle.key} 
          style={sparkle.style} 
          size={sparkle.style.size} 
        />
      ))}
      
      {/* SVG Glow Effect */}
      {isActive && (
        <Svg height="100" width="100" style={styles.glow}>
          <Defs>
            <RadialGradient id="grad" cx="50%" cy="50%" rx="50%" ry="50%" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={color} stopOpacity="0.7" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="40" fill="url(#grad)" />
        </Svg>
      )}
      
      <Pressable onPress={handlePress} style={styles.pressable}>
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: color,
              shadowColor: color,
              transform: [{ scale }],
              shadowOpacity: isActive ? 0.9 : 0.7,
              shadowRadius: isActive ? 15 : 10,
              borderColor: "#FFFFFF",
            },
          ]}
        >
          <Feather 
            name="zap" 
            size={36} 
            color="#FFFFFF" 
          />
        </Animated.View>
        {isActive && (
          <View style={styles.activeIndicator} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: 80,
    position: 'relative',
  },
  pressable: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    borderWidth: 4,
    borderRadius: 30,
    marginBottom: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  sparkle: {
    position: 'absolute',
    top: 40,
    left: 40,
    zIndex: 1,
  },
  sparkleInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 0,
  }
});
