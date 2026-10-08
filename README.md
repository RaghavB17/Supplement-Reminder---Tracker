# Daily Dose

An iPhone-friendly, installable supplement reminder and daily tracker.

## Run locally

From this folder, start a local web server:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. On iPhone, serve the folder over HTTPS, open it in Safari, then choose **Share → Add to Home Screen**.

## Included

- Common-supplement picker and custom entries
- Per-supplement time, dosage, colour, and reminder toggle
- Daily taken/not-taken check-off
- Seven-day adherence chart, streak, and supplement activity
- On-device persistence with `localStorage`
- Installable PWA shell for iPhone home-screen use

## Reminder note

This browser version can request notification permission and checks reminder times while it is open. iOS does not allow a standard web page to guarantee scheduled notifications in the background. For dependable notifications at any time, the same UI should be wrapped as a native iOS application using Capacitor or rebuilt in SwiftUI with local notification scheduling.

## iOS app

This project is now configured as a Capacitor iOS app. The `ios/` project uses the native Local Notifications API, so reminders are scheduled by iOS and can arrive while the app is not open.

Before opening it for the first time, run:

```sh
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode, select the **App** target, set your Team under **Signing & Capabilities**, confirm that the bundle identifier `com.dailydose.supplementtracker` is available to your account, then choose an iPhone or simulator and run it. The app asks for notification permission only when the user explicitly taps **Enable notifications**.

After changing the web UI, repeat `npm run build && npx cap sync ios` before building in Xcode.
