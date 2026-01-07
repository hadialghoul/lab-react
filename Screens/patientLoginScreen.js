import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, Text, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Image, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import Config from '../config';

export default function PatientLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log("Starting login process...");
    console.log('🌐 Using environment:', Config.currentEnvironment);
    console.log('🌐 Login URL:', Config.LOGIN_URL);
    
    try {
      const response = await axios.post(Config.LOGIN_URL, {
        email,
        password,
      });

      console.log("Token response:", response.data);

      if (response.data.access) {
        // Store tokens for future requests
        await AsyncStorage.setItem('access', response.data.access);
        await AsyncStorage.setItem('refresh', response.data.refresh);
        
        console.log("Tokens stored successfully");
        
        // Fetch patient information to get patientId and name
        try {
          console.log("Fetching user info...");
          const patientResponse = await axios.get(Config.USER_PROFILE_URL, {
            headers: {
              'Authorization': `Bearer ${response.data.access}`,
            },
          });
          
          const userData = patientResponse.data;
          console.log("User data received:", userData);
          
          if (userData.is_patient && userData.patient_id) {
            console.log("User is a patient, navigating to patient screen...");
            
            // Navigate to patient screen
            navigation.navigate("patient", {
              patientId: userData.patient_id,
              patientName: userData.username || userData.email,
            });
          } else {
            console.log("User is not a patient:", userData);
            Alert.alert("Access Denied", "This account is not registered as a patient.");
          }
          
        } catch (patientError) {
          console.log("Error fetching patient info:", patientError);
          Alert.alert("Error", "Failed to load patient information.");
        }
        
      } else {
        console.log("No access token in response");
        Alert.alert("Invalid credentials");
      }
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login failed", "Incorrect email or password.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.mainWrapper}>
          {/* Back Button and Logo */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>{'<'} Back</Text>
            </TouchableOpacity>
            
            <Image source={require('../assets/icon.jpeg')} style={styles.logo} />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Patient Login</Text>
            <Text style={styles.subtitle}>Access your SmileReign dashboard</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                placeholder="Email Address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity onPress={() => navigation.navigate("register-patient")} style={styles.registerLink}>
              <Text style={styles.registerText}>Don't have an account? Register here</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Powered by Cal West Dental Lab</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  mainWrapper: {
    flex: 1,
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '600',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#5A6C7D',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  loginButton: {
    backgroundColor: '#A5D6A7',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#5A6C7D',
    fontSize: 15,
  },
  footer: {
    textAlign: 'center',
    color: '#5A6C7D',
    fontSize: 14,
    marginTop: 40,
    marginBottom: 20,
  },
});
