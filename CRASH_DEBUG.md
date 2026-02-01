# How to see why SmileReign crashes (without Xcode)

## 1. Use the boot screen to see WHEN it crashes

The app now shows a **plain green screen for 3 seconds**, then the normal main screen.

- **If it crashes in the first ~3 seconds** (while the screen is only green)  
  → The problem is **not** the main screen (not Image, WebView, or card). It’s likely the app bootstrap, React Navigation, or the device/OS.

- **If it crashes right when the main screen appears** (after the 3 seconds)  
  → The problem is **on the main screen** (Image, WebView, or something in the card).

So: note whether the crash happens on the green screen or when the buttons appear.

---

## 2. See the exact error: Sentry (recommended)

Sentry shows every crash in a dashboard with stack trace and device info. No Xcode needed.

1. Sign up (free): https://sentry.io/signup  
2. Create a project (e.g. “SmileReign”), choose **React Native**.  
3. In the project, go to **Settings → Client Keys (DSN)** and copy the **DSN**.  
4. In your project folder run:
   ```bash
   npx @sentry/wizard@latest -i reactNative
   ```
   Use your DSN when the wizard asks. It will install Sentry and configure the app.  
5. Build and submit to TestFlight again:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --profile production --latest
   ```
6. After the next crash, open your Sentry project → **Issues**. You’ll see the crash with reason and stack trace.

---

## 3. See the exact error: iPhone crash report

If you don’t use Sentry yet, you can still read the crash on the device:

1. On the **iPhone**: **Settings → Privacy & Security → Analytics & Improvements → Analytics Data**.  
2. Turn on **Share iPhone Analytics** if it’s off.  
3. Reproduce the crash (open the app and let it crash).  
4. Wait 5–10 minutes, then open **Analytics Data** again.  
5. Find an entry that starts with **SmileReign** or **com.calwestdental.smilereign** and ends in **.ips**. Tap it.  
6. In the report, search for:
   - **Termination Reason**
   - **Exception Type**
   - **lastExceptionBacktrace**  
   Copy those lines (or a screenshot) and share them so we can see the exact cause.

---

## 4. When you’re done debugging

When the crash is fixed and you no longer need the 3‑second green screen:

- In **App.js**, remove `initialRouteName="boot"` from `Stack.Navigator`.  
- Remove the **boot** screen from the stack and the `BootScreen` import if you don’t use it elsewhere.
