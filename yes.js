// yes.js — video plays with sound by default.
// Celebration button mutes video and plays saved song.

(() => {
  const happyVideo = document.getElementById("happyVideo");
  const yesMusic = document.getElementById("yesMusic");
  const startPartyBtn = document.getElementById("startPartyBtn");
  const floatLayer = document.getElementById("yesFloatLayer");

  if (!happyVideo) {
    console.error("yes.js: <video id='happyVideo'> not found");
    return;
  }

  /* -------------------------------
     1) Random happy video (local)
  -------------------------------- */
  const happyVideos = [
    "happy1.mp4"
    // add more if you want
  ];

  const KEY = "lastHappyVideoIdx";
  const last = Number(localStorage.getItem(KEY) || "-1");
  let idx = Math.floor(Math.random() * happyVideos.length);
  if (happyVideos.length > 1 && idx === last) idx = (idx + 1) % happyVideos.length;
  localStorage.setItem(KEY, String(idx));

  const src = `./videos/happy/${happyVideos[idx]}`;
  console.log("YES video:", src);

  happyVideo.src = src;
  happyVideo.loop = true;
  happyVideo.playsInline = true;

  // 🔊 VIDEO SOUND ON BY DEFAULT
  happyVideo.muted = false;
  happyVideo.volume = 1;

  happyVideo.load();

  // Try to play immediately (same behavior as sad page)
  happyVideo.play().catch(() => {
    // If browser blocks it, we do nothing (by design)
    console.warn("Video autoplay with sound was blocked");
  });

  /* -------------------------------
     2) Confetti + floating text
  -------------------------------- */
  function fireConfetti() {
    const duration = 1600;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 10,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
      });
      confetti({
        particleCount: 10,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  const phrases = [
    "She said yes",
    "Forever begins",
    "My Valentine",
    "With love",
    "Always",
  ];

  function spawnFloatingYes() {
    if (!floatLayer) return;

    const el = document.createElement("div");
    el.className = "yes-float";
    el.textContent = phrases[Math.floor(Math.random() * phrases.length)];

    el.style.left = `${6 + Math.random() * 88}vw`;
    el.style.setProperty("--drift", `${-22 + Math.random() * 44}px`);
    el.style.animationDuration = `${4 + Math.random() * 2.5}s`;

    floatLayer.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  fireConfetti();
  spawnFloatingYes();
  setInterval(spawnFloatingYes, 420);

  /* -------------------------------
     3) Celebration button behavior
     - Mute video
     - Play saved song
  -------------------------------- */
  if (startPartyBtn) startPartyBtn.hidden = false;

  startPartyBtn?.addEventListener("click", async () => {
    // 1) mute the cat video + hide it
    happyVideo.muted = true;
    if (videoBox) videoBox.hidden = true;
  
    // 2) show spinning record
    if (recordBox) recordBox.hidden = false;
  
    // 3) play your saved song from 5 seconds
    if (!yesMusic) return;
  
    try {
      yesMusic.pause(); // reset any partial playback
      yesMusic.currentTime = 5; // ✅ start at 5s
      yesMusic.volume = 0.9;
  
      await yesMusic.play();
  
      // Optional: hide button after starting
      startPartyBtn.hidden = true;
    } catch (e) {
      console.warn("Music play blocked:", e);
      // if blocked, revert UI so it doesn't look broken
      if (recordBox) recordBox.hidden = true;
      if (videoBox) videoBox.hidden = false;
      happyVideo.muted = false;
    }
  });
  // Cleanup
  window.addEventListener("beforeunload", () => {
    try { yesMusic?.pause(); } catch {}
  });
})();
