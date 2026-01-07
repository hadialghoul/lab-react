import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, Text, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Image, ScrollView } from "react-native";
import axios from "axios";
import Config from '../config';

export default function PatientRegister({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Clear previous errors
    setError('');

    // Validate form fields
    if (!username || !email || !password || !password2) {
      setError("All fields are required.");
      return;
    }
  
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
  
    console.log('🌐 Using environment:', Config.currentEnvironment);
    console.log('🌐 Register URL:', Config.REGISTER_URL);
    
    try {
      const response = await axios.post(Config.REGISTER_URL, {
        username,
        email,
        password,
        confirm_password: password2,
      });
  
      Alert.alert(
        "Registration Successful",
        "Check your email to activate your account before logging in.",
        [{ text: 'OK', onPress: () => navigation.navigate('activate', { email }) }]
      );
     
    }
    catch (error) {
      if (error.response && error.response.data) {
        // Handle error messages
        let errorMessage = '';
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          const messages = Object.values(error.response.data).flat().join('\n');
          errorMessage = messages;
        }
        // Clean up HTML entities and extra spaces
        errorMessage = errorMessage.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        setError(errorMessage || "An unexpected error occurred. Please try again later.");
      } else {
        console.log('Error without response:', error);
        setError("Network error. Please check your connection.");
      }
    }
  }

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
            <Text style={styles.title}>Patient Registration</Text>
            <Text style={styles.subtitle}>Create your SmileReign account</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                placeholder="Confirm Password"
                secureTextEntry
                style={styles.input}
                value={password2}
                onChangeText={setPassword2}
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Register Button */}
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity onPress={() => navigation.navigate("login-patient")} style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? Login here</Text>
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
    fontSize: 32,
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
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#A5D6A7',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#2C3E50',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
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
