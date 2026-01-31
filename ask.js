const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const askBody = document.getElementById("askBody");
const gifStage = document.getElementById("gifStage");
const noCounterText = document.getElementById("noCounterText");

let noCount = 0;

// Sad GIF list (direct .gif links). Replace/add your own anytime.
// Sources are from GIPHY pages. :contentReference[oaicite:3]{index=3}
const sadGifs = [
  "https://media.giphy.com/media/2WGS5O3MWpbzw1ItWu/giphy.gif", // sad black & white flower crying
  "https://media.giphy.com/media/W3ZSOeALmMMPJfLDCW/giphy.gif", // digitalnoir crying mirror
  "https://media.giphy.com/media/26ufcMjwXjpTHNG1i/giphy.gif", // (swap this if you want; currently happy-ish)
  "https://media.giphy.com/media/26ufcMjwXjpTHNG1i/giphy.gif"
];

// If you want ALL sad, replace the last two with other GIPHY sad GIF IDs you like.
function spawnSadGif() {
  if (!gifStage) return;

  const url = sadGifs[noCount % sadGifs.length];

  const wrap = document.createElement("div");
  wrap.className = "sad-pop";

  // random position
  const x = 8 + Math.random() * 70; // vw
  const y = 10 + Math.random() * 65; // vh
  const rot = (-8 + Math.random() * 16).toFixed(1) + "deg";

  wrap.style.left = `${x}vw`;
  wrap.style.top = `${y}vh`;
  wrap.style.setProperty("--rot", rot);

  const img = document.createElement("img");
  img.src = url;
  img.alt = "sad gif";

  wrap.appendChild(img);
  gifStage.appendChild(wrap);
}

yesBtn?.addEventListener("click", () => {
  window.location.href = "./yes.html";
});


noBtn?.addEventListener("click", () => {
  window.location.href = "./no.html";
});

