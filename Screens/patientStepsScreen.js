import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
// small helper to avoid hanging requests
const fetchWithTimeout = (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);
};

// token storage keys fallback (align with other screens)
const ACCESS_KEYS = ['access', 'access_token', 'token'];
const REFRESH_KEYS = ['refresh', 'refresh_token'];
// get the first non-empty value from a list of keys
const getFirstStored = async (keys) => {
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v) return v;
  }
  return null;
};

export default function PatientStepsScreen() {
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

  // fetch with Authorization and auto-refresh on 401 (retry once)
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

    // try refresh if we have a refresh token
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
            // retry original
            res = await fetchWithTimeout(url, { ...options, headers }, REQUEST_TIMEOUT_MS);
            return res;
          }
        }
      } catch (e) {
        // ignore; will fall through to logout
      }
    }
    // clear tokens but stay on page
    await AsyncStorage.removeItem('access');
    await AsyncStorage.removeItem('refresh');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    // Don't navigate away - just show message
    return res;
  }, [navigation]);

  const fetchSteps = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getFirstStored(ACCESS_KEYS);
      if (!token) {
        setError('No treatment found. Please contact the lab.');
        setSteps([]);
        setLoading(false);
        return;
      }

      // validate patientId
      const pid = String(patientId ?? '').trim();
      if (!/^\d+$/.test(pid)) {
        setError('Invalid or missing patient id');
        setSteps([]);
        setLoading(false);
        console.warn('patientSteps: invalid patientId', patientId);
        return;
      }

      const headers = { Accept: 'application/json' };
      console.log('Fetching treatment steps for patientId:', pid);

      // helper: try to fetch steps by treatment id
      const fetchStepsByTreatmentId = async (treatmentId) => {
        if (!treatmentId) return null;
        const byTid = [
          `${BASE_URL}/accounts/doctor/treatments/${treatmentId}/steps/`,
          `${BASE_URL}/accounts/treatments/${treatmentId}/steps/`,
          `${BASE_URL}/accounts/treatments/${treatmentId}/treatment-steps/`,
          `${BASE_URL}/accounts/patient-treatment/${treatmentId}/steps/`,
          `${BASE_URL}/accounts/patient-treatments/${treatmentId}/steps/`,
          `${BASE_URL}/accounts/patient-treatments/${treatmentId}/`,
        ];
        for (const u of byTid) {
          const r = await fetchWithAuth(u, { headers });
          const txt = await r.text().catch(() => '');
          let j = null; try { j = txt ? JSON.parse(txt) : null; } catch {}
          console.log('TRY (by treatment id)', u, 'status', r.status, 'body', txt);
          if (!r.ok || !j) continue;
          if (Array.isArray(j)) return j;
          if (Array.isArray(j.steps)) return j.steps;
          if (Array.isArray(j.treatment_steps)) return j.treatment_steps;
          if (Array.isArray(j.results)) return j.results;
          if (Array.isArray(j.data)) return j.data;
        }
        return null;
      };

      async function tryUrl(url) {
        try {
          const r = await fetchWithAuth(url, { headers });
          const text = await r.text().catch(() => '');
          let json = null;
          try { json = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
          console.log('TRY', url, 'status', r.status, 'body', text);
          return { status: r.status, json, text, url };
        } catch (e) {
          console.warn('fetch error', url, e);
          return { status: 0, error: e, url };
        }
      }

      // candidate URLs — most likely first (updated to match backend URLs)
      const candidates = [
        `${BASE_URL}/accounts/patients/${pid}/treatment-steps/`,
        `${BASE_URL}/accounts/patients/${pid}/treatment-steps`,
        `${BASE_URL}/accounts/doctor/patients/${pid}/`,
        `${BASE_URL}/accounts/doctor/patients/${pid}/treatment/`,
        `${BASE_URL}/accounts/patients/`,
      ];

      console.log('patientSteps candidate urls (first):', candidates[0]);

      let foundSteps = null;
      let lastResult = null;

      for (const url of candidates) {
        const res = await tryUrl(url);
        lastResult = res;

        if (res.status === 401) {
          await AsyncStorage.removeItem('access');
          await AsyncStorage.removeItem('refresh');
          setError('No treatment found. Please contact the lab.');
          setSteps([]);
          setLoading(false);
          return;
        }

        if (res.status !== 200 || !res.json) continue;

        const j = res.json;

        // arrays or common containers
        if (Array.isArray(j)) { foundSteps = j; break; }
        const fieldCandidates = [
          'steps', 'treatment_steps', 'results', 'data', 'steps_set', 'treatmentstep_set',
          'treatment_steps_set', 'treatmentstep_set', 'treatmentstep_set'
        ];
        for (const f of fieldCandidates) {
          if (Array.isArray(j[f])) { foundSteps = j[f]; break; }
        }
        if (foundSteps) break;

        // sometimes the treatment object is returned; try to extract or follow
        if (j.treatment) {
          const t = j.treatment;
          if (Array.isArray(t.steps)) { foundSteps = t.steps; break; }
          if (Array.isArray(t.treatment_steps)) { foundSteps = t.treatment_steps; break; }
          if (t.steps_url) {
            const follow = await tryUrl(t.steps_url);
            if (follow.status === 200 && Array.isArray(follow.json)) { foundSteps = follow.json; break; }
          }
          if (t.id) {
            const followed = await fetchStepsByTreatmentId(t.id);
            if (followed && followed.length) { foundSteps = followed; break; }
          }
        }

        // single step object — normalize
        if (j.duration_days && (j.name || j.description)) {
          foundSteps = [j];
          break;
        }

        // treatment object at root — follow with id
        if (j.id && !Array.isArray(j)) {
          const followed = await fetchStepsByTreatmentId(j.id);
          if (followed && followed.length) { foundSteps = followed; break; }
        }
      }

      if (foundSteps && foundSteps.length > 0) {
        // Log first step to see the data structure
        console.log('Found steps:', foundSteps.length);
        console.log('First step structure:', JSON.stringify(foundSteps[0], null, 2));
        
        // Process steps to fix image URLs
        const processedSteps = foundSteps.map(step => {
          console.log('🔍 Processing step:', step.name || step.id);
          
          // Fix main step image URL
          if (step.image && !step.image.startsWith('http')) {
            step.image_url = `${BASE_URL}${step.image}`;
            console.log('🖼️ Fixed step image URL:', step.image_url);
          } else if (step.image && step.image.startsWith('http')) {
            step.image_url = step.image;
          }
          
          // Fix photo URLs if they exist
          if (step.photos && Array.isArray(step.photos)) {
            step.photos = step.photos.map(photo => {
              if (photo.image && !photo.image.startsWith('http')) {
                photo.image_url = `${BASE_URL}${photo.image}`;
                console.log('📸 Fixed photo URL:', photo.image_url);
              } else if (photo.image && photo.image.startsWith('http')) {
                photo.image_url = photo.image;
              }
              return photo;
            });
          }
          
          return step;
        });
        
        console.log('✅ Processed steps with fixed URLs');
        setSteps(processedSteps);
        setError(null);
      } else {
        const statusInfo = lastResult ? `Last tried ${lastResult.url} => status ${lastResult.status}` : 'No requests attempted';
        const bodyInfo = lastResult && lastResult.text ? ` Response body: ${lastResult.text.slice(0, 1000)}` : '';
        setSteps([]);
        setError(`No treatment steps found. ${statusInfo}.${bodyInfo}`);
        console.warn('No steps found; debug:', statusInfo, bodyInfo);
      }
    } catch (err) {
      console.warn('Fetch steps error', err);
      setError('Network error while fetching steps.');
    } finally {
      setLoading(false);
    }
  }, [patientId, navigation, fetchWithAuth]);

  // Always refresh steps when screen is focused (e.g., after returning from patientPhotos)
  useFocusEffect(
    useCallback(() => {
      if (!patientId) {
        setError('Missing patient id');
        setLoading(false);
        return;
      }
      navigation.setOptions({ title: patientName ? `${patientName} — Steps` : 'Patient Steps' });
      fetchSteps();
    }, [patientId, patientName, fetchSteps, navigation])
  );

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
    
    // Log image URLs for debugging
    console.log('📸 Opening gallery with photos:', stepPhotos.length);
    console.log('📸 First photo URL:', stepPhotos[0]?.image_url);
    
    // Check if URLs are valid
    const hasValidUrls = stepPhotos.every(photo => 
      photo.image_url && (photo.image_url.startsWith('http://') || photo.image_url.startsWith('https://'))
    );
    
    if (!hasValidUrls) {
      console.log('❌ Invalid image URLs detected!');
      Alert.alert('Error', 'Some image URLs are invalid. Please contact support.');
      return;
    }
    
    // Show gallery immediately with loading placeholders
    setSelectedPhotos(stepPhotos);
    setSelectedPhotoIndex(0);
    setGalleryVisible(true);
    
    // Prefetch first 3 images in background (don't wait)
    stepPhotos.slice(0, 3).forEach((photo, index) => {
      const startTime = Date.now();
      Image.prefetch(photo.image_url)
        .then(() => {
          const loadTime = Date.now() - startTime;
          console.log(`✅ Image ${index + 1} prefetched in ${loadTime}ms`);
        })
        .catch(() => console.log(`❌ Image ${index + 1} prefetch failed`));
    });
  };

  // Close gallery
  const closeGallery = () => {
    setGalleryVisible(false);
    setSelectedPhotos([]);
    setSelectedPhotoIndex(0);
  };

  // Navigation function for patient photos
  const navigateToPatientPhotos = (step) => {
    navigation.navigate('patient-photos', {
      stepId: step.id,
      stepName: step.name,
      patientId: patientId,
      patientName: patientName,
    });
  };

  const renderItem = ({ item }) => {
    const stepPhotos = item.photos || [];
    const stepImageUrl = item.image_url;

    return (
      <View style={styles.card}>
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>Step {item.id || 1}</Text>
          </View>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.desc}>
            {item.description || 'No description available'}
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

        {/* Step Reference Image (if exists) */}
        {stepImageUrl && (
          <View style={styles.stepImageContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Step Reference</Text>
            </View>
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: stepImageUrl }} 
                style={styles.stepImage} 
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Step image load error:', stepImageUrl);
                  console.log('❌ Error details:', error.nativeEvent.error);
                }}
                onLoad={() => {
                  console.log('✅ Step image loaded successfully:', stepImageUrl);
                }}
              />
            </View>
          </View>
        )}

        {/* Patient Photos Gallery */}
        {stepPhotos.length > 0 ? (
          <View style={styles.photosSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📸 Patient Progress Photos</Text>
              <Text style={styles.photoCounter}>{stepPhotos.length} photo{stepPhotos.length !== 1 ? 's' : ''}</Text>
            </View>
            
            {stepPhotos.length === 1 ? (
              // Single photo - show large with details
              <TouchableOpacity 
                style={styles.singlePhotoContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.95}
              >
                <View style={styles.photoFrame}>
                  <CachedImage 
                    source={{ uri: stepPhotos[0].image_url }} 
                    style={styles.singlePhoto} 
                    resizeMode="cover"
                  />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoLabel}>Progress Photo</Text>
                    <Text style={styles.photoAction}>Tap to view full size</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : stepPhotos.length === 2 ? (
              // Two photos - elegant side by side
              <TouchableOpacity 
                style={styles.twoPhotosContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.95}
              >
                <View style={styles.photoFrame}>
                  <CachedImage 
                    source={{ uri: stepPhotos[0].image_url }} 
                    style={styles.halfPhoto} 
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.photoFrameLast}>
                  <CachedImage 
                    source={{ uri: stepPhotos[1].image_url }} 
                    style={styles.halfPhoto} 
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryAction}>Tap to view gallery</Text>
                </View>
              </TouchableOpacity>
            ) : (
              // Multiple photos - professional grid
              <TouchableOpacity 
                style={styles.multiplePhotosContainer}
                onPress={() => openStepPhotos(item)}
                activeOpacity={0.95}
              >
                <View style={styles.photoGrid}>
                  <View style={styles.mainPhotoFrame}>
                    <CachedImage 
                      source={{ uri: stepPhotos[0].image_url }} 
                      style={styles.gridPhotoLarge} 
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.gridRight}>
                    <View style={styles.smallPhotoFrame}>
                      <CachedImage 
                        source={{ uri: stepPhotos[1].image_url }} 
                        style={styles.gridPhotoSmall} 
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.smallPhotoFrame}>
                      
                        <CachedImage 
                          source={{ uri: stepPhotos[2].image_url }} 
                          style={styles.gridPhotoSmall} 
                          resizeMode="cover"
                        />
                        {stepPhotos.length > 3 && (
                          <View style={styles.morePhotosOverlay}>
                            <Text style={styles.morePhotosCount}>+{stepPhotos.length - 3}</Text>
                            <Text style={styles.morePhotosLabel}>more</Text>
                          </View>
                        )}
                      
                    </View>
                  </View>
                </View>
                <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryAction}>View all {stepPhotos.length} photos</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // No photos state - encouraging upload
          <View style={styles.noPhotosSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📸 Patient Progress Photos</Text>
            </View>
            <View style={styles.noPhotosContainer}>
              <Text style={styles.noPhotosIcon}>📷</Text>
              <Text style={styles.noPhotosTitle}>No photos yet</Text>
              <Text style={styles.noPhotosText}>Photos will appear here when uploaded by the patient</Text>
            </View>
          </View>
        )}

        {/* View Patient Photos Button */}
        <TouchableOpacity 
          style={styles.patientPhotosButton} 
          onPress={() => navigateToPatientPhotos(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>📱</Text>
          <Text style={styles.buttonText}>Add Your Photos</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSteps()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!steps.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No treatment steps</Text>
        <Text style={styles.emptySubtitle}>This patient has no treatment steps yet.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSteps()}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={{ padding: 12 }}
        data={steps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
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
            <Text style={styles.galleryTitle}>
              {selectedPhotos.length > 0 ? `${selectedPhotoIndex + 1} of ${selectedPhotos.length}` : ''}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <FlatList
            data={selectedPhotos}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedPhotoIndex}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setSelectedPhotoIndex(index);
            }}
            renderItem={({ item: photo, index }) => (
              <View style={styles.galleryImageContainer}>
                <CachedImage
                  source={{ uri: photo.image_url }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              </View>
            )}
            windowSize={3}
            maxToRenderPerBatch={2}
            removeClippedSubviews={true}
            initialNumToRender={1}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { 
    backgroundColor: '#f6f7fb', 
    flex: 1 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 20, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  
  // Step Header
  stepHeader: {
    marginBottom: 20,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F9F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5DCCBB',
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#111',
    marginBottom: 8,
    lineHeight: 28,
  },
  desc: { 
    color: '#555', 
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    color: '#111',
    fontWeight: '600',
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  photoCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Step Reference Image
  stepImageContainer: {
    marginBottom: 24,
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  
  // Photos Section
  photosSection: {
    marginTop: 8,
  },

  photoFrameLast: {
  borderRadius: 16,
  overflow: 'hidden',
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  marginRight: 0,
},
  
  // Photo Frames
  photoFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  mainPhotoFrame: {
    borderRadius: 16,
    marginRight: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  smallPhotoFrame: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  // Single Photo Layout
  singlePhotoContainer: {
    position: 'relative',
  },
  singlePhoto: {
    width: '100%',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
  },
  photoLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  photoAction: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  
  // Two Photos Layout
  twoPhotosContainer: {
    position: 'relative',
    flexDirection: 'row',
   
  },
  halfPhoto: {
    flex: 1,
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  
  // Multiple Photos Grid Layout
  multiplePhotosContainer: {
    position: 'relative',
  },
  photoGrid: {
    flexDirection: 'row',
    height: 180,
    gap: 12,
  },
  gridPhotoLarge: {
    flex: 2,
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  gridRight: {
    flex: 1,
    gap: 12,
  },
  gridPhotoSmall: {
    width: '100%',
    flex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  morePhotosLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  
  // Gallery Overlay
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  galleryAction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // No Photos State
  noPhotosSection: {
    marginTop: 8,
  },
  noPhotosContainer: {
    backgroundColor: '#f8f9fa',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noPhotosIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  noPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noPhotosText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Center states and other existing styles
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
    backgroundColor: '#5DCCBB', 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  retryText: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  errorText: { 
    color: '#000', 
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12, 
    textAlign: 'center' 
  },
  
  // Patient Photos Button
  patientPhotosButton: {
    marginTop: 16,
    backgroundColor: '#5DCCBB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonArrow: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Gallery Modal Styles
  galleryModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  galleryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44, // Same width as close button for centering
  },
  galleryImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});

