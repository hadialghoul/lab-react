import { StyleSheet, View, Image, Text, Dimensions, StatusBar, TouchableOpacity, Linking, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/colors';

const win = Dimensions.get('window') || {};
const width = win.width || 375;
const height = win.height || 812;

export default function MainScreen() {
    const navigation = useNavigation();
    const [showText, setShowText] = useState(Platform.OS !== 'ios');

    useEffect(() => {
        if (Platform.OS === 'ios') {
            const t = requestAnimationFrame(() => setShowText(true));
            return () => cancelAnimationFrame(t);
        }
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Hero image - full width, top portion */}
            <Image style={styles.backgroundImage} source={require('../assets/main.jpeg')} resizeMode="cover" />

            {/* White rounded card - text deferred one frame on iOS to avoid CoreText crash on iOS 26 */}
            <View style={styles.card}>
                {showText ? (
                    <>
                        <View style={styles.logoRow}>
                            <Image style={styles.logo} source={require('../assets/icon.jpeg')} resizeMode="contain" />
                            <Text style={styles.appName} allowFontScaling={false}>SmileReign</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('login-doctor')}
                            activeOpacity={0.8}
                            style={styles.buttonWrap}
                        >
                            <View style={[styles.button, styles.primaryButton]}>
                                <Text style={styles.buttonText} allowFontScaling={false}>Login</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('register-patient')}
                            activeOpacity={0.8}
                            style={styles.buttonWrap}
                        >
                            <View style={[styles.button, styles.primaryButton]}>
                                <Text style={styles.buttonText} allowFontScaling={false}>Create account</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://smilereign.com/privacy-policy-1')}
                            activeOpacity={0.7}
                            style={styles.footerLink}
                        >
                            <Text style={styles.footerText} allowFontScaling={false}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.logoRow}>
                        <Image style={styles.logo} source={require('../assets/icon.jpeg')} resizeMode="contain" />
                    </View>
                )}
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
        color: Colors.text,
        ...(Platform.OS === 'ios' && { fontFamily: 'System' }),
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
        ...(Platform.OS === 'ios' && { fontFamily: 'System' }),
    },
    footerLink: {
        marginTop: 24,
    },
    footerText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    },
});
