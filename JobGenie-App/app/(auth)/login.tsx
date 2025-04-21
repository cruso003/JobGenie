import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Animated,
  StatusBar
} from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { cn } from '@/utils/cn';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MotiView } from 'moti';
import { useAuthStore } from '@/stores/auth';

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const router = useRouter();
  const animation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const lottieRef = useRef<LottieView>(null);
  const iconRotate = useRef(new Animated.Value(0)).current;
  
  // Get current header text based on auth mode
  const getHeaderText = () => {
    switch(authMode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Join JobGenie';
      case 'forgot-password': return 'Reset Password';
    }
  };
  
  // Get current button text based on auth mode
  const getButtonText = () => {
    switch(authMode) {
      case 'login': return 'Sign In';
      case 'register': return 'Create Account';
      case 'forgot-password': return 'Send Reset Link';
    }
  };
  
  useEffect(() => {
    // Run intro animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Play lottie animation 
    setTimeout(() => {
      lottieRef.current?.play();
    }, 500);
    
    // Start icon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Animate between auth modes
    Animated.timing(animation, {
      toValue: authMode === 'login' ? 0 : authMode === 'register' ? 1 : 2,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Clear messages when changing mode
    setError(null);
    setSuccess(null);
  }, [authMode]);

  const handleLoginWithPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    
      if (error) {
        console.error('Login Error:', error.message);
        setError(error.message);
        return;
      }

      
      const user = data.user;
      useAuthStore.getState().setUser(user);
    
      // Check if user is onboarded
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .single();
    
      if (profileError) {
        console.error('Error fetching onboarding status:', profileError.message);
        
        // If the error is because no profile exists, create one
        if (profileError.message.includes('multiple (or no) rows')) {
          // Create a profile for this user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.name || '',
                onboarded: false
              }
            ]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError.message);
            setError('Error creating user profile');
            return;
          }
          
          // Redirect to onboarding since we just created profile with onboarded=false
          router.replace('/(onboarding)');
          return;
        }
        
        setError('Error retrieving user profile');
        return;
      }
    
      if (profile && profile.onboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!email || !password || !confirmPassword || !name) {
        setError('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (authError) throw new Error(authError.message);
      
      // With email confirmation disabled, the user is immediately created and authenticated
      if (data.user) {
        setSuccess('Account created successfully!');
        
        // Create profile record
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: name,
            onboarded: false
          }
        ]);
        
        // Automatically log them in
        useAuthStore.getState().setUser(data.user);
        
        // Redirect to onboarding after a brief delay
        setTimeout(() => {
          router.replace('/(onboarding)');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!email) {
        setError('Please enter your email');
        return;
      }
      
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email);
      
      if (authError) throw new Error(authError.message);
      
      setSuccess('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (authMode === 'login') {
      handleLoginWithPassword();
    } else if (authMode === 'register') {
      handleRegister();
    } else if (authMode === 'forgot-password') {
      handleForgotPassword();
    }
  };

  const inputBgColor = isDark ? 'bg-gray-800/70' : 'bg-white/70';
  const textColor = isDark ? 'text-white' : 'text-dark';
  const placeholderColor = isDark ? '#9CA3AF' : '#6B7280';
  const primaryColor = '#6366F1'; // From your tailwind config
  const accentColor = '#06B6D4';  // From your tailwind config
  
  // Animation interpolations - only for numeric values
  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        className="absolute inset-0"
      />
      
      {/* Floating bubbles background */}
      <View className="absolute inset-0 overflow-hidden">
        <LottieView
          ref={lottieRef}
          source={require('@/assets/animations/bubbles-bg.json')}
          autoPlay={false}
          loop
          style={{ 
            opacity: 0.6,
            transform: [{ scale: 1.2 }]
          }}
        />
      </View>
      
      <ScrollView
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 40
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          className="px-6 items-center"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Logo/icon - using animated zap icon */}
          <View className="w-32 h-32 mb-6 items-center justify-center">
            <Animated.View
              style={{
                transform: [{ rotate: iconRotation }]
              }}
            >
              <MotiView
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 1500,
                  loop: true
                }}
                className="bg-primary/20 p-5 rounded-full"
              >
                <MotiView
                  from={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 1500,
                    loop: true,
                    delay: 200
                  }}
                  className="bg-primary/30 p-4 rounded-full"
                >
                  <Feather name="zap" size={48} color={primaryColor} />
                </MotiView>
              </MotiView>
            </Animated.View>
          </View>
          
          <Text className={cn(
            "text-3xl font-bold mb-2", 
            textColor
          )}>
            {getHeaderText()}
          </Text>
          
          <Text className={cn(
            "text-base mb-8 text-center opacity-80",
            textColor
          )}>
            {authMode === 'login' 
              ? 'Your AI career assistant awaits you' 
              : authMode === 'register'
                ? 'Create an account to start your career journey'
                : 'Enter your email to receive a password reset link'}
          </Text>
          
          {/* Card container */}
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            className="w-full rounded-3xl overflow-hidden"
          >
            <View className={cn(
              "w-full rounded-3xl p-6",
              isDark ? "bg-gray-900/50" : "bg-white/50",
              "border border-white/20"
            )}>
              {/* Form fields */}
              <View className="space-y-4">
                {/* Name field (register only) */}
                {authMode === 'register' && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <Text className={cn("text-sm mb-1.5 font-medium", textColor)}>
                      Full Name
                    </Text>
                    <View className={cn(
                      "flex-row items-center rounded-xl px-4 py-3", 
                      inputBgColor
                    )}>
                      <Feather name="user" size={18} color={primaryColor} />
                      <TextInput
                        placeholder="Enter your name"
                        placeholderTextColor={placeholderColor}
                        value={name}
                        onChangeText={setName}
                        className={cn("flex-1 ml-3", textColor)}
                        autoCapitalize="words"
                      />
                    </View>
                  </MotiView>
                )}
                
                {/* Email field */}
                <View>
                  <Text className={cn("text-sm mb-1.5 font-medium", textColor)}>
                    Email Address
                  </Text>
                  <View className={cn(
                    "flex-row items-center rounded-xl px-4 py-3", 
                    inputBgColor
                  )}>
                    <Feather name="mail" size={18} color={primaryColor} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={placeholderColor}
                      value={email}
                      onChangeText={setEmail}
                      className={cn("flex-1 ml-3", textColor)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                
                {/* Password (login & register only) */}
                {(authMode === 'login' || authMode === 'register') && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <Text className={cn("text-sm mb-1.5 font-medium", textColor)}>
                      Password
                    </Text>
                    <View className={cn(
                      "flex-row items-center rounded-xl px-4 py-3", 
                      inputBgColor
                    )}>
                      <Feather name="lock" size={18} color={primaryColor} />
                      <TextInput
                        placeholder="Enter your password"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        className={cn("flex-1 ml-3", textColor)}
                      />
                    </View>
                  </MotiView>
                )}
                
                {/* Confirm Password (register only) */}
                {authMode === 'register' && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: 100 }}
                  >
                    <Text className={cn("text-sm mb-1.5 font-medium", textColor)}>
                      Confirm Password
                    </Text>
                    <View className={cn(
                      "flex-row items-center rounded-xl px-4 py-3", 
                      inputBgColor
                    )}>
                      <Feather name="lock" size={18} color={primaryColor} />
                      <TextInput
                        placeholder="Confirm your password"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        className={cn("flex-1 ml-3", textColor)}
                      />
                    </View>
                  </MotiView>
                )}
                
                {/* Error message */}
                {error && (
                  <MotiView 
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                    className="bg-red-500/20 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-red-500 text-sm">{error}</Text>
                  </MotiView>
                )}
                
                {/* Success message */}
                {success && (
                  <MotiView 
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                    className="bg-green-500/20 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-green-500 text-sm">{success}</Text>
                  </MotiView>
                )}
                
                {/* Submit button - Enhanced with better border radius */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="mt-2"
                  style={{
                    borderRadius: 30,
                    overflow: 'hidden',
                    backgroundColor: 'transparent'
                  }}
                >
                  <LinearGradient
                    colors={[primaryColor, accentColor]}
                    start={[0, 0]}
                    end={[1, 0]}
                    className="rounded-2xl py-4 items-center shadow-lg"
                    style={{ elevation: 4 }}
                  >
                    {loading ? (
                      <View className="h-6 w-6 items-center justify-center">
                        <Animated.View 
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: 'white',
                            borderTopColor: 'transparent',
                            transform: [{ rotate: iconRotation }]
                          }}
                        />
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-base">
                        {getButtonText()}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Auth mode toggle links */}
                <View className="flex-row justify-center space-x-1 mt-4">
                  <Text className={cn("text-sm", textColor)}>
                    {authMode === 'login' 
                      ? "Don't have an account?" 
                      : authMode === 'register'
                        ? "Already have an account?"
                        : "Remember your password?"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (authMode === 'login') setAuthMode('register');
                      else setAuthMode('login');
                    }}
                  >
                    <Text className="text-sm font-semibold text-primary ml-1">
                      {authMode === 'login' 
                        ? "Sign Up" 
                        : "Log In"}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Forgot Password link */}
                {authMode === 'login' && (
                  <TouchableOpacity
                    onPress={() => setAuthMode('forgot-password')}
                    className="flex-row justify-center mt-1"
                  >
                    <Text className="text-sm text-accent font-medium">
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
