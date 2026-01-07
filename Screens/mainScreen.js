import { StyleSheet, View, Image, Text, Dimensions, StatusBar, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import main5 from "../assets/main5.jpeg";

const { width, height } = Dimensions.get('window');

export default function MainScreen() {
    const navigation = useNavigation();
    
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* Background Image */}
            <Image style={styles.backgroundImage} source={main5} />
            
            {/* Dark overlay for readability */}
            <View style={styles.gradientOverlay} />
            
            {/* Content Container */}
            <View style={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.appTitle}>SMILEREIGN</Text>
                    
                </View>
                 {/* Spacer to position buttons lower */}
                     <View style={{ height: 440 }} />

                     {/* Button Section */}
                     <View style={styles.buttonContainer}>
                         <TouchableOpacity onPress={() => navigation.navigate('login-doctor')} activeOpacity={0.8} style={{ width: '100%', alignItems: 'center' }}>
                             <View style={[styles.button, styles.primaryButton]}>
                                 <Text style={styles.primaryButtonText}>Log in</Text>
                             </View>
                         </TouchableOpacity>

                         <TouchableOpacity onPress={() => navigation.navigate('register-patient')} activeOpacity={0.8} style={{ width: '100%', alignItems: 'center' }}>
                             <View style={[styles.button, styles.secondaryButton]}>
                                 <Text style={styles.secondaryButtonText}>Create account</Text>
                             </View>
                         </TouchableOpacity>
                     </View>
                 
                 {/* Footer: Privacy Policy link - positioned lower */}
                 <View style={styles.footerSection}>
                     <TouchableOpacity onPress={() => Linking.openURL('https://smilereign.com/privacy-policy-1')} activeOpacity={0.7}>
                         <Text style={styles.footerText}>Privacy Policy</Text>
                     </TouchableOpacity>
                 </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        position: 'absolute',
        width: width,
        height: height,
        resizeMode: 'cover',
    },
    gradientOverlay: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: 'rgba(0,0,0,0.45)'
    },
     contentContainer: {
         flex: 1,
         alignItems: 'center',
         paddingTop: StatusBar.currentHeight + 30,
         paddingHorizontal: 30,
     },
    headerSection: {
        alignItems: 'center',
        marginTop: 20, // keep title near the top
    },
    appTitle: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#f0f0f0',
        textAlign: 'center',
        fontWeight: '300',
        letterSpacing: 1,
    },
     buttonContainer: {
         width: '100%',
         alignItems: 'center',
         marginBottom: 20,
     },
    button: {
        width: width * 0.84,
        height: 50,
        borderRadius: 6,
        marginVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButton: {
        backgroundColor: '#A5D6A7', // Light green
    },
    primaryButtonText: {
        color: '#2C3E50',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
     footerSection: {
         alignItems: 'center',
         marginTop: 100,
     },
    footerText: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
    },
    // floatingButton removed to restore centered layout
    signupLink: {
        color: '#4A90E2',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});