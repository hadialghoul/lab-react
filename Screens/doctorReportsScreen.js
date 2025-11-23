import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Config from '../config';

const BASE_URL = Config.BASE_URL; // Dynamic URL based on environment
const REQUEST_TIMEOUT_MS = 10000;

// Fetch with timeout helper
const fetchWithTimeout = (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);
};

// Token storage keys
const ACCESS_KEYS = ['access', 'access_token', 'token'];
const REFRESH_KEYS = ['refresh', 'refresh_token'];

const getFirstStored = async (keys) => {
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

export default function DoctorReportsScreen() {
  const navigation = useNavigation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [downloadingReports, setDownloadingReports] = useState(new Set());

  // Fetch with auth and auto-refresh
  const fetchWithAuth = async (url, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    let access = await getFirstStored(ACCESS_KEYS);
    const refresh = await getFirstStored(REFRESH_KEYS);

    if (access) headers.Authorization = `Bearer ${access}`;
    headers.Accept = headers.Accept || 'application/json';

    let res;
    try {
      res = await fetchWithTimeout(url, { ...options, headers }, REQUEST_TIMEOUT_MS);
    } catch (e) {
      throw e;
    }

    if (res.status !== 401) return res;

    // Try refresh if available
    if (refresh) {
      try {
        const rr = await fetchWithTimeout(`${BASE_URL}/accounts/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh }),
        }, REQUEST_TIMEOUT_MS);

        if (rr.ok) {
          const data = await rr.json().catch(() => ({}));
          if (data.access) {
            await AsyncStorage.setItem('access', data.access);
            headers.Authorization = `Bearer ${data.access}`;
            // Retry original request
            res = await fetchWithTimeout(url, { ...options, headers }, REQUEST_TIMEOUT_MS);
            return res;
          }
        }
      } catch (e) {
        // Ignore refresh error
      }
    }

    // Still 401, redirect to login
    navigation.navigate('doctorLogin');
    throw new Error('Authentication failed');
  };

  // Fetch patients with report data
  const fetchPatients = async () => {
    try {
      setError(null);
      const response = await fetchWithAuth(`${BASE_URL}/accounts/reports/patients/`);
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setDoctorInfo(data.doctor);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load patients');
      }
    } catch (error) {
      if (error.message === 'timeout') {
        setError('Request timed out. Please check your connection.');
      } else if (error.message === 'Authentication failed') {
        return; // Already handled by navigation
      } else {
        setError('Failed to load patients. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const downloadReport = async (reportId, reportTitle, patientName) => {
    try {
      setDownloadingReports(prev => new Set([...prev, reportId]));

      // Construct the report URL using the reportId
      const reportUrl = `${BASE_URL}/accounts/reports/view/${reportId}/`;

      // Try to open the PDF directly in browser (no auth required for simple view)
      const supported = await Linking.canOpenURL(reportUrl);

      if (supported) {
        await Linking.openURL(reportUrl);

        Alert.alert(
          'Report Opened',
          `Report "${reportTitle}" for ${patientName} has been opened in your browser.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Cannot open PDF viewer');
      }
    } catch (error) {
      Alert.alert(
        'View Error',
        `Failed to open report: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const viewPatientReports = async (patientId, patientName) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/accounts/reports/patient/${patientId}/`);
      
      if (response.ok) {
        const data = await response.json();
        const reports = data.reports || [];
        
        if (reports.length === 0) {
          Alert.alert(
            'No Reports',
            `No reports are available for ${patientName} yet.`,
            [{ text: 'OK' }]
          );
          return;
        }

        // Show list of available reports
        const reportOptions = reports.map((report, index) => ({
          text: `${report.title} (${report.generated_at})`,
          onPress: () => downloadReport(report.id, report.title, patientName)
        }));

        Alert.alert(
          `Reports for ${patientName}`,
          `${reports.length} report(s) available:`,
          [
            ...reportOptions,
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.error || 'Failed to load patient reports');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to load reports for ${patientName}: ${error.message}`
      );
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  };

  const renderPatientItem = ({ item: patient }) => {
    const isDownloading = downloadingReports.has(patient.id);
    const progressColor = getProgressColor(patient.progress_percentage);
    const hasReports = patient.reports_count > 0;

    return (
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientEmail}>{patient.email}</Text>
            {patient.phone && (
              <Text style={styles.patientPhone}>📞 {patient.phone}</Text>
            )}
            <Text style={styles.reportsCount}>
              📄 {patient.reports_count} report(s) available
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.downloadButton, 
              !hasReports && styles.disabledButton,
              isDownloading && styles.downloadingButton
            ]}
            onPress={() => viewPatientReports(patient.id, patient.name)}
            disabled={isDownloading || !hasReports}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                styles.downloadButtonText,
                !hasReports && styles.disabledButtonText
              ]}>
                {hasReports ? '📄 View Reports' : '📄 No Reports'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Treatment Progress</Text>
            <Text style={[styles.progressPercentage, { color: progressColor }]}>
              {patient.progress_percentage}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${patient.progress_percentage}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={styles.stepsInfo}>
            {patient.completed_steps} of {patient.total_steps} steps completed
          </Text>
        </View>

        <View style={styles.patientFooter}>
          <Text style={styles.lastActivity}>
            Last activity: {patient.last_activity}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Patient Reports</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5DCCBB" />
          <Text style={styles.loadingText}>Loading patient reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Reports</Text>
        {doctorInfo && (
          <Text style={styles.headerSubtitle}>
            Dr. {doctorInfo.name} • {doctorInfo.specialization}
          </Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setLoading(true);
            fetchPatients();
          }}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Reports Overview</Text>
            <Text style={styles.summaryText}>
              📊 {patients.length} patients • 📄 Reports available for download
            </Text>
          </View>

          <FlatList
            data={patients}
            renderItem={renderPatientItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No patients found</Text>
                <Text style={styles.emptySubtext}>
                  Patients assigned to you will appear here
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5DCCBB',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
  },
  reportsCount: {
    fontSize: 12,
    color: '#5DCCBB',
    fontWeight: '600',
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: '#5DCCBB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadingButton: {
    backgroundColor: '#999',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsInfo: {
    fontSize: 12,
    color: '#666',
  },
  patientFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  lastActivity: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1f4e79',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
