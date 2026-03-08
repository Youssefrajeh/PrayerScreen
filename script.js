document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const currentTimeEl = document.getElementById("current-time");
  const meridiemEl = document.getElementById("meridiem");
  const currentDateEl = document.getElementById("current-date");
  const prayerGridEl = document.getElementById("prayer-grid");

  // Data source from muslimwellness implementation
  const API_URL =
    "https://raw.githubusercontent.com/OssamaMahmoud/random/refs/heads/main/MWN-prayer-times-v26.json";

  let prayerTimesData = null;

  // Ordered list of prayers and their id keys
  const PRAYERS = [
    {
      id: "fajr",
      name: "Fajr",
      beginsKey: "fajr_begins",
      iqamahKey: "fajr_jamah",
    },
    {
      id: "sunrise",
      name: "Sunrise",
      beginsKey: "sunrise",
      isSingleTime: true,
    },
    {
      id: "zuhr",
      name: "Zuhr",
      beginsKey: "zuhr_begins",
      iqamahKey: "zuhr_jamah",
    },
    { id: "asr", name: "Asr", beginsKey: "asr_begins", iqamahKey: "asr_jamah" },
    {
      id: "maghrib",
      name: "Maghrib",
      beginsKey: "maghrib_begins",
      iqamahKey: "maghrib_jamah",
    },
    {
      id: "isha",
      name: "Isha",
      beginsKey: "isha_begins",
      iqamahKey: "isha_jamah",
    },
  ];

  // Initialize Application
  async function init() {
    startClock();
    await fetchPrayerData();
    if (prayerTimesData) {
      renderPrayerCards();
      updateActivePrayer();
      
      // Softly refresh the data and re-render every 60 seconds (1 minute)
      // This keeps the page updated without forcing a hard reload that would drop fullscreen
      setInterval(async () => {
          await fetchPrayerData();
          if (prayerTimesData) {
             renderPrayerCards();
             updateActivePrayer();
          }
      }, 60000);
    }
  }

  // Fetch data from GitHub raw JSON
  async function fetchPrayerData() {
    try {
      // Add a timestamp to bypass GitHub's cache and get new uploads instantly
      const res = await fetch(`${API_URL}?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      // Extract today's data
      const todayStr = getFormattedDateKey();
      prayerTimesData = data.find((item) => {
        const itemDate = item.d_date.substring(item.d_date.indexOf("-") + 1);
        return itemDate === todayStr;
      });

      // Handle Jum'ah logic (if Friday, replace Zuhr with Jum'ah)
      if (new Date().getDay() === 5 && prayerTimesData) {
        const zuhrIndex = PRAYERS.findIndex((p) => p.id === "zuhr");
        if (zuhrIndex !== -1) {
          PRAYERS[zuhrIndex].name = "Jum'ah";
          // Muslim wellness fixed Jumah time logic seen in their html
          // They hardcoded it to 3:00 PM or the same as zuhr. We will display standard Jum'ah if provided, else use Zuhr time.
          prayerTimesData.zuhr_jamah_display = "1:30 PM / 2:30 PM"; // They mentioned two services in faq, but we'll show standard Zuhr begins/iqamah to not hardcode, but rename it.
        }
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      prayerGridEl.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Failed to load prayer times. Please try again later.</div>';
    }
  }

  // Helper: Returns MM-DD for looking up in JSON
  function getFormattedDateKey() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
    return mm + "-" + dd;
  }

  // Helper: Format Server Time "HH:MM:SS" to "HH:MM PM" or "HH:MM" depending on format
  function formatTimeString(timeStr, includeMeridiem = true) {
    if (!timeStr) return "--:--";

    // Remove seconds if they exist (splits at second colon or handles length)
    let cleanTime = timeStr;
    if (timeStr.split(":").length === 3) {
      cleanTime = timeStr.substring(0, timeStr.lastIndexOf(":"));
    }

    let [hours, minutes] = cleanTime.split(":");
    hours = parseInt(hours, 10);

    let meridiem = "";
    if (includeMeridiem) {
      meridiem = hours >= 12 ? " PM" : " AM";
    }

    // Convert to 12-hour format
    if (hours > 12) hours -= 12;
    else if (hours === 0) hours = 12;

    return `${hours}:${minutes}${meridiem}`;
  }

  // Render Cards
  function renderPrayerCards() {
    prayerGridEl.innerHTML = ""; // clear spinner

    PRAYERS.forEach((prayer) => {
      const beginsTime = formatTimeString(prayerTimesData[prayer.beginsKey]);
      let iqamahTime = "";

      if (!prayer.isSingleTime) {
        // If it's Jumah, we use overriding display logic if needed, else normal
        const rawIqamah = prayerTimesData[prayer.iqamahKey];
        iqamahTime = formatTimeString(rawIqamah, false); // No meridiem to keep it clean, or keep it depending on preference. Let's keep it clean
      }

      const isSunrise = prayer.id === "sunrise";

      const cardHTML = `
                <div class="prayer-card ${isSunrise ? "sunrise-card" : ""}" id="card-${prayer.id}">
                    <div class="prayer-header">
                        <h2 class="prayer-name">${prayer.name}</h2>
                        <span class="prayer-indicator" style="display: none;">Next</span>
                    </div>
                    ${
                      isSunrise
                        ? `
                        <div class="prayer-times">
                            <div class="time-block">
                                <span class="time-label">Time</span>
                                <span class="time-value primary">${beginsTime}</span>
                            </div>
                        </div>
                    `
                        : `
                        <div class="prayer-times">
                            <div class="time-block">
                                <span class="time-label">Begins</span>
                                <span class="time-value">${beginsTime}</span>
                            </div>
                            <div class="time-block" style="text-align: right;">
                                <span class="time-label">Iqamah</span>
                                <span class="time-value primary">${iqamahTime}</span>
                            </div>
                        </div>
                    `
                    }
                </div>
            `;
      prayerGridEl.insertAdjacentHTML("beforeend", cardHTML);
    });
  }

  // Clock
  function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();

    // Update Time
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const fHours = String(hours).padStart(2, "0");
    const fMins = String(minutes).padStart(2, "0");
    const fSecs = String(seconds).padStart(2, "0");

    currentTimeEl.textContent = `${fHours}:${fMins}:${fSecs}`;
    meridiemEl.textContent = ampm;

    // Update Date
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    currentDateEl.textContent = now.toLocaleDateString("en-US", options);
    
    // Update active prayer logic every second to ensure countdown works accurately
    updateActivePrayer(now);
  }

  // Determine the next upcoming prayer, highlight the card, and update countdown
  function updateActivePrayer(now = new Date()) {
    if (!prayerTimesData) return;

    const currentTotalSecs =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let nextPrayerId = "fajr"; // Default to Fajr for tomorrow if past Isha
    let nextPrayerTimeSecs = -1;
    let nextPrayerName = "Fajr";

    // Find the first prayer whose Iqamah (or begins for sunrise) is strictly after the current time
    for (let i = 0; i < PRAYERS.length; i++) {
      const prayer = PRAYERS[i];
      const timeKey = prayer.isSingleTime ? prayer.beginsKey : prayer.iqamahKey;
      const timeStr = prayerTimesData[timeKey];

      if (!timeStr) continue;

      // Normalize time string handles HH:MM:SS or HH:MM
      const parts = timeStr.split(":");
      let hours = parseInt(parts[0], 10);
      let mins = parseInt(parts[1], 10);
      let secs = parts.length > 2 ? parseInt(parts[2], 10) : 0;

      const prayerTotalSecs = hours * 3600 + mins * 60 + secs;

      if (currentTotalSecs < prayerTotalSecs) {
        nextPrayerId = prayer.id;
        nextPrayerTimeSecs = prayerTotalSecs;
        nextPrayerName = prayer.name;
        break;
      }
    }

    // Reset all cards
    document.querySelectorAll(".prayer-card").forEach((card) => {
      card.classList.remove("active");
      const indicator = card.querySelector(".prayer-indicator");
      if (indicator) indicator.style.display = "none";
    });

    // Highlight active card
    const activeCard = document.getElementById(`card-${nextPrayerId}`);
    if (activeCard) {
      activeCard.classList.add("active");
      const indicator = activeCard.querySelector(".prayer-indicator");
      if (indicator) indicator.style.display = "block";
    }

    // Update Countdown Tracker
    const countdownEl = document.getElementById("countdown-display");
    if (countdownEl && nextPrayerTimeSecs !== -1) {
        let diffSecs = nextPrayerTimeSecs - currentTotalSecs;
        
        // Handle midnight rollover (if past Isha, the next is Fajr tomorrow)
        if (diffSecs < 0) {
            // Get Fajr time and add 24 hours worth of seconds
            const timeStr = prayerTimesData[PRAYERS[0].iqamahKey];
            const parts = timeStr.split(":");
            let hours = parseInt(parts[0], 10);
            let mins = parseInt(parts[1], 10);
            const fajrTotalSecs = (hours * 3600) + (mins * 60);
            
            // Total seconds remaining today + fajr seconds tomorrow
            diffSecs = (86400 - currentTotalSecs) + fajrTotalSecs;
            nextPrayerName = "Fajr";
        }

        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;
        
        const formatTime = (val) => String(val).padStart(2, '0');
        
        let countdownText = "";
        if (h > 0) {
             countdownText = `${h}H ${formatTime(m)}M ${formatTime(s)}S`;
        } else {
             countdownText = `${formatTime(m)}M ${formatTime(s)}S`;
        }
        
        countdownEl.textContent = `Time until ${nextPrayerName}: ${countdownText}`;
        countdownEl.style.display = 'block';
    }
  }

  // Auto-Fullscreen Logic & Dummy Video Playback for Casting
  document.addEventListener('click', () => {
      const prompt = document.getElementById('fullscreen-prompt');
      if (prompt) prompt.style.opacity = '0';
      
      const dummyVideo = document.getElementById('dummy-video');
      if (dummyVideo) dummyVideo.play().catch(e => console.log('Video play failed', e));

      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
              console.log(`Fullscreen could not be enabled: ${err.message}`);
          });
      }
  }, { once: true });

  init();
});
