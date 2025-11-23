import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

export default function QRScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    
    console.log('🔍 QR Code scanned:');
    console.log('   Type:', type);
    console.log('   Data:', data);
    console.log('   Data length:', data.length);
    console.log('   Data type:', typeof data);
    
    // Show raw data first for debugging
    Alert.alert(
      'QR Code Detected',
      `Type: ${type}\nData: ${data}\nLength: ${data.length}`,
      [
        { text: 'Cancel', onPress: () => resetScanner() },
        { text: 'Process', onPress: () => processQRData(data) }
      ]
    );
    
    setLoading(false);
  };

  const processQRData = (data) => {
    try {
      // Try to parse the QR code data
      let parsedData;
      
      // Check if it's JSON data
      try {
        parsedData = JSON.parse(data);
        console.log('📱 Parsed JSON data:', parsedData);
      } catch (jsonError) {
        // If not JSON, treat as plain text
        parsedData = { data: data };
        console.log('📱 Plain text data:', data);
      }
      
      // Handle different types of QR codes
      if (parsedData.patientId || parsedData.patient_id) {
        // Patient QR code
        const patientId = parsedData.patientId || parsedData.patient_id;
        console.log('👤 Patient QR code detected, ID:', patientId);
        
        Alert.alert(
          'Patient Found',
          `Patient ID: ${patientId}`,
          [
            { text: 'Cancel', onPress: () => resetScanner() },
            { 
              text: 'View Patient', 
              onPress: () => {
                // Navigate to patient details or treatment screen
                navigation.navigate('patient-stage', { patientId });
              }
            }
          ]
        );
      } else if (parsedData.stepId || parsedData.step_id) {
        // Treatment step QR code
        const stepId = parsedData.stepId || parsedData.step_id;
        console.log('🦷 Treatment step QR code detected, ID:', stepId);
        
        Alert.alert(
          'Treatment Step Found',
          `Step ID: ${stepId}`,
          [
            { text: 'Cancel', onPress: () => resetScanner() },
            { 
              text: 'View Step', 
              onPress: () => {
                // Navigate to step details
                navigation.navigate('patient-steps', { stepId });
              }
            }
          ]
        );
      } else if (parsedData.url || data.startsWith('http')) {
        // URL QR code
        const url = parsedData.url || data;
        console.log('🌐 URL QR code detected:', url);
        
        Alert.alert(
          'URL Found',
          url,
          [
            { text: 'Cancel', onPress: () => resetScanner() },
            { 
              text: 'Open', 
              onPress: () => {
                // Handle URL opening
                console.log('Opening URL:', url);
                resetScanner();
              }
            }
          ]
        );
      } else {
        // Generic QR code data
        console.log('📋 Generic QR code data:', data);
        
        Alert.alert(
          'QR Code Scanned',
          `Data: ${data}`,
          [
            { text: 'OK', onPress: () => resetScanner() }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process QR code data. Please try again.',
        [{ text: 'OK', onPress: () => resetScanner() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="camera-alt" size={64} color="#ccc" />
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={getCameraPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
      </View>
      
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing={'back'}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
        />
        
        {/* Scanner overlay */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}>
            <View style={styles.focusedContainer}>
              <View style={styles.scannerFrame} />
            </View>
          </View>
        </View>
        
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Position the QR code within the frame
          </Text>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>
        
        {/* Reset button */}
        {scanned && (
          <View style={styles.resetContainer}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetScanner}
            >
              <MaterialIcons name="refresh" size={24} color="#fff" />
              <Text style={styles.resetButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: '100%',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedContainer: {
    width: 250,
    height: 250,
  },
  scannerFrame: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  resetContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
