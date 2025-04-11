// app/(onboarding)/basic-info.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';

type Props = {
  initialData: {
    fullName: string;
    location: string;
    jobType: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
};

const jobTypes = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
];

export default function BasicInfoScreen({ initialData, onNext, onBack }: Props) {
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [jobType, setJobType] = useState(initialData.jobType || jobTypes[0].value);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const inputBgColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  const validateAndContinue = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your name';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Please enter your location';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext({
        fullName,
        location,
        jobType,
      });
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark 
          ? ['#111827', '#1E3A8A'] 
          : ['#F9FAFB', '#EFF6FF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
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
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={textColor} />
          </TouchableOpacity>
          
          <Text style={[styles.stepIndicator, { color: textColor }]}>
            Step 1 of 6
          </Text>
        </View>
        
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.contentContainer}
        >
          <Text style={[styles.title, { color: textColor }]}>
            Let's start with the basics
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            Tell me a bit about yourself so I can personalize your experience
          </Text>
          
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Full Name
              </Text>
              <View style={[
                styles.inputContainer, 
                { backgroundColor: inputBgColor, borderColor: errors.fullName ? '#EF4444' : borderColor }
              ]}>
                <Feather name="user" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Your full name"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: '' });
                    }
                  }}
                />
              </View>
              {errors.fullName ? (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              ) : null}
            </View>
            
            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Location
              </Text>
              <View style={[
                styles.inputContainer, 
                { backgroundColor: inputBgColor, borderColor: errors.location ? '#EF4444' : borderColor }
              ]}>
                <Feather name="map-pin" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="City, State or Remote"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    if (errors.location) {
                      setErrors({ ...errors, location: '' });
                    }
                  }}
                />
              </View>
              {errors.location ? (
                <Text style={styles.errorText}>{errors.location}</Text>
              ) : null}
            </View>
            
            {/* Job Type Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>
                Preferred Job Type
              </Text>
              <View style={[
                styles.pickerContainer, 
                { backgroundColor: inputBgColor, borderColor }
              ]}>
                <Feather name="briefcase" size={20} color="#6366F1" style={styles.inputIcon} />
                <View style={styles.picker}>
                  <Picker<string>
                    selectedValue={jobType}
                    onValueChange={(itemValue: string) => setJobType(itemValue)}
                    style={[styles.pickerInput, { color: textColor }]}
                    dropdownIconColor={textColor}
                  >
                    {jobTypes.map((type: { label: string; value: string }) => (
                      <Picker.Item 
                        key={type.value} 
                        label={type.label} 
                        value={type.value} 
                        color={isDark ? '#000000' : '#4B5563'}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </MotiView>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={validateAndContinue} activeOpacity={0.8}>
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
    </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 20,
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
  contentContainer: {
    flex: 1,
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
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  picker: {
    flex: 1,
  },
  pickerInput: {
    height: 50,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
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
