# Muslim Wellness Network - Prayer Times Display

A web-based, full-screen digital signage application designed to display real-time prayer schedules, clock, and dates for the Muslim Wellness Centre.

## 🌟 Features

- **Live Clock & Date:** Displays the current time (with seconds) and auto-updating current date.
- **Dynamic Prayer Times:** Fetches daily prayer times automatically from a remote JSON file hosted on GitHub.
- **Real-Time Countdown:** Includes a smart countdown timer that automatically detects the next upcoming prayer and displays the remaining time until Iqamah (or Begins time for Sunrise).
- **Midnight Rollover:** Seamlessly handles midnight transitions, calculating the time until Fajr the next morning once Isha has passed.
- **Jum'ah Support:** Automatically replaces the standard Zuhr prayer card with Jum'ah formatting on Fridays.
- **Auto-Refreshing Data:** Polls the GitHub repository every 60 seconds (`?t=` cache-busting enabled) to ensure that any updates made to the JSON schedule are reflected on the display almost instantly, without requiring a manual page reload.
- **Full-Screen Optimized (TV displays):** Built with aesthetics in mind (glassmorphism UI, animated blob backgrounds) specifically for lobby/mosque TV displays. Clicking the screen seamlessly requests full-screen mode.
- **Prevent Sleep Mode:** Includes a silent, 1x1 pixel background video loop (`dummy_video.mp4`) that prevents smart TVs and media casting devices from timing out or entering sleep mode.

## 📂 Project Structure

- `index.html`: The main dashboard display file. Opens this in a browser to run the application.
- `script.js`: The core logic handling clock updates, countdown calculations, API fetching, and full-screen interactions.
- `style.css`: The styling rules.
- `dummy_video.mp4`: A silent looping video to keep the display awake.
- `prayer.html` & `muslimwellness.html`: Reference files from the original website integration. (Optional/Can be removed).

## 🚀 How to Run

1. Simply open the `index.html` file in any modern web browser (Edge, Chrome, Firefox, Safari).
2. Click anywhere on the screen to initiate Full-Screen Mode and start the dummy video background player.
3. The display will run continuously!

## ⚙️ Updating Prayer Times

The application pulls its prayer times data from:
`https://raw.githubusercontent.com/OssamaMahmoud/random/refs/heads/main/MWN-prayer-times-v26.json`

To update the schedule:

1. Update the JSON file in the GitHub repository.
2. The display will automatically fetch the new times within **60 seconds**, requiring no manual refresh or exiting of full-screen mode.
