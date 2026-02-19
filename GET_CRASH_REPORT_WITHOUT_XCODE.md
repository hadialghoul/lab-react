# How to see why the app crashed (without Xcode)

If SmileReign closes as soon as you tap it, the crash report is saved on the **iPhone**. You can read it without a Mac or Xcode.

---

## On the iPhone

1. Open **Settings**.
2. Go to **Privacy & Security** → **Analytics & Improvements** → **Analytics Data**.
3. In the list, find an entry that starts with **SmileReign** or **com.calwestdental.smilereign** and ends with **.ips** (or **.crash**).
   - If you don’t see it, turn on **Share iPhone Analytics** (same screen), then open the app so it crashes again and wait a few minutes.
4. Tap that entry to open the report.
5. At the **top**, look for lines like:
   - **Exception Type:** (e.g. `EXC_BAD_ACCESS`, `SIGABRT`)
   - **Exception Subtype:** or **Termination Reason:**
   - **Crashed Thread:** or a line with **Fatal JavaScript exception**
6. **Screenshot** that part (or the whole report) and send it to your developer, or read the “Exception Type” and first few lines yourself.

You can also use **Share** (if available) to send the report by email or message.

---

## What we changed so it might stop crashing

- **`babel.config.js`** was added with **react-native-reanimated/plugin**.  
  Without this, the app often crashes on launch on TestFlight. You need to **create a new EAS build** after this change (the plugin is applied at build time):

  ```bash
  npx eas-cli build -p ios --profile production
  ```

Then submit the new build to TestFlight and test again.
