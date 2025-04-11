// app/(onboarding)/experience.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import Slider from '@react-native-community/slider';

type Props = {
  initialData: {
    level: 'beginner' | 'intermediate' | 'advanced';
    yearsOfExperience: number;
    currentTitle?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
};

export default function ExperienceScreen({ initialData, onNext, onBack }: Props) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(initialData.level || 'beginner');
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData.yearsOfExperience || 0);
  const [currentTitle, setCurrentTitle] = useState(initialData.currentTitle || '');
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const inputBgColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  const handleContinue = () => {
    onNext({
      experience: {
        level,
        yearsOfExperience,
        currentTitle: currentTitle.trim() || undefined,
      }
    });
  };
  
  return (
    <View style={{ flex: 1 }}>
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
          Step 3 of 6
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
            Tell me about your experience
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            This helps me recommend suitable job opportunities and career paths
          </Text>
          
          {/* Experience Level */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Experience Level
            </Text>
            
            <View style={styles.levelsContainer}>
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  level === 'beginner' && styles.selectedLevel,
                  { borderColor: level === 'beginner' ? '#6366F1' : borderColor }
                ]}
                onPress={() => setLevel('beginner')}
              >
                <View style={[
                  styles.levelIconContainer,
                  { backgroundColor: level === 'beginner' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }
                ]}>
                  <Feather name="user" size={22} color="#6366F1" />
                </View>
                <Text style={[
                  styles.levelTitle,
                  { color: textColor }
                ]}>
                  Beginner
                </Text>
                <Text style={styles.levelDescription}>
                  Just starting out or have minimal experience
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  level === 'intermediate' && styles.selectedLevel,
                  { borderColor: level === 'intermediate' ? '#6366F1' : borderColor }
                ]}
                onPress={() => setLevel('intermediate')}
              >
                <View style={[
                  styles.levelIconContainer,
                  { backgroundColor: level === 'intermediate' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }
                ]}>
                  <Feather name="user-check" size={22} color="#6366F1" />
                </View>
                <Text style={[
                  styles.levelTitle,
                  { color: textColor }
                ]}>
                  Intermediate
                </Text>
                <Text style={styles.levelDescription}>
                  Have some experience and skills in this field
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  level === 'advanced' && styles.selectedLevel,
                  { borderColor: level === 'advanced' ? '#6366F1' : borderColor }
                ]}
                onPress={() => setLevel('advanced')}
              >
                <View style={[
                  styles.levelIconContainer,
                  { backgroundColor: level === 'advanced' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }
                ]}>
                  <Feather name="award" size={22} color="#6366F1" />
                </View>
                <Text style={[
                  styles.levelTitle,
                  { color: textColor }
                ]}>
                  Advanced
                </Text>
                <Text style={styles.levelDescription}>
                  Seasoned professional with extensive experience
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Years of Experience */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Years of Experience: {yearsOfExperience}
            </Text>
            
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              step={1}
              value={yearsOfExperience}
              onValueChange={setYearsOfExperience}
              minimumTrackTintColor="#6366F1"
              maximumTrackTintColor={isDark ? '#4B5563' : '#D1D5DB'}
              thumbTintColor="#6366F1"
            />
            
            <View style={styles.sliderLabels}>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>0</Text>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>5</Text>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>10</Text>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>15</Text>
              <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>20+</Text>
            </View>
          </View>
          
          {/* Current Job Title */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Current Job Title (optional)
            </Text>
            
            <View style={[
              styles.inputContainer, 
              { backgroundColor: inputBgColor, borderColor }
            ]}>
              <Feather name="briefcase" size={20} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="e.g., Software Engineer, Designer"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                value={currentTitle}
                onChangeText={setCurrentTitle}
              />
            </View>
          </View>
        </MotiView>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6366F1', '#06B6D4']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 16,
  },
  levelsContainer: {
    gap: 16,
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedLevel: {
    borderWidth: 2,
  },
  levelIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  levelDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
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
