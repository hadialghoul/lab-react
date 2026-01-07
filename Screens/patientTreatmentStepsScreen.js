import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import Config from '../config';

const BASE_URL = Config.BASE_URL; // Dynamic URL based on environment
const REQUEST_TIMEOUT_MS = 7000;

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

export default function PatientTreatmentStepsScreen() {
  const navigation = useNavigation();
  
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Fetch with auth and auto-refresh
  const fetchWithAuth = useCallback(async (url, options = {}) => {
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
    
    // Clear tokens and force login
    await AsyncStorage.removeItem('access');
    await AsyncStorage.removeItem('refresh');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    Alert.alert('Session expired', 'Please sign in again.', [
      { text: 'OK', onPress: () => navigation.navigate('login-patient') }
    ]);
    return res;
  }, [navigation]);


  // Get user info first
  const fetchUserInfo = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/accounts/me/`);
      if (res.ok) {
        const userData = await res.json();
        setUserInfo(userData);
        return userData;
      }
    } catch (err) {
      console.warn('Error fetching user info:', err);
    }
    return null;
  }, [fetchWithAuth]);

  // Fetch patient's own treatment steps
  const fetchSteps = useCallback(async () => {
    setError(null);
    setLoading(true);
    
    try {
      const token = await getFirstStored(ACCESS_KEYS);
      if (!token) {
        Alert.alert('Authentication required', 'Please sign in again.', [
          { text: 'OK', onPress: () => navigation.navigate('login-patient') },
        ]);
        setLoading(false);
        return;
      }

      // Get user info to find patient ID
      const userData = await fetchUserInfo();
      if (!userData || !userData.patient_id) {
        setError('Unable to find patient information. Please contact support.');
        setLoading(false);
        return;
      }

      const patientId = userData.patient_id;
      console.log('Fetching treatment steps for patient ID:', patientId);

      // Try the patient treatment steps endpoint
      const url = `${BASE_URL}/accounts/patients/${patientId}/treatment-steps/`;
      console.log('Requesting URL:', url);
      
      const res = await fetchWithAuth(url);
      
      if (res.status === 401) {
        setLoading(false);
        return; // fetchWithAuth already handled this
      }

      if (res.ok) {
        const data = await res.json();
        console.log('Treatment steps data:', data);
        
        if (Array.isArray(data)) {
          setSteps(data);
          setError(null);
        } else {
          setSteps([]);
          setError('No treatment steps found. Contact your doctor to set up your treatment plan.');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setError('No treatment plan assigned yet. Please contact your doctor.');
        } else {
          setError(`Error: ${errorData.detail || 'Failed to load treatment steps'}`);
        }
        setSteps([]);
      }
    } catch (err) {
      console.warn('Fetch steps error:', err);
      setError('Network error while fetching treatment steps.');
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [navigation, fetchWithAuth, fetchUserInfo]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSteps();
    setRefreshing(false);
  };

  const openStepPhotos = (step) => {
    navigation.navigate('step-photos', { stepId: step.id, stepName: step.name });
  };

  const renderItem = ({ item }) => {
    const stepPhotos = item.photos || [];
    const stepImageUrl = item.image_url;
    
    const primaryThumb = stepPhotos.length > 0 
      ? stepPhotos[0].image_url 
      : stepImageUrl;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => openStepPhotos(item)} 
        activeOpacity={0.8}
      >
        <View style={styles.row}>
          {primaryThumb ? (
            <Image source={{ uri: primaryThumb }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.placeholder]}>
              <Text style={styles.placeholderText}>{item.name?.charAt(0) || 'S'}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title}>{item.name}</Text>
            <Text numberOfLines={2} style={styles.desc}>
              {item.description || 'No description'}
            </Text>
            
            {stepPhotos.length > 0 && (
              <Text style={styles.photoCount}>
                📷 {stepPhotos.length} photo{stepPhotos.length !== 1 ? 's' : ''}
              </Text>
            )}
            
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Duration: {item.duration_days}d</Text>
              <Text style={styles.meta}>Start: {item.start_date}</Text>
            </View>
            
            {stepPhotos.length > 1 && (
              <View style={styles.photoGallery}>
                {stepPhotos.slice(1, 4).map((photo, index) => (
                  <Image 
                    key={photo.id || index} 
                    source={{ uri: photo.image_url }} 
                    style={styles.smallThumb} 
                  />
                ))}
                {stepPhotos.length > 4 && (
                  <View style={[styles.smallThumb, styles.morePhotos]}>
                    <Text style={styles.morePhotosText}>+{stepPhotos.length - 4}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#A5D6A7" />
        <Text style={styles.loadingText}>Loading your treatment plan...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSteps()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!steps.length) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>No Treatment Steps</Text>
        <Text style={styles.emptySubtitle}>
          Your treatment plan hasn't been set up yet.{'\n'}
          Please contact your doctor.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSteps()}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{ padding: 12 }}
        data={steps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  list: { 
    backgroundColor: '#E8F5E9', 
    flex: 1 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 12, 
    elevation: 2 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  thumb: { 
    width: 84, 
    height: 84, 
    borderRadius: 8, 
    marginRight: 12, 
    backgroundColor: '#eee' 
  },
  placeholder: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    color: '#888', 
    fontSize: 20, 
    fontWeight: '700' 
  },
  info: { 
    flex: 1 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111' 
  },
  desc: { 
    color: '#444', 
    marginTop: 6 
  },
  photoCount: { 
    color: '#A5D6A7', 
    fontSize: 12, 
    fontWeight: '600', 
    marginTop: 4 
  },
  metaRow: { 
    flexDirection: 'row', 
    marginTop: 8, 
    justifyContent: 'space-between' 
  },
  meta: { 
    color: '#666', 
    fontSize: 12 
  },
  photoGallery: { 
    flexDirection: 'row', 
    marginTop: 8, 
    gap: 4,
  },
  smallThumb: { 
    width: 32, 
    height: 32, 
    borderRadius: 4, 
    backgroundColor: '#eee',
  },
  morePhotos: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  morePhotosText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 6 
  },
  emptySubtitle: { 
    color: '#666', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  retryBtn: { 
    backgroundColor: '#A5D6A7', 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  retryText: { 
    color: '#2C3E50', 
    fontWeight: '600' 
  },
  errorText: { 
    color: '#d32f2f', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

})
