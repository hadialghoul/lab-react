# How to See Why SmileReign Crashed (TestFlight / Device)

Use one of these methods to get the crash reason.

---

## 1. In the app (if Error Boundary caught it)

If the app shows **"Something went wrong"** instead of closing:

- Tap **"See why it crashed"** to view the error message and stack.
- The same error is saved and will be printed when you open the app again with the device connected to Xcode (see method 3).

---

## 2. Crash report on the iPhone (TestFlight / production)

1. On the **iPhone** that crashed: open **Settings**.
2. Go to **Privacy & Security** → **Analytics & Improvements** → **Analytics Data**.
3. Find an entry that starts with **SmileReign** or **com.calwestdental.smilereign** and ends in **.ips** (or **.crash**).
4. Tap it to open the report.
5. **Share it**: use **Share** (or take screenshots) and send it to yourself so you can read the error (look for `exception`, `message`, `stack` or the first few lines of the crash).

If you don’t see any SmileReign entries, make sure **Share iPhone Analytics** (or **Share with App Developers**) is on in the same **Analytics & Improvements** screen, then reproduce the crash and wait a few minutes; the report may appear after that.

---

## 3. Xcode Console (device connected to Mac)

Use this to see **JavaScript** errors and the **last saved crash** from the app.

1. Connect the **iPhone** to your **Mac** with a cable.
2. On the iPhone: open **SmileReign** (from TestFlight or Home Screen) so it’s running or has just crashed.
3. On the Mac: open **Xcode**.
4. Menu: **Window** → **Devices and Simulators**.
5. Select your **iPhone** in the left column.
6. Click **Open Console** (or **View Device Logs**).
7. In the console, filter or scroll for:
   - **SmileReign** or your app name
   - **"SmileReign crash:"** – this is the error text we log when the Error Boundary catches something
   - **"Last SmileReign crash"** – this is the last saved crash from a previous run (printed when the app starts)

You can also use **Console.app** (Applications → Utilities → Console), select your iPhone in the sidebar, then reproduce the crash and look for the same messages.

---

## 4. Xcode Organizer (crashes from TestFlight / App Store)

1. On the Mac: open **Xcode**.
2. Menu: **Window** → **Organizer** (or **Xcode** → **Organizer**).
3. Open the **Crashes** tab.
4. Select your app (**SmileReign**) if it appears.
5. You’ll see a list of crashes; open one to see the **stack trace** and **reason** (e.g. native crash or exception type).

Crashes here usually appear after the device has synced with Xcode and may take a bit of time after the crash.

---

## 5. App Store Connect (if you use TestFlight)

1. Go to [App Store Connect](https://appstoreconnect.apple.com).
2. Your app → **TestFlight** tab.
3. Check for a **Crashes** (or **Crash Logs**) section for the build testers are using.
4. Download or view the crash report; it will show the same kind of info as Xcode Organizer (native stack, exception type).

---

## Summary

| Situation | What to do |
|-----------|------------|
| App shows "Something went wrong" | Tap **"See why it crashed"** in the app. |
| App closes immediately (no error screen) | Get the **.ips** report from iPhone **Settings → Privacy → Analytics Data**, or use **Xcode Organizer** / **App Store Connect** crashes. |
| You have the device and a Mac | Connect iPhone, open **Xcode → Window → Devices and Simulators → Open Console**, then open the app (or crash it) and look for **"SmileReign crash:"** or **"Last SmileReign crash"**. |

The app now **saves the last JS error** and **logs it with `console.error`** so it shows up in Xcode Console when the device is connected.
