import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, Text, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Image, ScrollView } from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';

export default function DoctorLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      console.log('🔍 Attempting doctor login with:', { email, password: '****' });
      console.log('🌐 Using environment:', Config.currentEnvironment);
      console.log('🌐 Login URL:', Config.LOGIN_URL);
      
      const response = await axios.post(Config.LOGIN_URL, {
        email,
        password,
      });

      console.log('🔍 Login response:', response.data);

      if (response.data.access) {
        console.log("✅ Login successful, checking user type...");
        
        // Store tokens temporarily
        await AsyncStorage.setItem('access', response.data.access);
        await AsyncStorage.setItem('refresh', response.data.refresh);
        await AsyncStorage.setItem('token', response.data.access);
        
        // Fetch user profile to verify they are a doctor
        try {
          const userResponse = await axios.get(Config.USER_PROFILE_URL, {
            headers: {
              'Authorization': `Bearer ${response.data.access}`,
            },
          });
          
          const userData = userResponse.data;
          console.log('👤 User data:', userData);
          
          // Check if user is a doctor
          if (userData.is_doctor) {
            console.log("✅ User is a doctor, navigating to doctor screen...");
            navigation.navigate("doctor");
          } else {
            // Not a doctor - clear tokens and show error
            console.log("❌ User is not a doctor");
            await AsyncStorage.removeItem('access');
            await AsyncStorage.removeItem('refresh');
            await AsyncStorage.removeItem('token');
            Alert.alert("Login failed", "Incorrect email or password.");
          }
        } catch (userError) {
          console.log("❌ Error fetching user profile:", userError);
          await AsyncStorage.removeItem('access');
          await AsyncStorage.removeItem('refresh');
          await AsyncStorage.removeItem('token');
          Alert.alert("Login failed", "Incorrect email or password.");
        }
      } else {
        console.log("❌ Invalid credentials - no access token in response");
        Alert.alert("Incorrect email or password.");
      }
    } catch (error) {
      console.log("❌ Login error:", error.response?.data || error.message);
      Alert.alert("Login failed", error.response?.data?.detail || "Incorrect email or password.");
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
            <Text style={styles.title}>Doctor Login</Text>
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
  footer: {
    textAlign: 'center',
    color: '#5A6C7D',
    fontSize: 14,
    marginTop: 40,
    marginBottom: 20,
  },
});
