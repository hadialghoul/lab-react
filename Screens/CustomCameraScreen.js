import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Svg, Defs, Mask, Rect, Ellipse } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

export default function CustomCameraScreen({ navigation, route }) {
  const { onPhotoTaken } = route.params || {};
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need camera permission</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      try {
        setProcessing(true);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        
        console.log('📷 Photo taken:', photo.uri);
        console.log('📐 Processing oval crop...');
        
        // Calculate oval dimensions (matching the UI overlay)
        const ovalWidth = width * 0.7; // 70% of screen width (0.35 * 2)
        const ovalHeight = height * 0.56; // 56% of screen height (0.28 * 2)
        
        // Calculate center position
        const centerX = photo.width / 2;
        const centerY = (photo.height / 2) - (photo.height * 0.1); // Slightly higher
        
        // Calculate crop rectangle that contains the oval
        const cropWidth = (photo.width / width) * ovalWidth;
        const cropHeight = (photo.height / height) * ovalHeight;
        
        const originX = Math.max(0, centerX - (cropWidth / 2));
        const originY = Math.max(0, centerY - (cropHeight / 2));
        
        // Crop the image to the oval area and compress
        const croppedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: originX,
                originY: originY,
                width: Math.min(cropWidth, photo.width),
                height: Math.min(cropHeight, photo.height),
              },
            },
            // Resize to smaller size for faster upload
            { resize: { width: 600 } },
          ],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        console.log('✅ Photo cropped to oval area:', croppedPhoto.uri);
        
        // Return the cropped photo to the previous screen
        if (onPhotoTaken) {
          onPhotoTaken(croppedPhoto);
        }
        
        setProcessing(false);
        navigation.goBack();
      } catch (error) {
        console.log('❌ Camera error:', error);
        setProcessing(false);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        flash={flash}
        ref={cameraRef}
      >
        {/* Dark overlay with transparent oval cutout */}
        <Svg height={height} width={width} style={styles.overlayContainer}>
          <Defs>
            <Mask id="mask" x="0" y="0" height="100%" width="100%">
              <Rect height="100%" width="100%" fill="#fff" />
              {/* Oval cutout - transparent area to see camera */}
              <Ellipse
                cx={width / 2}
                cy={height / 2 - 50}
                rx={width * 0.35}
                ry={height * 0.28}
                fill="black"
              />
            </Mask>
          </Defs>
          {/* Dark overlay everywhere except oval */}
          <Rect
            height="100%"
            width="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#mask)"
          />
          {/* Teal oval border guide */}
          <Ellipse
            cx={width / 2}
            cy={height / 2 - 50}
            rx={width * 0.35}
            ry={height * 0.28}
            stroke="#A5D6A7"
            strokeWidth="4"
            fill="none"
          />
        </Svg>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Position your face and teeth within the oval
          </Text>
        </View>

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
            <Text style={styles.controlText}>✕</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Text style={styles.controlText}>
              {flash === 'on' ? '⚡' : '⚡OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.placeholder} />
          
          {/* Capture Button */}
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Flip Camera Button */}
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Overlay */}
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#A5D6A7" />
            <Text style={styles.processingText}>Processing photo...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 5,
  },
  placeholder: {
    width: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipText: {
    fontSize: 28,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#A5D6A7',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
});

