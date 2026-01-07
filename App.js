import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// Wake up the Render backend on app start (prevents cold start delays)
import React, { useEffect } from 'react';
import Config from './config';

const WakeUpBackend = () => {
  useEffect(() => {
    // Ping backend to wake it up from sleep (Render free tier)
    fetch(`${Config.BASE_URL}/accounts/me/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }).catch(() => console.log('Backend wake-up ping sent'));
  }, []);
  return null;
};

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer >
      <WakeUpBackend />
      <Stack.Navigator
        screenOptions={{
          headerTintColor: '#A5D6A7',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="login-patient" component={PatientLogin} options={{ headerShown: false }} />
        <Stack.Screen name="login-doctor" component={DoctorLogin} options={{ headerShown: false }} />
        <Stack.Screen name="register-patient" component={PatientRegister} options={{ headerShown: false }} />
        <Stack.Screen name="activate" component={ActivationScreen} options={{ headerTintColor: '#A5D6A7' }} />
        <Stack.Screen name="doctor" component={DoctorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="patient" component={PatientScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PatientStepsScreen" component={PatientStepsScreen} options={{ title: 'Treatment Steps', headerTintColor: '#A5D6A7' }} />
        <Stack.Screen name="qr-scanner" component={QRScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="custom-camera" component={CustomCameraScreen} options={{ headerShown: false }} />
        <Stack.Screen name="doctor-patient-steps" component={DoctorPatientSteps} options={{ title: 'Patient Steps', headerTintColor: '#A5D6A7' }} />
        <Stack.Screen name="patient-stage" component={PatientStageScreen} options={{ title: 'Patient Stage', headerTintColor: '#A5D6A7' }} />
        <Stack.Screen name="patient-photos" component={PatientPhotos} options={{ title: 'Photos', headerTintColor: '#A5D6A7' }} />
   
      </Stack.Navigator>
    </NavigationContainer>
  );
}


