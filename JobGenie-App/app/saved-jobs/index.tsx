import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useJobsStore } from "@/stores/jobs";
import JobCard from "@/components/home/JobCard";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

export default function SavedJobsScreen() {
  const { savedJobs, fetchSavedJobs, isLoading } = useJobsStore();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  useEffect(() => {
    fetchSavedJobs();
  }, []);
  
  const filteredJobs = filterStatus 
    ? savedJobs.filter(job => job.status === filterStatus)
    : savedJobs;
  
  const statusCounts = {
    all: savedJobs.length,
    saved: savedJobs.filter(job => job.status === 'saved').length,
    applied: savedJobs.filter(job => job.status === 'applied').length,
    interviewing: savedJobs.filter(job => job.status === 'interviewing').length,
    offered: savedJobs.filter(job => job.status === 'offered').length,
    rejected: savedJobs.filter(job => job.status === 'rejected').length,
  };
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
      <LinearGradient
        colors={isDark ? ["#111827", "#1E3A8A"] : ["#F9FAFB", "#EFF6FF"]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={isDark ? "#FFFFFF" : "#111827"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
          Saved Jobs
        </Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather name="filter" size={22} color={isDark ? "#FFFFFF" : "#111827"} />
        </TouchableOpacity>
      </View>
      
      {/* Filter indicator if active */}
      {filterStatus && (
        <View style={styles.activeFilterContainer}>
          <Text style={[styles.activeFilterText, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
            Filtered by: 
            <Text style={{ fontWeight: '600', color: isDark ? "#FFFFFF" : "#111827" }}>
              {" " + filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
            </Text>
          </Text>
          <TouchableOpacity onPress={() => setFilterStatus(null)}>
            <Feather name="x-circle" size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Job List */}
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.jobsListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather 
                name="bookmark" 
                size={50} 
                color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} 
              />
              <Text style={[styles.emptyStateTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                No saved jobs yet
              </Text>
              <Text style={[styles.emptyStateText, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
                Save jobs you're interested in to track them here
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.emptyStateButtonText}>Find Jobs</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.jobCardContainer}
              onPress={() => router.push({
                pathname: "/job-details",
                params: { jobId: item.external_job_id }
              })}
              activeOpacity={0.7}
            >
              <JobCard 
                job={{
                  job_id: item.external_job_id,
                  job_title: item.job_title,
                  employer_name: item.company_name,
                  job_description: item.job_description,
                  job_city: item.job_location,
                  salary_range: item.salary_range,
                  match_percentage: item.match_percentage || 100,
                }}
                isDark={isDark}
              />
            </TouchableOpacity>
          )}
        />
      )}
      
      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable 
            style={[
              styles.modalContent, 
              { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                Filter Jobs
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color={isDark ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === null && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus(null);
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === null && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === null ? '#FFFFFF' : '#D1D5DB') : (filterStatus === null ? '#111827' : '#6B7280') }
              ]}>
                All Jobs ({statusCounts.all})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === 'saved' && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus('saved');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === 'saved' && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === 'saved' ? '#FFFFFF' : '#D1D5DB') : (filterStatus === 'saved' ? '#111827' : '#6B7280') }
              ]}>
                Saved ({statusCounts.saved})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === 'applied' && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus('applied');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === 'applied' && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === 'applied' ? '#FFFFFF' : '#D1D5DB') : (filterStatus === 'applied' ? '#111827' : '#6B7280') }
              ]}>
                Applied ({statusCounts.applied})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === 'interviewing' && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus('interviewing');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === 'interviewing' && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === 'interviewing' ? '#FFFFFF' : '#D1D5DB') : (filterStatus === 'interviewing' ? '#111827' : '#6B7280') }
              ]}>
                Interviewing ({statusCounts.interviewing})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === 'offered' && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus('offered');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === 'offered' && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === 'offered' ? '#FFFFFF' : '#D1D5DB') : (filterStatus === 'offered' ? '#111827' : '#6B7280') }
              ]}>
                Offered ({statusCounts.offered})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filterStatus === 'rejected' && styles.selectedFilterOption,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setFilterStatus('rejected');
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                filterStatus === 'rejected' && styles.selectedFilterOptionText,
                { color: isDark ? (filterStatus === 'rejected' ? '#FFFFFF' : '#D1D5DB') : (filterStatus === 'rejected' ? '#111827' : '#6B7280') }
              ]}>
                Rejected ({statusCounts.rejected})
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  activeFilterText: {
    fontSize: 14,
    marginRight: 8,
  },
  jobsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  jobCardContainer: {
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterOptionText: {
    fontSize: 16,
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
});
