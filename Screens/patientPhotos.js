import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import Config from '../config';
import CachedImage from '../components/CachedImage';
import Colors from '../theme/colors';

const BASE_URL = Config.BASE_URL; // Dynamic URL based on environment

export default function PatientPhotos() {
  const route = useRoute();
  const navigation = useNavigation();
  const { stepId, stepName, patientId, patientName } = route.params || {};

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [localPhotos, setLocalPhotos] = useState([]); // For immediate display
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
  fetchStepPhotos();
  }, []);

  // Fetch existing photos for this step
  const fetchStepPhotos = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access');
      if (!accessToken) {
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        return;
      }

      // console.log('🔍 Fetching photos for step:', stepId);
      // console.log('🌐 Using URL:', `${BASE_URL}/accounts/steps/${stepId}/photos/`);

      const response = await fetch(`${BASE_URL}/accounts/steps/${stepId}/photos/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Session expired, clear tokens but stay on page
        await AsyncStorage.removeItem('access');
        await AsyncStorage.removeItem('refresh');
        await AsyncStorage.removeItem('token');
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // console.log('📸 Photos API response:', data);
        // Filter photos to only those with the correct step_id (defensive, in case backend ever returns more)
        const filtered = data.filter(photo => String(photo.step_id) === String(stepId));
        // Process photos to ensure proper image URLs
        const processedPhotos = filtered.map(photo => {
          // console.log('📸 Processing photo:', photo);
          // Determine the correct image URL
          let imageUrl = '';
          if (photo.image_url) {
            imageUrl = photo.image_url;
          } else if (photo.image) {
            imageUrl = photo.image.startsWith('http') 
              ? photo.image 
              : `${BASE_URL}${photo.image}`;
          } else {
            // console.log('❌ No image URL found for photo:', photo);
            return null;
          }
          // console.log('🖼️ Final image URL:', imageUrl);
          // console.log('🔍 Testing URL accessibility:', imageUrl);
          // console.log('🌐 BASE_URL used:', BASE_URL);
          // console.log('📱 Environment:', __DEV__ ? 'development' : 'production');
          return {
            ...photo,
            image_url: imageUrl
          };
        }).filter(photo => photo !== null); // Remove photos without valid URLs
        // console.log('✅ Processed photos:', processedPhotos);
        setPhotos(processedPhotos);
      } else {
        console.log('❌ Failed to fetch photos, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.log('❌ Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Request only camera permission. Gallery selection uses the system picker.
  const requestCameraPermission = async () => {
    try {
      console.log('🔐 Requesting camera permission...');

      const currentCameraStatus = await ImagePicker.getCameraPermissionsAsync();
      console.log('📷 Current camera permission:', currentCameraStatus);

      let cameraPermission = currentCameraStatus;

      if (currentCameraStatus.status !== 'granted') {
        cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📷 Camera permission request result:', cameraPermission);
      }

      // Handle iOS-specific permission issues
      if (Platform.OS === 'ios') {
        if (cameraPermission.status === 'restricted') {
          Alert.alert(
            'Permission Restricted',
            'Camera access is restricted on this device. Please check your device restrictions in Settings > Screen Time > Content & Privacy Restrictions.',
            [
              { text: 'OK' },
              { text: 'Open Settings', onPress: () => Linking.openURL('app-settings:') }
            ]
          );
          return false;
        }

        if (cameraPermission.status === 'undetermined') {
          console.log('⚠️ Permission status undetermined, retrying...');
          await new Promise(resolve => setTimeout(resolve, 500));

          cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        }
      }

      if (cameraPermission.status === 'denied') {
        Alert.alert(
          'Camera Permission Required',
          'Camera permission is required to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          ]
        );
      }

      return cameraPermission.status === 'granted';
    } catch (error) {
      console.log('❌ Permission request error:', error);
      Alert.alert('Permission Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  // Show photo options with better descriptions
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Treatment Progress Photos',
      'Choose how you want to add photos to document your treatment progress:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📷 Take New Photo', 
          onPress: takePhoto,
          style: 'default'
        },
        { 
          text: '🖼️ Choose 1 Photo from Gallery', 
          onPress: pickFromGallery,
          style: 'default'
        },
        { 
          text: '📱 Choose Multiple Photos', 
          onPress: pickMultipleFromGallery,
          style: 'default'
        },
      ]
    );
  };

  // Take photo with camera
  const takePhoto = async () => {
    console.log('📷 Taking photo...');

    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) {
      console.log('❌ Camera permission denied');
      Alert.alert('Permission Denied', 'Camera permission is required to take photos. Please enable it in your device settings.');
      return;
    }

    try {
      console.log('📷 Launching custom camera with oval guide...');
      
      // Navigate to custom camera screen
      navigation.navigate('custom-camera', {
        onPhotoTaken: (photo) => {
          console.log('✅ Photo taken successfully');
          console.log('📷 Photo URI:', photo.uri);
          
          // Add to local photos immediately for instant display
          const localPhoto = {
            id: `local_${Date.now()}`,
            uri: photo.uri,
            isLocal: true,
            uploading: true,
          };
          setLocalPhotos(prev => [localPhoto, ...prev]);
          
          // Upload photo with proper format
          const asset = {
            uri: photo.uri,
          };
          uploadPhoto(asset, localPhoto.id);
        },
      });
    } catch (error) {
      console.log('❌ Camera error:', error);
      
      // More specific error handling for iOS TestFlight
      let errorMessage = 'Failed to open camera. Please make sure camera permissions are enabled and try again.';
      if (Platform.OS === 'ios' && error.message?.includes('camera')) {
        errorMessage = 'Camera access failed. This might be due to device restrictions or TestFlight limitations. Please check your device settings.';
      }
      
      Alert.alert(
        'Camera Error', 
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Check Permissions', onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        ]
      );
    }
  };

  // Pick single photo from gallery
  const pickFromGallery = async () => {
    console.log('🖼️ Picking from gallery...');

    try {
      console.log('🖼️ Launching image library...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6, // Lower quality for faster upload
        exif: false, // Reduces file size
      });

      console.log('🖼️ Gallery result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo selected successfully');
        console.log('🖼️ Photo URI:', result.assets[0].uri);
        
        // Add to local photos immediately for instant display
        const localPhoto = {
          id: `local_${Date.now()}`,
          uri: result.assets[0].uri,
          isLocal: true,
          uploading: true,
        };
        setLocalPhotos(prev => [localPhoto, ...prev]);
        
        uploadPhoto(result.assets[0], localPhoto.id);
      } else {
        console.log('🖼️ Photo selection cancelled');
      }
    } catch (error) {
      console.log('❌ Gallery error:', error);
      
      // More specific error handling for iOS TestFlight
      let errorMessage = 'Failed to open photo gallery. Please make sure photo library permissions are enabled and try again.';
      if (Platform.OS === 'ios' && error.message?.includes('library')) {
        errorMessage = 'Photo library access failed. This might be due to device restrictions or TestFlight limitations. Please check your device settings.';
      }
      
      Alert.alert(
        'Gallery Error', 
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Check Permissions', onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        ]
      );
    }
  };

  // Pick multiple photos from gallery
  const pickMultipleFromGallery = async () => {
    console.log('🖼️ Picking multiple photos from gallery...');

    try {
      console.log('🖼️ Launching image library for multiple selection...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.6, // Lower quality for faster upload
        exif: false, // Reduces file size
      });

      console.log('🖼️ Multiple gallery result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`✅ ${result.assets.length} photos selected successfully`);
        
        // Add all selected photos to local display immediately
        const newLocalPhotos = result.assets.map((asset, index) => {
          console.log(`🖼️ Photo ${index + 1} URI:`, asset.uri);
          return {
            id: `local_${Date.now()}_${index}`,
            uri: asset.uri,
            isLocal: true,
            uploading: true,
          };
        });
        setLocalPhotos(prev => [...newLocalPhotos, ...prev]);
        
        // Upload multiple photos
        result.assets.forEach((asset, index) => {
          uploadPhoto(asset, newLocalPhotos[index].id);
        });
      } else {
        console.log('🖼️ Multiple photo selection cancelled');
      }
    } catch (error) {
      console.log('❌ Multiple gallery error:', error);
      
      // More specific error handling for iOS TestFlight
      let errorMessage = 'Failed to select multiple photos. Please make sure photo library permissions are enabled and try again.';
      if (Platform.OS === 'ios' && error.message?.includes('library')) {
        errorMessage = 'Photo library access failed. This might be due to device restrictions or TestFlight limitations. Please check your device settings.';
      }
      
      Alert.alert(
        'Gallery Error', 
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Check Permissions', onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }}
        ]
      );
    }
  };

  // Upload photo to backend (async, non-blocking)
  const uploadPhoto = async (asset, localPhotoId = null) => {
    // Don't block the UI - upload happens in background
    try {
      const accessToken = await AsyncStorage.getItem('access');
      if (!accessToken) {
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        // Remove local photo if upload fails
        if (localPhotoId) {
          setLocalPhotos(prev => prev.filter(p => p.id !== localPhotoId));
        }
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      });
      formData.append('step_id', stepId.toString());

      console.log('📤 Starting background upload...');
      
      const response = await fetch(`${BASE_URL}/accounts/steps/${stepId}/photos/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.status === 401) {
        // Session expired, clear tokens but stay on page
        await AsyncStorage.removeItem('access');
        await AsyncStorage.removeItem('refresh');
        await AsyncStorage.removeItem('token');
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        // Remove local photo if upload fails
        if (localPhotoId) {
          setLocalPhotos(prev => prev.filter(p => p.id !== localPhotoId));
        }
        return;
      }

      if (response.ok) {
        const newPhoto = await response.json();
        
        console.log('✅ Photo uploaded successfully');
        
        // Add to server photos and remove from local photos
        setPhotos(prev => [newPhoto, ...prev]);
        if (localPhotoId) {
          setLocalPhotos(prev => prev.filter(p => p.id !== localPhotoId));
        }
      } else {
        const errorData = await response.text();
        console.log('❌ Upload error:', errorData);
        
        // Keep local photo visible even if upload fails
        // Update to show error state
        if (localPhotoId) {
          setLocalPhotos(prev => prev.map(p => 
            p.id === localPhotoId 
              ? { ...p, uploading: false, error: true } 
              : p
          ));
        }
        
        Alert.alert('Upload Failed', 'Photo saved locally but failed to upload. Please try again later.');
      }
    } catch (error) {
      console.log('❌ Upload error:', error);
      
      // Keep local photo visible with error state
      if (localPhotoId) {
        setLocalPhotos(prev => prev.map(p => 
          p.id === localPhotoId 
            ? { ...p, uploading: false, error: true } 
            : p
        ));
      }
      
      Alert.alert('Upload Failed', 'Photo saved locally but failed to upload. Please check your connection.');
    }
  };

  // Delete photo
  const deletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeletePhoto(photoId) },
      ]
    );
  };

  const confirmDeletePhoto = async (photoId) => {
    try {
      const accessToken = await AsyncStorage.getItem('access');
      if (!accessToken) {
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        return;
      }

      const response = await fetch(`${BASE_URL}/accounts/photos/${photoId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('access');
        await AsyncStorage.removeItem('refresh');
        await AsyncStorage.removeItem('token');
        Alert.alert('Error', 'No treatment found. Please contact the lab.');
        return;
      }

      if (response.ok) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId));
        Alert.alert('Success', 'Photo deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete photo');
      }
    } catch (error) {
      console.log('Delete error:', error);
      Alert.alert('Error', 'Network error during deletion');
    }
  };

  // Open gallery view
  const openGallery = (index = 0) => {
    const serverPhotos = photos.filter(photo => !photo.isLocal);
    if (serverPhotos.length === 0) {
      Alert.alert('No Photos', 'No photos available to view');
      return;
    }
    setSelectedPhotoIndex(index);
    setGalleryVisible(true);
  };

  // Close gallery
  const closeGallery = () => {
    setGalleryVisible(false);
  };

  // Render photo item (memoized for performance)
  const renderPhoto = React.useCallback(({ item, index }) => {
    return (
      <TouchableOpacity 
        style={styles.photoContainer}
        onPress={() => !item.isLocal && openGallery(index)}
        activeOpacity={item.isLocal ? 1 : 0.8}
      >
        {item.isLocal ? (
          // Local photos: show directly without caching
          <Image 
            source={{ uri: item.uri }} 
            style={styles.photo}
            resizeMode="cover"
            fadeDuration={100}
          />
        ) : (
          // Server photos: use persistent cache
          <CachedImage 
            source={{ uri: item.image_url }} 
            style={styles.photo}
            resizeMode="cover"
          />
        )}
        
        {/* Upload indicator for local photos */}
        {item.isLocal && item.uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
        
        {/* Error indicator for failed uploads */}
        {item.isLocal && item.error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Upload Failed</Text>
          </View>
        )}
        
        {/* Gallery indicator for uploaded photos */}
        {!item.isLocal && (
          <View style={styles.galleryIndicator}>
            <Text style={styles.galleryIcon}>🔍</Text>
          </View>
        )}
        
        {/* Delete button only for uploaded photos */}
        {!item.isLocal && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePhoto(item.id)}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [openGallery, deletePhoto]);

  // Combine local and server photos for display
  const allPhotos = [...localPhotos, ...photos];

  return (
    <View style={styles.container}>
      {/* Subtitle and patient name below nav bar */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>Treatment Step Photos</Text>
        <Text style={styles.patientName}>Patient: {patientName}</Text>
      </View>

      {/* Add Photo Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={showPhotoOptions}
      >
        <Text style={styles.addButtonIcon}>📷</Text>
        <Text style={styles.addButtonText}>Add Photos to This Step</Text>
        {localPhotos.length > 0 && (
          <Text style={styles.addButtonSubtext}>
            {localPhotos.length} uploading...
          </Text>
        )}
      </TouchableOpacity>

      {/* Photos Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      ) : (
        <FlatList
          data={allPhotos}
          renderItem={({ item, index }) => renderPhoto({ item, index })}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photosList}
          removeClippedSubviews={true} // Performance optimization
          maxToRenderPerBatch={10} // Render 10 items at a time
          updateCellsBatchingPeriod={50} // Update every 50ms
          initialNumToRender={6} // Render 6 items initially (3 rows)
          windowSize={5} // Render items within 5 screens
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyText}>
                Tap "Add Photos" to capture your treatment progress
              </Text>
            </View>
          }
        />
      )}

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
              {selectedPhotoIndex + 1} of {photos.filter(p => !p.isLocal).length}
            </Text>
            <TouchableOpacity 
              style={styles.deleteButtonHeader} 
              onPress={() => {
                const serverPhotos = photos.filter(p => !p.isLocal);
                if (serverPhotos[selectedPhotoIndex]) {
                  deletePhoto(serverPhotos[selectedPhotoIndex].id);
                  closeGallery();
                }
              }}
            >
              <Text style={styles.deleteButtonHeaderText}>🗑️</Text>
            </TouchableOpacity>
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
            {photos.filter(photo => !photo.isLocal).map((photo, index) => (
              <View key={photo.id} style={styles.galleryImageContainer}>
                <CachedImage
                  source={{ uri: photo.image_url }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#999',
  },
  addButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  photosList: {
    padding: 16,
  },
  photoContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  galleryIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  galleryIcon: {
    fontSize: 12,
    color: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
  deleteButtonHeader: {
    padding: 10,
  },
  deleteButtonHeaderText: {
    fontSize: 20,
  },
  galleryImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});