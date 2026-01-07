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
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import Config from '../config';
import CachedImage from '../components/CachedImage';

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

export default function DoctorPatientSteps() {
  const route = useRoute();
  const navigation = useNavigation();
  const { patientId, patientName } = route.params || {};

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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
      { text: 'OK', onPress: () => navigation.navigate('login-doctor') }
    ]);
    return res;
  }, [navigation]);

  // Fetch patient's treatment steps
  const fetchSteps = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const token = await getFirstStored(ACCESS_KEYS);
      if (!token) {
        Alert.alert('Authentication required', 'Please sign in again.', [
          { text: 'OK', onPress: () => navigation.navigate('login-doctor') },
        ]);
        setLoading(false);
        return;
      }

      // Validate patientId
      const pid = String(patientId ?? '').trim();
      if (!/^\d+$/.test(pid)) {
        setError('Invalid or missing patient ID');
        setSteps([]);
        setLoading(false);
        console.warn('doctorPatientSteps: invalid patientId', patientId);
        return;
      }

      console.log('Doctor fetching treatment steps for patient ID:', pid);

      // Try different URLs that should work for doctors viewing patient steps
      const candidateUrls = [
        `${BASE_URL}/accounts/patients/${pid}/treatment-steps/`,
        `${BASE_URL}/accounts/doctor/patients/${pid}/treatment-steps/`,
        `${BASE_URL}/accounts/doctor/patients/${pid}/treatment/`,
      ];

      let foundSteps = null;
      let lastError = null;

      for (const url of candidateUrls) {
        try {
          console.log('Trying URL:', url);
          const res = await fetchWithAuth(url);
          
          if (res.status === 401) {
            setLoading(false);
            return; // fetchWithAuth already handled this
          }

          if (res.ok) {
            const data = await res.json();
            console.log('Response from', url, ':', data);

            // Handle different response formats
            if (Array.isArray(data)) {
              foundSteps = data;
              break;
            } else if (data.steps && Array.isArray(data.steps)) {
              foundSteps = data.steps;
              break;
            } else if (data.treatment && data.treatment.steps && Array.isArray(data.treatment.steps)) {
              foundSteps = data.treatment.steps;
              break;
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            lastError = errorData;
            console.log('Error from', url, ':', errorData);
          }
        } catch (err) {
          console.warn('Error trying URL', url, ':', err);
          lastError = err;
        }
      }

      if (foundSteps && foundSteps.length > 0) {
        setSteps(foundSteps);
        setError(null);
      } else {
        setSteps([]);
        if (lastError && lastError.detail) {
          setError(`No treatment steps found: ${lastError.detail}`);
        } else {
          setError(`No treatment steps found for patient ${patientName || pid}. The patient may not have a treatment plan assigned yet.`);
        }
      }
    } catch (err) {
      console.warn('Fetch steps error:', err);
      setError('Network error while fetching treatment steps.');
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, patientName, navigation, fetchWithAuth]);

  useEffect(() => {
    if (!patientId) {
      setError('Missing patient ID');
      setLoading(false);
      return;
    }
    
    // Set the screen title
    navigation.setOptions({ 
      title: patientName ? `${patientName} - Treatment Steps` : 'Patient Treatment Steps' 
    });
    
    fetchSteps();
  }, [patientId, patientName, fetchSteps, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSteps();
    setRefreshing(false);
  };

  const openStepPhotos = (step) => {
    const stepPhotos = step.photos || [];
    if (stepPhotos.length === 0) {
      Alert.alert('No Photos', 'No photos available for this step');
      return;
    }
    setSelectedPhotos(stepPhotos);
    setSelectedPhotoIndex(0);
    setGalleryVisible(true);
  };

  // Close gallery
  const closeGallery = () => {
    setGalleryVisible(false);
    setSelectedPhotos([]);
    setSelectedPhotoIndex(0);
  };

  const renderItem = ({ item }) => {
    const stepPhotos = item.photos || [];
    const stepImageUrl = item.image_url;

    return (
      <View style={styles.card}>
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepInfo}>
            <Text style={styles.title}>{item.name}</Text>
            <Text numberOfLines={2} style={styles.desc}>
              {item.description || 'No description'}
            </Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>{item.duration_days} days</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Start Date</Text>
                <Text style={styles.metaValue}>{item.start_date || 'Not set'}</Text>
              </View>
              {stepPhotos.length > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Photos</Text>
                  <Text style={styles.metaValue}>{stepPhotos.length}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Step Image (if exists) */}
        {stepImageUrl && (
          <View style={styles.stepImageContainer}>
            <Text style={styles.sectionTitle}>Step Reference</Text>
            <CachedImage 
              source={{ uri: stepImageUrl }} 
              style={styles.stepImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Photos Gallery */}
        {stepPhotos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              Patient Photos ({stepPhotos.length})
            </Text>
            
            {stepPhotos.length === 1 ? (
              // Single photo - show large
              <TouchableOpacity 
                style={styles.singlePhotoContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.9}
              >
                <CachedImage 
                  source={{ uri: stepPhotos[0].image_url }} 
                  style={styles.singlePhoto} 
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>Tap to view full size</Text>
                </View>
              </TouchableOpacity>
            ) : stepPhotos.length === 2 ? (
              // Two photos - show side by side
              <TouchableOpacity 
                style={styles.twoPhotosContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.9}
              >
                <CachedImage 
                  source={{ uri: stepPhotos[0].image_url }} 
                  style={styles.halfPhoto} 
                  resizeMode="cover"
                />
                <CachedImage 
                  source={{ uri: stepPhotos[1].image_url }} 
                  style={styles.halfPhoto} 
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>Tap to view gallery</Text>
                </View>
              </TouchableOpacity>
            ) : (
              // Multiple photos - show grid with overlay
              <TouchableOpacity 
                style={styles.multiplePhotosContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.9}
              >
                <View style={styles.photoGrid}>
                  <CachedImage 
                    source={{ uri: stepPhotos[0].image_url }} 
                    style={styles.gridPhotoLarge} 
                    resizeMode="cover"
                  />
                  <View style={styles.gridRight}>
                    <CachedImage 
                      source={{ uri: stepPhotos[1].image_url }} 
                      style={styles.gridPhotoSmall} 
                      resizeMode="cover"
                    />
                    <View style={styles.gridPhotoSmallContainer}>
                      <CachedImage 
                        source={{ uri: stepPhotos[2].image_url }} 
                        style={styles.gridPhotoSmall} 
                        resizeMode="cover"
                      />
                      {stepPhotos.length > 3 && (
                        <View style={styles.morePhotosOverlay}>
                          <Text style={styles.morePhotosText}>+{stepPhotos.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>Tap to view all {stepPhotos.length} photos</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* No Photos State */}
        {stepPhotos.length === 0 && !stepImageUrl && (
          <View style={styles.noPhotosContainer}>
            <Text style={styles.noPhotosText}>📷 No photos uploaded yet</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#A5D6A7" />
        <Text style={styles.loadingText}>Loading treatment steps...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugText}>Patient: {patientName} (ID: {patientId})</Text>
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
          {patientName} doesn't have any treatment steps assigned yet.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSteps()}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{patientName}'s Treatment</Text>
        <Text style={styles.headerSubtitle}>{steps.length} treatment steps</Text>
      </View>
      
      <FlatList
        style={styles.list}
        contentContainerStyle={{ padding: 12 }}
        data={steps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeGallery}
      >
        <View style={styles.galleryModal}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeGallery}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.photoCounter}>
              {selectedPhotos.length > 0 ? `${selectedPhotoIndex + 1} of ${selectedPhotos.length}` : ''}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setSelectedPhotoIndex(index);
            }}
            contentOffset={{ x: selectedPhotoIndex * Dimensions.get('window').width, y: 0 }}
          >
            {selectedPhotos.map((photo, index) => (
              <View key={photo.id || index} style={styles.galleryPhotoContainer}>
                <Image
                  source={{ uri: photo.image_url }}
                  style={styles.galleryPhoto}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  list: { 
    backgroundColor: '#f6f7fb', 
    flex: 1 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepInfo: {
    flex: 1,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111',
    marginBottom: 8,
  },
  desc: { 
    color: '#555', 
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  metaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  
  // Step Reference Image
  stepImageContainer: {
    marginBottom: 16,
  },
  stepImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  
  // Photos Section
  photosSection: {
    marginTop: 4,
  },
  
  // Single Photo Layout
  singlePhotoContainer: {
    position: 'relative',
  },
  singlePhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  
  // Two Photos Layout
  twoPhotosContainer: {
    position: 'relative',
    flexDirection: 'row',
    gap: 8,
  },
  halfPhoto: {
    flex: 1,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  
  // Multiple Photos Grid Layout
  multiplePhotosContainer: {
    position: 'relative',
  },
  photoGrid: {
    flexDirection: 'row',
    height: 160,
    gap: 8,
  },
  gridPhotoLarge: {
    flex: 2,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  gridRight: {
    flex: 1,
    gap: 8,
  },
  gridPhotoSmall: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  gridPhotoSmallContainer: {
    position: 'relative',
    flex: 1,
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Photo Overlay
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // No Photos State
  noPhotosContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noPhotosText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Center states
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    color: '#666', 
    marginBottom: 16, 
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: { 
    backgroundColor: '#A5D6A7', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  retryText: { 
    color: '#2C3E50', 
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: { 
    color: '#d32f2f', 
    marginBottom: 12, 
    textAlign: 'center',
    fontSize: 16,
  },
  debugText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  galleryHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 1000,
  },
  headerSpacer: {
    width: 30,
  },
  photoCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  galleryScrollView: {
    flex: 1,
  },
  galleryPhotoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryPhoto: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
});
