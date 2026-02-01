import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from './theme/colors';
import ErrorBoundary from './components/ErrorBoundary';
import Config from './config';

const CRASH_STORAGE_KEY = '@smilereign_last_crash';

const theme = Colors?.primary ? Colors : { primary: '#C8E6C9', primaryLight: '#C8E6C9', primaryLighter: '#C8E6C9' };
import MainScreen from './Screens/mainScreen';
import PatientLogin from './Screens/patientLoginScreen';
import DoctorLogin from './Screens/doctorLoginScreen';
import PatientRegister from './Screens/patientRegistrationScreen';
import ActivationScreen from './Screens/patientActivateScreen';
import DoctorScreen from './Screens/doctorscreen';
import PatientScreen from './Screens/patientScreen';
import PatientStepsScreen from './Screens/patientStepsScreen';
import QRScannerScreen from './Screens/qrScannerScreen';
import CustomCameraScreen from './Screens/CustomCameraScreen';
import DoctorPatientSteps from './Screens/doctorpatientSteps';
import PatientStageScreen from './Screens/patientStageScreen';
import PatientPhotos from './Screens/patientPhotos';

// Disable console.log in production (TestFlight/App Store) for better performance
if (!__DEV__) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.warn and console.error for critical issues
}

const WakeUpBackend = () => {
  useEffect(() => {
    // Skip on web when backend may be unreachable (avoids ERR_CONNECTION_REFUSED in network tab)
    if (Platform.OS === 'web') return;
    try {
      const url = Config?.BASE_URL ? `${Config.BASE_URL}/accounts/me/` : null;
      if (url) {
        fetch(url, { method: 'GET', headers: { Accept: 'application/json' } }).catch(() => {});
      }
    } catch (e) {
      // ignore – don't crash app on wake-up failure
    }
  }, []);
  return null;
};

const LogLastCrash = () => {
  useEffect(() => {
    AsyncStorage.getItem(CRASH_STORAGE_KEY)
      .then((saved) => { if (saved) console.error('--- Last SmileReign crash ---\n', saved); })
      .catch(() => {});
  }, []);
  return null;
};

export default function App() {
  if (__DEV__) console.warn('[SmileReign] App: mounted');
  const Stack = createStackNavigator();
  return (
    <ErrorBoundary>
      <NavigationContainer onReady={() => __DEV__ && console.warn('[SmileReign] App: NavigationContainer ready')}>
        <LogLastCrash />
        <WakeUpBackend />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerTintColor: theme.primary,
        }}
      >
        <Stack.Screen name="main" component={MainScreen} />
        <Stack.Screen name="login-patient" component={PatientLogin} />
        <Stack.Screen name="login-doctor" component={DoctorLogin} />
        <Stack.Screen name="register-patient" component={PatientRegister} />
        <Stack.Screen name="activate" component={ActivationScreen} />
        <Stack.Screen name="doctor" component={DoctorScreen} />
        <Stack.Screen name="patient" component={PatientScreen} />
        <Stack.Screen name="PatientStepsScreen" component={PatientStepsScreen} />
        <Stack.Screen name="qr-scanner" component={QRScannerScreen} />
        <Stack.Screen name="custom-camera" component={CustomCameraScreen} />
        <Stack.Screen name="doctor-patient-steps" component={DoctorPatientSteps} />
        <Stack.Screen name="patient-stage" component={PatientStageScreen} />
        <Stack.Screen name="patient-photos" component={PatientPhotos} />
   
      </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}


