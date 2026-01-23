# Troubleshooting: "Invalid ID for this relationship" Error

## Error Message
```
'6758167596' is not a valid ID for this relationship
```

## Common Causes & Solutions

### ✅ Solution 1: Fix Bundle ID in App Store Connect (MOST COMMON)

**The Problem:** The Bundle ID in App Store Connect doesn't match your build's Bundle ID.

**Steps to Fix:**
1. Go to https://appstoreconnect.apple.com
2. Open your **SMILEREIGN** app
3. Click **App Information** in left sidebar
4. Scroll to **General Information** → **Bundle ID**
5. **IMPORTANT:** Click the dropdown and select:
   - `hadialghoulsmilereign b4787d3d4609cc59bc6ff7f0611ab76e - com.calwestdental.smilereign`
   - (The one that ends with `com.calwestdental.smilereign`)
6. Click **Save** (top right)
7. Wait 5-10 minutes for Apple to sync
8. Try submission again

### ✅ Solution 2: Verify App Setup is Complete

**Check these in App Store Connect:**
1. **Agreements, Tax, and Banking**
   - Go to App Store Connect → **Agreements, Tax, and Banking**
   - Make sure all agreements are **Active** (not Pending)
   - Complete any required tax/banking information

2. **App Information**
   - App Information → General Information
   - All required fields should be filled
   - Bundle ID must be correct

3. **App Status**
   - The app should show as "Prepare for Submission" or similar
   - Not "Missing Compliance" or other errors

### ✅ Solution 3: Wait for Apple Sync

If you just created the app:
- Wait **15-30 minutes** after creating the app
- Apple's systems need time to sync the new app
- Try submission again after waiting

### ✅ Solution 4: Verify Build Bundle ID Matches

Your `app.json` has:
```json
"bundleIdentifier": "com.calwestdental.smilereign"
```

**Verify:**
1. The Bundle ID in App Store Connect must be exactly: `com.calwestdental.smilereign`
2. No extra characters, no truncation
3. Must match your `app.json` exactly

### ✅ Solution 5: Check API Key Permissions

The API key might not have proper permissions:
1. Go to App Store Connect → **Users and Access** → **Keys**
2. Find your API key: `[Expo] EAS Submit BuJqrRv4x3`
3. Make sure it has **App Manager** or **Admin** access
4. If needed, create a new key with proper permissions

### ✅ Solution 6: Try Removing ascAppId (Let EAS Auto-Detect)

Sometimes it's better to let EAS find the app automatically:

1. Temporarily remove `ascAppId` from `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "Alii.jamal@hotmail.com",
        // "ascAppId": "6758167596",  // Comment this out
        "appleTeamId": "67UFRV9J5R"
      }
    }
  }
}
```

2. Run submission - EAS will try to find the app by Bundle ID
3. If it works, you can add the App ID back

## Verification Checklist

Before submitting, verify:
- [ ] Bundle ID in App Store Connect = `com.calwestdental.smilereign` (exact match)
- [ ] Bundle ID in `app.json` = `com.calwestdental.smilereign` (exact match)
- [ ] App ID in `eas.json` = `6758167596` (matches App Store Connect)
- [ ] All agreements are Active in App Store Connect
- [ ] App was created more than 15 minutes ago (for sync)
- [ ] API key has proper permissions

## Still Not Working?

If none of these work:
1. **Delete and recreate the app** in App Store Connect with correct Bundle ID
2. **Contact Apple Developer Support** - they can check if there's an account-level issue
3. **Check EAS logs** at the submission URL for more details

## Current Configuration

Your current setup:
- **Bundle ID (app.json)**: `com.calwestdental.smilereign` ✅
- **App ID (eas.json)**: `6758167596`
- **Team ID**: `67UFRV9J5R`
- **Apple ID**: `Alii.jamal@hotmail.com`

Make sure the Bundle ID in App Store Connect matches exactly!
