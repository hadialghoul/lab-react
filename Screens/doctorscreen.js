import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native'
import React, { useLayoutEffect } from 'react'
import 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PatientTreatmentScreen from './patientTreatmentScreen';
import InvisalignScreen from './invisalignScreen';
import PatientTreatmentStepsScreen from './patientTreatmentStepsScreen';
import PatientStepsScreen from './patientStepsScreen';
import PatientStageScreen from './patientStageScreen';
import DoctorPatientSteps from './doctorpatientSteps';
import DoctorPatientTreatmentScreen from './doctorPatientTreatment';
import DoctorReportsScreen from './doctorReportsScreen';
import DashboardScreen from './DashboardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function DoctorScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15, padding: 8 }}>
          <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'main' }],
            });
          },
        },
      ]
    );
  };

  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          height: 70,
          paddingBottom: 12,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: () => (
            <Image
              source={require('../assets/2.jpg')}
              style={{ width: 26, height: 26, borderRadius: 6 }}
              resizeMode="cover"
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Patients" 
        component={DoctorPatientTreatmentScreen}
        options={{
          tabBarIcon: () => (
            <Image
              source={require('../assets/4.jpg')}
              style={{ width: 26, height: 26, borderRadius: 6 }}
              resizeMode="cover"
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={DoctorReportsScreen}
        options={{
          tabBarIcon: () => (
            <Image
              source={require('../assets/3.jpg')}
              style={{ width: 26, height: 26, borderRadius: 6 }}
              resizeMode="cover"
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({})