// app/(onboarding)/optional-cv.tsx - Simplified to just CV text input
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';

type Props = {
  initialData?: {
    text?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
};

export default function OptionalCVScreen({ initialData, onNext, onBack }: Props) {
  const [cvText, setCvText] = useState(initialData?.text || '');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const inputBgColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  const handleContinue = () => {
    // Process and save the CV text
    onNext({
      cv: {
        text: cvText.trim()
      }
    });
  };
  
  const handleSkip = () => {
    onNext({});
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={textColor} />
        </TouchableOpacity>
        
        <Text style={[styles.stepIndicator, { color: textColor }]}>
          Step 5 of 6
        </Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Text style={[styles.title, { color: textColor }]}>
            Add your resume content
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            Paste your resume text to help me understand your experience and generate better job recommendations (optional)
          </Text>
          
          {/* CV Text Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Paste your resume text
            </Text>
            <Text style={styles.sectionSubtitle}>
              Copy and paste the content from your current resume
            </Text>
            
            <View style={[
              styles.textAreaContainer, 
              { backgroundColor: inputBgColor, borderColor }
            ]}>
              <TextInput
                style={[styles.textArea, { color: textColor }]}
                multiline
                numberOfLines={12}
                placeholder="Paste your resume content here..."
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                value={cvText}
                onChangeText={setCvText}
                textAlignVertical="top"
              />
            </View>
          </View>
          
          <View style={styles.aiMessage}>
            <Feather name="info" size={16} color="#6366F1" />
            <Text style={styles.aiMessageText}>
              Later, I can help you create ATS-friendly resume versions tailored to specific job applications.
            </Text>
          </View>
        </MotiView>
      </ScrollView>
      
      <View style={styles.footer}>
        {loading ? (
          <View style={[styles.loadingButton, { backgroundColor: '#9CA3AF' }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.buttonText}>Processing...</Text>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              onPress={handleSkip} 
              style={[styles.skipButton, { borderColor: '#6366F1' }]}
            >
              <Text style={{ color: '#6366F1', fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleContinue} 
              style={styles.continueButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#06B6D4']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Continue</Text>
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    minHeight: 200,
  },
  aiMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  aiMessageText: {
    fontSize: 14,
    color: '#6366F1',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  loadingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  continueButton: {
    flex: 2,
  },
  gradientButton: {
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
