# Troubleshooting: "Invalid ID for this relationship" Error

## Error Message
```
'6758167596' is not a valid ID for this relationship
```

## ⚠️ MOST LIKELY CAUSE: API Key from Wrong Apple Account

**The App Store Connect API key EAS is using was created by a different Apple account than the one that owns the app.**

- Your app (SMILEREIGN, ID 6758167596) is under **Cal West Dental** (CalWestDentalLab@att.net, team X5FRZP29C6).
- The API key stored in EAS (`[Expo] EAS Submit BuJqrRv4x3`) was probably created under **another account** (e.g. hadialghoul’s Expo/Apple account).
- Apple only allows an API key to submit to apps that belong to **the same App Store Connect account** that created the key. So Apple rejects the app ID.

### Fix: Use an API key from the account that owns the app

1. **Log in to App Store Connect with the account that owns the app**  
   Use **CalWestDentalLab@att.net** (the same Apple ID as in your `eas.json`).

2. **Create an App Store Connect API key in that account**  
   - App Store Connect → **Users and Access** → **Keys** tab → **App Store Connect API**.  
   - Click **+** to generate a new key.  
   - Name it (e.g. `EAS Submit`).  
   - Role: **App Manager** or **Admin**.  
   - Download the **.p8** file once (you can’t download it again).  
   - Note the **Key ID** and **Issuer ID** (from the Keys page).

3. **Add this key to EAS** (so submission uses Cal West’s key, not the other account’s):
   ```bash
   eas credentials
   ```
   - Choose **iOS** → **production** (or the profile you submit with).  
   - Go to **App Store Connect API Key** and add the new key (upload .p8, enter Key ID and Issuer ID).  
   Or use:
   ```bash
   eas credentials --platform ios
   ```
   and follow the prompts to set the App Store Connect API Key for the correct account.

4. **Submit again:**
   ```bash
   npx eas-cli submit -p ios --profile production
   ```

The key must be created and stored under the **same** App Store Connect account that owns the app (Cal West Dental). Once EAS uses that key, the “not a valid ID for this relationship” error should stop.

---

## Other Causes & Solutions

### ✅ Solution 1: Fix Bundle ID in App Store Connect

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
