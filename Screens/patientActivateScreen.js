import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, Text, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Button } from "react-native-elements";
import axios from "axios";
import Config from '../config';

export default function ActivationScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(''); // Error state to display messages

  const handleVerify = async () => {
    if (!code) {
      setError("Code is required.");
      return;
    }
  
    console.log('🌐 Using environment:', Config.currentEnvironment);
    console.log('🌐 Verify URL:', Config.VERIFY_CODE_URL);
    
    try {
      const response = await axios.post(
        Config.VERIFY_CODE_URL,
        { code }, // Send code as the payload
        { headers: { 'Content-Type': 'application/json' } } // Ensure proper content type
      );
  
      if (response.status === 200) {
        navigation.navigate('login-patient');
      } else {
        setError("Invalid code. Please check your email and try again.");
      }
    } catch (error) {
      if (error.response) {
        console.log("Error response:", error.response);
        const errorMessage = error.response.data.detail || "An unexpected error occurred.";
        setError(errorMessage);
      } else {
        console.log('Network error:', error);
        setError("Network error. Please check your connection.");
      }
    }
  };
  
  return (
    <KeyboardAvoidingView style={styles.containerView} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.loginScreenContainer}>
          <View style={styles.loginFormView}>
            <Text style={styles.logoText}>Patient Registration</Text>
            
            <TextInput
              placeholder="Confirmation Code"
              secureTextEntry
              style={styles.loginFormTextInput}
              value={code} // bind to the code state
              onChangeText={setCode} // update code state
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Verify" onPress={handleVerify} buttonStyle={styles.loginButton} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    alignItems: "center",
    backgroundColor: '#E8F5E9',
  },
  loginScreenContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "800",
    marginTop: 150,
    marginBottom: 30,
    textAlign: "center",
  },
  loginFormView: {
    flex: 1,
  },
  loginFormTextInput: {
    height: 43,
    fontSize: 14,
    borderRadius: 5,
    borderWidth: 0,
    backgroundColor: "#F5F5F5",
    paddingLeft: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  loginButton: {
    backgroundColor: "#A5D6A7",
    borderRadius: 5,
    height: 45,
    marginTop: 10,
    width: 350,
    alignItems: "center"
  },
  fbLoginButton: {
    height: 45,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#A5D6A7"
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  }
});
