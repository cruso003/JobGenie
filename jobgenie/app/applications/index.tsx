// app/(tabs)/applications.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from '@/stores/auth';
import LoadingIndicator from '@/components/ui/LoadingIndicator';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      
      if (error) throw error;
      
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'saved': return '#6366F1'; // Purple
      case 'applied': return '#3B82F6'; // Blue
      case 'interviewing': return '#F59E0B'; // Yellow
      case 'offered': return '#10B981'; // Green
      case 'rejected': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'saved': return 'bookmark';
      case 'applied': return 'check';
      case 'interviewing': return 'message-circle';
      case 'offered': return 'award';
      case 'rejected': return 'x-circle';
      default: return 'circle';
    }
  };
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          Applications
        </Text>
      </View>
      
      {applications.length > 0 ? (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.applicationCard, 
                { backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.8)' }
              ]}
              onPress={() => router.push({
                pathname: '/job-details',
                params: { jobId: item.external_job_id || item.id }
              })}
            >
              <View style={styles.cardContent}>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.status) + '20' }
                ]}>
                  <Feather 
                    name={getStatusIcon(item.status)} 
                    size={14} 
                    color={getStatusColor(item.status)} 
                  />
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(item.status) }
                  ]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
                
                <Text 
                  style={[styles.jobTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}
                  numberOfLines={1}
                >
                  {item.job_title}
                </Text>
                
                <Text 
                  style={[styles.companyName, { color: isDark ? '#D1D5DB' : '#4B5563' }]}
                  numberOfLines={1}
                >
                  {item.company_name}
                </Text>
                
                <Text style={[styles.locationText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {item.job_location || 'Remote'}
                </Text>
                
                <View style={styles.dateContainer}>
                  <Feather name="calendar" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <Text style={[styles.dateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {new Date(item.saved_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.arrowContainer}>
                <Feather 
                  name="chevron-right" 
                  size={20} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="briefcase" size={60} color={isDark ? '#374151' : '#E5E7EB'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            No applications yet
          </Text>
          <Text style={[styles.emptyDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Start by exploring jobs or saving positions you're interested in
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.exploreButtonText}>
              Explore Jobs
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  applicationCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
  },
  arrowContainer: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
