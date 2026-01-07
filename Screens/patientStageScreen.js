import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Button, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from '../config';

export default function PatientStageScreen({ route }) {
  const { patientId } = route.params || {};
  const [stage, setStage] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStage = async () => {
      // Check if patientId is provided
      if (!patientId) {
        console.log('❌ No patientId provided in route params');
        setError('No patient ID provided');
        setLoading(false);
        return;
      }
      
      console.log('🔍 PatientStageScreen received patientId:', patientId);
      
      // Try multiple token keys to match other screens
      let token = await AsyncStorage.getItem('access') || 
                  await AsyncStorage.getItem('access_token') || 
                  await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('❌ No authentication token found');
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      
      console.log("Viewing treatment for patient ID:", patientId);
      console.log("Token found:", token ? "Yes" : "No");
      try {
        setLoading(true);
        const url = `${Config.BASE_URL}/accounts/doctor/patients/${patientId}/treatment/`;
        console.log("Requesting URL:", url);
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Treatment data:", res.data);
        setStage(res.data.current_stage);
        setQrCode(res.data.qr_image_url);
        setError(null);
      } catch (err) {
        console.log("Error fetching stage:", err);
        console.log("Error details:", err.response?.data);
        
        if (err.response?.status === 404) {
          setError(`No treatment found for patient ID ${patientId}`);
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          setError(`Error: ${err.response?.data?.error || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStage();
  }, [patientId]);

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator size="large" color="#A5D6A7" />
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.debugText}>Patient ID: {patientId}</Text>
        </View>
      )}
      
      {!loading && !error && stage !== null && (
        <>
          <Text style={styles.text}>Current Stage: {stage}</Text>
          {qrCode && (
            <Image
              source={{ uri: qrCode }}
              style={{ width: 200, height: 200 }}
            />
          )}
        </>
      )}
      
      {!loading && !error && stage === null && (
        <Text style={styles.text}>No treatment data available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
    color:"black"
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
