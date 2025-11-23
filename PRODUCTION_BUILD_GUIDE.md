# Production Build Guide

## 🚀 Quick Production Build Commands

### Build Commands
```bash
# Build for Android only
npm run build:android

# Build for iOS only  
npm run build:ios

# Build for both platforms
npm run build:all
```

### Submit Commands (After Build)
```bash
# Submit Android to Google Play Store
npm run submit:android

# Submit iOS to App Store
npm run submit:ios

# Submit both platforms
npm run submit:all
```

## 📋 Prerequisites

### 1. EAS CLI Installation
```bash
npm install -g @expo/eas-cli
```

### 2. Login to EAS
```bash
eas login
```

### 3. Configure Project
```bash
eas build:configure
```

## 🔧 Configuration Setup

### iOS Configuration
Before building for iOS, update `eas.json` with your Apple credentials:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id", 
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### Android Configuration
For Android submission, you need a Google Play service account:
1. Create service account in Google Cloud Console
2. Download the JSON key file
3. Update `eas.json`:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path-to-your-service-account-key.json",
        "track": "production"
      }
    }
  }
}
```

## 🏗️ Build Process

### Step 1: Update Version Numbers
Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "4"
    },
    "android": {
      "versionCode": 9
    }
  }
}
```

### Step 2: Build Production App
```bash
# For Android (creates AAB file for Play Store)
npm run build:android

# For iOS (creates IPA file for App Store)
npm run build:ios
```

### Step 3: Monitor Build Progress
- Builds run on EAS servers
- You'll get a link to monitor progress
- Build typically takes 10-20 minutes

### Step 4: Download & Test
- Download the built app from EAS dashboard
- Test on physical devices before submission

## 📱 Submission Process

### Android (Google Play Store)
1. Build completes → AAB file ready
2. Run: `npm run submit:android`
3. EAS automatically uploads to Play Console
4. Complete release in Play Console

### iOS (App Store)
1. Build completes → IPA file ready  
2. Run: `npm run submit:ios`
3. EAS uploads to App Store Connect
4. Complete release in App Store Connect

## 🔍 Troubleshooting

### Common Issues
1. **Build Fails**: Check EAS dashboard for detailed error logs
2. **Permission Issues**: Ensure all permissions are properly configured in `app.json`
3. **Version Conflicts**: Make sure version numbers are incremented
4. **Credentials**: Verify Apple/Google credentials are correct

### Debug Commands
```bash
# Check EAS status
eas whoami

# View build logs
eas build:list

# Cancel a build
eas build:cancel [BUILD_ID]
```

## 📊 Build Profiles Explained

- **Development**: For testing with Expo Go
- **Preview**: Internal testing builds (APK for Android)
- **Production**: Store-ready builds (AAB for Android, IPA for iOS)

## 🎯 Best Practices

1. **Always test** production builds on physical devices
2. **Increment version numbers** for each release
3. **Keep credentials secure** and never commit them to git
4. **Monitor build logs** for any warnings or errors
5. **Test camera/gallery** functionality thoroughly on iOS TestFlight

## 📞 Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- EAS CLI Reference: https://docs.expo.dev/build-reference/eas-build/
- Submit Documentation: https://docs.expo.dev/submit/introduction/

