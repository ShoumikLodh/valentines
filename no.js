// no.js (LOCAL MP4 VERSION)
// Plays a random local video from ./videos/sad/ with sound.
// If autoplay-with-sound is blocked, shows a Tap-to-Play overlay.

(() => {
  const params = new URLSearchParams(window.location.search);
  const noCount = Number(params.get("n") || "1");

  // ✅ Put your local filenames here (inside /videos/sad/)
  const videos = [
    "sad1.mp4",
    "sad2.mp4",
    "sad3.mp4",
  ];

  const videoEl = document.getElementById("sadVideo");
  if (!videoEl) {
    console.error("no.js: <video id='sadVideo'> not found in no.html");
    return;
  }

  // Optional elements (script works even if they don't exist)
  const backBtn = document.getElementById("backBtn");
  const noCountText = document.getElementById("noCountText");

  if (noCountText) noCountText.textContent = `No count: ${noCount}`;

  // ---- Pick a random video (avoid repeating the same one) ----
  const STORAGE_KEY = "lastSadVideoIdx";
  const lastIdx = Number(localStorage.getItem(STORAGE_KEY) || "-1");

  let idx = Math.floor(Math.random() * videos.length);
  if (videos.length > 1 && idx === lastIdx) {
    idx = (idx + 1) % videos.length;
  }
  localStorage.setItem(STORAGE_KEY, String(idx));

  const chosen = videos[idx];
  const src = `./videos/sad/${chosen}`;

  // ---- Configure video for best autoplay chances ----
  videoEl.src = src;
  videoEl.loop = true;
  videoEl.playsInline = true;

  // Do NOT set muted if you want sound by default.
  // But we will fallback gracefully if blocked.
  videoEl.muted = false;
  videoEl.volume = 1;

  // ---- Create / use a play-sound overlay button (fallback) ----
  let playSoundBtn = document.getElementById("playSoundBtn");

  function ensurePlayButton() {
    if (playSoundBtn) return playSoundBtn;

    // Create it if not present
    playSoundBtn = document.createElement("button");
    playSoundBtn.id = "playSoundBtn";
    playSoundBtn.textContent = "Tap to play 🔊";
    playSoundBtn.style.position = "absolute";
    playSoundBtn.style.left = "50%";
    playSoundBtn.style.bottom = "18px";
    playSoundBtn.style.transform = "translateX(-50%)";
    playSoundBtn.style.padding = "14px 16px";
    playSoundBtn.style.borderRadius = "18px";
    playSoundBtn.style.border = "1px solid rgba(255,255,255,.22)";
    playSoundBtn.style.background = "rgba(0,0,0,.55)";
    playSoundBtn.style.color = "rgba(255,255,255,.95)";
    playSoundBtn.style.fontWeight = "900";
    playSoundBtn.style.cursor = "pointer";
    playSoundBtn.style.zIndex = "5";

    // Try to append into a container if you have one (video-box), else body
    const container = document.querySelector(".video-box") || document.body;
    container.style.position ||= "relative";
    container.appendChild(playSoundBtn);
    return playSoundBtn;
  }

  async function tryPlayWithSound() {
    videoEl.muted = false;
    videoEl.volume = 1;

    try {
      await videoEl.play();
      // If play succeeds, hide play button if it exists
      if (playSoundBtn) playSoundBtn.style.display = "none";
      return true;
    } catch (err) {
      return false;
    }
  }

  // First load
  videoEl.load();

  // Attempt autoplay immediately
  tryPlayWithSound().then((ok) => {
    if (!ok) {
      // Autoplay with sound got blocked – show the overlay button
      const btn = ensurePlayButton();
      btn.style.display = "block";

      btn.addEventListener(
        "click",
        async () => {
          const success = await tryPlayWithSound();
          if (success) btn.style.display = "none";
        },
        { once: true }
      );
    }
  });

  // Back button
  backBtn?.addEventListener("click", () => {
    window.location.href = "./ask.html";
  });

  // Debug helper (optional): log which file is being used
  console.log("no.js: playing", src);
})();
