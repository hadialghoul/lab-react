# How to Verify Bundle ID in App Store Connect

## Quick Check Steps

### Step 1: Open Your App
1. Go to https://appstoreconnect.apple.com
2. Click **My Apps**
3. Click on **SMILEREIGN** app

### Step 2: Check Bundle ID
1. In the left sidebar, click **App Information**
2. Scroll to **General Information** section
3. Look for **Bundle ID** field
4. It should show: `com.calwestdental.smilereign`

### Step 3: Verify It Matches Your Code
Your `app.json` file has:
```json
"bundleIdentifier": "com.calwestdental.smilereign"
```

**They must match exactly!**

## What You Should See

### Correct ✅
- Bundle ID: `com.calwestdental.smilereign`
- App Name: `SMILEREIGN`
- SKU: `smilereign-ios`

### Wrong ❌
- Bundle ID: `com.calwestde` (truncated)
- Bundle ID: `hadialghoulsmilereign...` (wrong format)
- Bundle ID: `com.hadialghoul.smilereign` (different)

## Get Your App ID (For eas.json)

While you're checking the Bundle ID, also get the **App ID**:

1. Look at the URL: `https://appstoreconnect.apple.com/apps/[APP_ID]/appstore`
2. Or in **App Information** → **General Information** → **Apple ID**
3. It's a numeric ID (e.g., `1234567890`)

This App ID is what you need to update in `eas.json`!

## Screenshot Locations

The Bundle ID appears in:
- **App Information** page → General Information section
- **App Store** tab → App Information section
- URL when viewing the app

## If Bundle ID is Wrong

If the Bundle ID doesn't match `com.calwestdental.smilereign`:
1. You may need to delete the app and recreate it
2. Or contact Apple Support if you can't change it
3. Make sure you selected the correct Bundle ID when creating the app
