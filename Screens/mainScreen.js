import { StyleSheet, View, Image, Text, Dimensions, StatusBar, TouchableOpacity, Linking, Platform } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Colors from '../theme/colors';

const win = Dimensions.get('window') || {};
const width = win.width || 375;
const height = win.height || 812;

const safe = {
    bg: Colors?.primaryLight ?? '#C8E6C9',
    text: Colors?.text ?? '#2C3E50',
    textMuted: Colors?.textMuted ?? '#7F8C8D',
    primary: Colors?.primary ?? '#C8E6C9',
};

// HTML for iOS WebView card – avoids native Text/CoreText crash on iOS 26
const CARD_HTML = `
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /></head>
<body style="margin:0;padding:0;background:transparent;font-family:-apple-system,BlinkMacSystemFont,sans-serif;-webkit-tap-highlight-color:transparent">
  <div style="display:flex;align-items:center;margin-bottom:24px">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:${safe.text}">SmileReign</h1>
  </div>
  <button type="button" onclick="window.ReactNativeWebView.postMessage('login-doctor')" style="width:100%;max-width:${width - 56}px;height:52px;margin-bottom:14px;border:0;border-radius:14px;background:${safe.primary};color:${safe.text};font-size:17px;font-weight:600;cursor:pointer">Login</button>
  <button type="button" onclick="window.ReactNativeWebView.postMessage('register-patient')" style="width:100%;max-width:${width - 56}px;height:52px;margin-bottom:14px;border:0;border-radius:14px;background:${safe.primary};color:${safe.text};font-size:17px;font-weight:600;cursor:pointer">Create account</button>
  <a href="#" onclick="window.ReactNativeWebView.postMessage('privacy');return false" style="display:inline-block;margin-top:24px;font-size:14px;color:${safe.textMuted};text-decoration:none">Privacy Policy</a>
</body></html>
`;

export default function MainScreen() {
    const navigation = useNavigation();

    const handleWebViewMessage = (event) => {
        const action = event.nativeEvent?.data;
        if (action === 'login-doctor') navigation.navigate('login-doctor');
        else if (action === 'register-patient') navigation.navigate('register-patient');
        else if (action === 'privacy') Linking.openURL('https://smilereign.com/privacy-policy-1');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            <Image style={styles.backgroundImage} source={require('../assets/main.jpeg')} resizeMode="cover" />

            <View style={styles.card}>
                {Platform.OS === 'ios' ? (
                    <>
                        <View style={styles.logoRow}>
                            <Image style={styles.logo} source={require('../assets/icon.jpeg')} resizeMode="contain" />
                        </View>
                        <WebView
                            source={{ html: CARD_HTML }}
                            style={styles.webViewCard}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                            onMessage={handleWebViewMessage}
                            originWhitelist={['*']}
                        />
                    </>
                ) : (
                    <>
                        <View style={styles.logoRow}>
                            <Image style={styles.logo} source={require('../assets/icon.jpeg')} resizeMode="contain" />
                            <Text style={styles.appName} allowFontScaling={false}>SmileReign</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('login-doctor')} activeOpacity={0.8} style={styles.buttonWrap}>
                            <View style={[styles.button, styles.primaryButton]}>
                                <Text style={styles.buttonText} allowFontScaling={false}>Login</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('register-patient')} activeOpacity={0.8} style={styles.buttonWrap}>
                            <View style={[styles.button, styles.primaryButton]}>
                                <Text style={styles.buttonText} allowFontScaling={false}>Create account</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('https://smilereign.com/privacy-policy-1')} activeOpacity={0.7} style={styles.footerLink}>
                            <Text style={styles.footerText} allowFontScaling={false}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: safe.bg,
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
    webViewCard: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
        minHeight: 200,
    },
    appName: {
        fontSize: 24,
        color: safe.text,
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
        backgroundColor: safe.primary,
    },
    buttonText: {
        color: safe.text,
        fontSize: 17,
        ...(Platform.OS === 'ios' && { fontFamily: 'System' }),
    },
    footerLink: {
        marginTop: 24,
    },
    footerText: {
        color: safe.textMuted,
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    },
});
