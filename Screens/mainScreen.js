import { StyleSheet, View, Image, Text, Dimensions, StatusBar, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import main from '../assets/main.jpeg';
import icon from '../assets/icon.jpeg';
import Colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function MainScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Hero image - full width, top portion */}
            <Image style={styles.backgroundImage} source={main} resizeMode="cover" />

            {/* White rounded card over the bottom */}
            <View style={styles.card}>
                <View style={styles.logoRow}>
                    <Image style={styles.logo} source={icon} resizeMode="contain" />
                    <Text style={styles.appName}>SmileReign</Text>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('login-doctor')}
                    activeOpacity={0.8}
                    style={styles.buttonWrap}
                >
                    <View style={[styles.button, styles.primaryButton]}>
                        <Text style={styles.buttonText}>Login</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('register-patient')}
                    activeOpacity={0.8}
                    style={styles.buttonWrap}
                >
                    <View style={[styles.button, styles.primaryButton]}>
                        <Text style={styles.buttonText}>Create account</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL('https://smilereign.com/privacy-policy-1')}
                    activeOpacity={0.7}
                    style={styles.footerLink}
                >
                    <Text style={styles.footerText}>Privacy Policy</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primaryLight,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height * 0.55,
    },
    card: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 40,
        minHeight: height * 0.5,
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 48,
        height: 48,
        marginRight: 12,
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
    },
    buttonWrap: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 14,
    },
    button: {
        width: '100%',
        maxWidth: width - 56,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 17,
        fontWeight: '600',
    },
    footerLink: {
        marginTop: 24,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
});
