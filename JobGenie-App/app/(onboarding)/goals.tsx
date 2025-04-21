// app/onboarding/screens/GoalsScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';

type Props = {
  initialData: {
    interests: string[];
    goals: string[];
  };
  onNext: (data: any) => void;
  onBack: () => void;
};

// Available interests
const availableInterests = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'AI', 'UX/UI Design', 'Graphic Design', 'Product Management', 'Marketing',
  'SEO', 'Content Writing', 'Copywriting', 'Social Media', 'E-commerce',
  'Cybersecurity', 'Cloud Computing', 'Blockchain', 'Game Development', 
  'AR/VR', 'IoT', 'DevOps', 'Business Analysis', 'Project Management'
];

// Available goals
const availableGoals = [
  'Find a new job', 'Get promoted', 'Switch careers', 'Learn new skills',
  'Build a portfolio', 'Improve resume', 'Network with professionals',
  'Start freelancing', 'Prepare for interviews', 'Salary negotiation',
  'Work remotely', 'Relocate', 'Start a business'
];

export default function GoalsScreen({ initialData, onNext, onBack }: Props) {
  const [interests, setInterests] = useState<string[]>(initialData.interests || []);
  const [goals, setGoals] = useState<string[]>(initialData.goals || []);
  const [error, setError] = useState('');
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };
  
  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };
  
  const handleContinue = () => {
    if (interests.length === 0) {
      setError('Please select at least one interest');
      return;
    }
    
    if (goals.length === 0) {
      setError('Please select at least one goal');
      return;
    }
    
    onNext({
      interests,
      goals
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
          Step 4 of 6
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
            What are your interests and goals?
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            Select topics that interest you and what you're trying to achieve
          </Text>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          {/* Interests Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Your Interests
            </Text>
            <Text style={styles.sectionSubtitle}>
              Select areas you're interested in (select multiple)
            </Text>
            
            <View style={styles.tagsContainer}>
              {availableInterests.map((interest, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    interests.includes(interest) ? styles.selectedTag : { borderColor },
                    { backgroundColor: interests.includes(interest) ? '#6366F1' : 'transparent' }
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text 
                    style={[
                      styles.tagText,
                      { color: interests.includes(interest) ? '#FFFFFF' : textColor }
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Goals Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Your Goals
            </Text>
            <Text style={styles.sectionSubtitle}>
              What are you looking to achieve? (select multiple)
            </Text>
            
            <View style={styles.tagsContainer}>
              {availableGoals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    goals.includes(goal) ? styles.selectedTag : { borderColor },
                    { backgroundColor: goals.includes(goal) ? '#6366F1' : 'transparent' }
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text 
                    style={[
                      styles.tagText,
                      { color: goals.includes(goal) ? '#FFFFFF' : textColor }
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Selected Summary */}
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
              Selected: {interests.length} interests, {goals.length} goals
            </Text>
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
    marginBottom: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedTag: {
    borderColor: '#6366F1',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 14,
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
