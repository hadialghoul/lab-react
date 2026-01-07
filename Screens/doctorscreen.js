import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native'
import React from 'react'
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

const Tab = createBottomTabNavigator();

export default function DoctorScreen() {
  const navigation = useNavigation();

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
        tabBarActiveTintColor: "#A5D6A7",
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
        headerLeft: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 15 }}>
            <Image source={require('../assets/icon.jpeg')} style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#2C3E50' }}>SmileReign</Text>
          </View>
        ),
        headerTitle: '',
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 15, padding: 8 }}
          >
            <Text style={{ color: '#A5D6A7', fontSize: 16, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 28 }}>{focused ? '🏠' : '🏡'}</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Patients" 
        component={DoctorPatientTreatmentScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 28 }}>{focused ? '👥' : '👤'}</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={DoctorReportsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 28 }}>{focused ? '📊' : '📈'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({})