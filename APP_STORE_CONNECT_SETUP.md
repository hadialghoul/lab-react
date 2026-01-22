# App Store Connect Setup Guide

## Quick Reference

### Your App Details:
- **App Name**: SMILEREIGN
- **Bundle ID**: `com.calwestdental.smilereign`
- **SKU**: `smilereign-ios`
- **Apple ID**: Alii.jamal@hotmail.com
- **Team ID**: 67UFRV9J5R

## Step-by-Step Instructions

### Step 1: Verify Bundle ID in Apple Developer Portal
1. Go to https://developer.apple.com/account
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** in the left sidebar
5. Search for `com.calwestdental.smilereign`
6. **If it doesn't exist**, create it:
   - Click the **+** button
   - Select **App IDs** → Continue
   - Select **App** → Continue
   - Description: `SMILEREIGN`
   - Bundle ID: Select **Explicit** and enter: `com.calwestdental.smilereign`
   - Enable any required capabilities (Push Notifications, etc.)
   - Click **Continue** → **Register**

### Step 2: Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID (Alii.jamal@hotmail.com)
3. Click **My Apps** in the top navigation
4. Click the **+** button → **New App**
5. Fill in the form:
   - **Platform**: Check ☑ **iOS**
   - **Name**: `SMILEREIGN`
   - **Primary Language**: `English (U.S.)`
   - **Bundle ID**: Select `com.calwestdental.smilereign` from dropdown
     - If it doesn't appear, you need to create it in Step 1 first
   - **SKU**: `smilereign-ios`
   - **User Access**: Select **Full Access** (or Limited Access if needed)
6. Click **Create**

### Step 3: Get Your App ID
After creating the app, you'll see the app's dashboard. The App ID is:
- In the URL: `https://appstoreconnect.apple.com/apps/[APP_ID]/appstore`
- Or go to **App Information** → **General Information** section
- It's a numeric ID (e.g., `1234567890`)

### Step 4: Update eas.json
Replace the `ascAppId` in `eas.json` with your new App ID:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "Alii.jamal@hotmail.com",
        "ascAppId": "YOUR_NEW_APP_ID_HERE",  // ← Update this
        "appleTeamId": "67UFRV9J5R"
      }
    }
  }
}
```

### Step 5: Retry Submission
After updating `eas.json`, run:

```bash
npx eas-cli submit -p ios --profile production
```

## Troubleshooting

### Error: "Bundle ID not found"
- Make sure you created the Bundle ID in Apple Developer Portal first (Step 1)
- Wait a few minutes after creating it before using it in App Store Connect

### Error: "Invalid App ID"
- Double-check the App ID in `eas.json` matches the one from App Store Connect
- Make sure there are no extra spaces or quotes

### Error: "Relationship invalid"
- This usually means the App ID in `eas.json` doesn't match an existing app
- Create the app in App Store Connect first, then update `eas.json`

## Important Notes

- **Bundle ID** must match exactly: `com.calwestdental.smilereign`
- **SKU** can be any unique identifier (once set, it cannot be changed)
- **App ID** is different from Bundle ID - it's assigned by Apple when you create the app
- The Bundle ID must exist in your Apple Developer account before you can use it in App Store Connect
