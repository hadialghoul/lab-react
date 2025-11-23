import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Config from '../config';

export default function DoctorPatientTreatmentScreen() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // helper: perform fetch with access token and automatic refresh on 401 (retry once)
  async function fetchWithAuth(url, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    // try common keys for access token
    const accessKeys = ['access', 'access_token', 'token'];
    const refreshKeys = ['refresh', 'refresh_token'];
    let access = null;
    let refresh = null;
    for (const k of accessKeys) {
      const v = await AsyncStorage.getItem(k);
      if (v) { access = v; break; }
    }
    for (const k of refreshKeys) {
      const v = await AsyncStorage.getItem(k);
      if (v) { refresh = v; break; }
    }
    console.log('fetchWithAuth: access key present?', !!access, 'refresh key present?', !!refresh);

    if (access) headers['Authorization'] = `Bearer ${access}`;
    headers['Accept'] = headers['Accept'] || 'application/json';

    let res = await fetch(url, { ...options, headers });
    // if first attempt succeeded (not 401) return
    if (res.status !== 401) return res;

    // if 401 and we have a refresh token, try refreshing (or if access missing but refresh present)
    if (refresh) {
      try {
        const refreshRes = await fetch(Config.REFRESH_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        console.log('refresh response status:', refreshRes.status);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json().catch(() => ({}));
          console.log('refreshData', refreshData);
          if (refreshData.access) {
            await AsyncStorage.setItem('access', refreshData.access);
            headers['Authorization'] = `Bearer ${refreshData.access}`;
            // retry original request with new access
            res = await fetch(url, { ...options, headers });
            return res;
          }
        }
      } catch (e) {
        console.warn('refresh attempt failed', e);
      }
    }

    // no refresh available or refresh failed -> clear tokens and navigate to login
    await AsyncStorage.removeItem('access');
    await AsyncStorage.removeItem('refresh');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    // navigation is available in this component scope
    Alert.alert('Session expired', 'Please sign in again.', [{ text: 'OK', onPress: () => navigation.navigate('login-doctor') }]);
    return res;
  }

  const fetchPatients = async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    
    try {
      // First, let's check what user we're logged in as
      console.log('=== DEBUGGING DOCTOR PATIENT FETCH ===');
      const meRes = await fetchWithAuth(Config.USER_PROFILE_URL, { method: 'GET' });
      if (meRes.ok) {
        const meData = await meRes.json();
        console.log('Current doctor user info:', meData);
        console.log('Is doctor:', meData.is_doctor);
        console.log('Is patient:', meData.is_patient);
        console.log('Is staff:', meData.is_staff);
        console.log('Doctor ID:', meData.doctor_id);
        console.log('Patient ID:', meData.patient_id);
        
        // Check if this is actually a patient trying to access doctor functionality
        if (meData.is_patient && !meData.is_doctor) {
          console.log('🚨 ERROR: Patient user trying to access doctor screen!');
          setError(`You are logged in as a patient. Please log in as a doctor.`);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        if (!meData.is_doctor) {
          console.log('🚨 ERROR: Non-doctor user trying to access patient list!');
          setError(`Access denied. Please log in as a doctor.`);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Use the patients endpoint which works for doctors - try both endpoints for compatibility
      console.log('Fetching patients for logged-in doctor...');
      console.log('🔍 Trying primary endpoint: /accounts/patients/');
      let res = await fetchWithAuth(Config.PATIENTS_URL, { method: 'GET' });
      
      // If that fails, try the alternative endpoint
      if (!res.ok && res.status === 404) {
        console.log('🔍 Primary endpoint failed, trying alternative: /accounts/doctor/patients/');
        res = await fetchWithAuth(Config.DOCTOR_PATIENTS_URL, { method: 'GET' });
      }

      // debug: log status for troubleshooting
      console.log('fetchPatients final status:', res.status);
      console.log('fetchPatients response ok:', res.ok);

      if (res.status === 401) {
        // final unauthorized
        await AsyncStorage.removeItem('access');
        await AsyncStorage.removeItem('refresh');
        Alert.alert(
          'Session Expired',
          'Please log in again to continue.',
          [{ text: 'OK', onPress: () => navigation.navigate('login-doctor') }]
        );
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch patients (${res.status})`);
      const data = await res.json();

      console.log('Raw patients data received:', data);
      console.log('Number of patients received:', Array.isArray(data) ? data.length : 'Not an array');
      if (Array.isArray(data) && data.length > 0) {
        console.log('First patient:', data[0]);
        console.log('All patient IDs:', data.map(p => p.id));
      }

      if (!Array.isArray(data) || data.length === 0) {
        // No patients found - not an error, just empty
        setPatients([]);
        setError(null);
      } else {
        setPatients(data);
        setError(null);
      }
    } catch (error) {
      console.log("Error fetching patients:", error);
      setError(error.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const onRefresh = () => {
    fetchPatients(true);
  };

  // navigate to the treatment steps screen for the selected patient
  const handlePatientPress = (patient) => {
    Alert.alert(
      `Patient: ${patient.username || 'Unknown'}`,
      'Where would you like to go?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Treatment Steps',
          onPress: () => {
            navigation.navigate('doctor-patient-steps', { 
              patientId: patient.id,
              patientName: patient.username 
            });
          }
        },
        {
          text: 'Patient Stage',
          onPress: () => {
            navigation.navigate('patient-stage', { 
              patientId: patient.id,
              patientName: patient.username 
            });
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderPatientCard = React.useCallback(({ item, index }) => (
    <TouchableOpacity 
      style={[styles.patientCard, { marginTop: index === 0 ? 0 : 12 }]}
      onPress={() => handlePatientPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.username ? item.username.charAt(0).toUpperCase() : 'P'}
          </Text>
        </View>
        
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.username || 'Unknown Patient'}</Text>
          <Text style={styles.patientId}>ID: #{item.id}</Text>
          {item.email && <Text style={styles.patientEmail}>{item.email}</Text>}
        </View>
        
        <View style={styles.cardActions}>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      </View>
      
      {item.last_visit && (
        <View style={styles.cardFooter}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.lastVisit}>Last visit: {item.last_visit}</Text>
        </View>
      )}
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
        <Text style={styles.statusText}>Active</Text>
      </View>
    </TouchableOpacity>
  ), [handlePatientPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Patients Found</Text>
      <Text style={styles.emptySubtitle}>
        You don't have any patients assigned yet.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={() => fetchPatients()}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon name="error-outline" size={80} color="#f44336" />
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchPatients()}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
          <Text style={styles.heading}>My Patients</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5DCCBB" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.heading}>My Patients</Text>
          <Text style={styles.subheading}>
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => fetchPatients()}
        >
          <Icon name="refresh" size={24} color="#5DCCBB" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          renderErrorState()
        ) : (
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPatientCard}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            initialNumToRender={8}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
            contentContainerStyle={[
              styles.listContainer,
              patients.length === 0 && styles.emptyListContainer
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#5DCCBB']}
                tintColor="#5DCCBB"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: '#6c757d',
  },
  headerAction: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5DCCBB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  patientId: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  cardActions: {
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastVisit: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#5DCCBB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});