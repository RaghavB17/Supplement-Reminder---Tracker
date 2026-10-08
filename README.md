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

This browser version can request notification permission and checks reminder times while it is open. iOS does not allow a standard web page to guarantee scheduled notifications in the background. 
