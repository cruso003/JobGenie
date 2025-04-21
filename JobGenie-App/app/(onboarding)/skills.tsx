// app/(onboarding)/skills.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';

type Props = {
  initialData: string[];
  onNext: (data: { skills: string[] }) => void;
  onBack: () => void;
};

// Common skill suggestions by category
const skillSuggestions = {
  technical: [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'SQL',
    'C#', 'AWS', 'Docker', 'Kubernetes', 'HTML/CSS', 'Git', 'PHP', 'Ruby'
  ],
  design: [
    'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 
    'Sketch', 'InDesign', 'Product Design', 'Wireframing', 'Prototyping'
  ],
  business: [
    'Project Management', 'Marketing', 'Sales', 'SEO', 'Data Analysis', 
    'Microsoft Office', 'Google Analytics', 'Content Writing', 'Copywriting',
    'Social Media Management', 'Customer Service', 'Leadership'
  ]
};

export default function SkillsScreen({ initialData, onNext, onBack }: Props) {
  const [skills, setSkills] = useState<string[]>(initialData || []);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [category, setCategory] = useState<'technical' | 'design' | 'business'>('technical');
  const [error, setError] = useState('');
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const inputBgColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)';
  
  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = skillSuggestions[category].filter(
        skill => skill.toLowerCase().includes(inputValue.toLowerCase()) && 
                !skills.includes(skill)
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [inputValue, category, skills]);
  
  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;
    
    // Check if skill already exists
    if (skills.some(s => s.toLowerCase() === trimmedSkill.toLowerCase())) {
      setError('This skill is already added');
      return;
    }
    
    setSkills([...skills, trimmedSkill]);
    setInputValue('');
    setError('');
    Keyboard.dismiss();
  };
  
  const removeSkill = (index: number) => {
    const newSkills = [...skills];
    newSkills.splice(index, 1);
    setSkills(newSkills);
  };
  
  const handleAddFromInput = () => {
    if (inputValue) {
      addSkill(inputValue);
    }
  };
  
  const handleContinue = () => {
    if (skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }
    
    onNext({ skills });
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
          Step 2 of 6
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
            What skills do you have?
          </Text>
          
          <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
            Add skills that showcase your expertise. These will help match you with relevant opportunities.
          </Text>
          
          {/* Category selector */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                category === 'technical' && styles.activeCategory,
                { borderColor: category === 'technical' ? '#6366F1' : borderColor }
              ]}
              onPress={() => setCategory('technical')}
            >
              <Text style={[
                styles.categoryText,
                category === 'technical' && styles.activeCategoryText
              ]}>
                Technical
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                category === 'design' && styles.activeCategory,
                { borderColor: category === 'design' ? '#6366F1' : borderColor }
              ]}
              onPress={() => setCategory('design')}
            >
              <Text style={[
                styles.categoryText,
                category === 'design' && styles.activeCategoryText
              ]}>
                Design
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                category === 'business' && styles.activeCategory,
                { borderColor: category === 'business' ? '#6366F1' : borderColor }
              ]}
              onPress={() => setCategory('business')}
            >
              <Text style={[
                styles.categoryText,
                category === 'business' && styles.activeCategoryText
              ]}>
                Business
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Skill input */}
          <View style={styles.inputGroup}>
            <View style={[
              styles.inputContainer, 
              { backgroundColor: inputBgColor, borderColor }
            ]}>
              <Feather name="tool" size={20} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Add a skill (e.g., JavaScript, Figma)"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleAddFromInput}
                returnKeyType="done"
              />
              {inputValue ? (
                <TouchableOpacity onPress={handleAddFromInput} style={styles.addButton}>
                  <Feather name="plus" size={20} color="#6366F1" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: textColor }]}>
                Suggestions:
              </Text>
              <View style={styles.suggestionTags}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionTag, { borderColor }]}
                    onPress={() => addSkill(suggestion)}
                  >
                    <Text style={[styles.suggestionText, { color: textColor }]}>
                      {suggestion}
                    </Text>
                    <Feather name="plus" size={14} color="#6366F1" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* Popular in category */}
          <View style={styles.popularContainer}>
            <Text style={[styles.suggestionsTitle, { color: textColor }]}>
              Popular in {category}:
            </Text>
            <View style={styles.suggestionTags}>
              {skillSuggestions[category].slice(0, 8).map((skill, index) => (
                !skills.includes(skill) && (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionTag, { borderColor }]}
                    onPress={() => addSkill(skill)}
                  >
                    <Text style={[styles.suggestionText, { color: textColor }]}>
                      {skill}
                    </Text>
                    <Feather name="plus" size={14} color="#6366F1" />
                  </TouchableOpacity>
                )
              ))}
            </View>
          </View>
          
          {/* Selected skills */}
          {skills.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={[styles.selectedTitle, { color: textColor }]}>
                Your skills ({skills.length}):
              </Text>
              <View style={styles.selectedTags}>
                {skills.map((skill, index) => (
                  <MotiView
                    key={index}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={[
                      styles.skillTag, 
                      { backgroundColor: '#6366F1' }
                    ]}
                  >
                    <Text style={styles.skillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(index)}>
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </MotiView>
                ))}
              </View>
            </View>
          )}
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
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeCategory: {
    borderBottomWidth: 2,
  },
  categoryText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
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
  addButton: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  popularContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
  },
  selectedContainer: {
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
