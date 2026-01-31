// cute floating hearts everywhere
const heartsLayer = document.querySelector(".hearts-layer");

// function spawnHeart() {
//   if (!heartsLayer) return;

//   const el = document.createElement("div");
//   el.className = "heart";
//   const hearts = ["💗","💖","💘","💕","💞","🌸","✨","💓"];
//   el.textContent = hearts[Math.floor(Math.random() * hearts.length)];

//   const left = Math.random() * 100;
//   const size = 16 + Math.random() * 22;
//   const duration = 5 + Math.random() * 5;

//   el.style.left = `${left}vw`;
//   el.style.bottom = `-20px`;
//   el.style.fontSize = `${size}px`;
//   el.style.animationDuration = `${duration}s`;

//   heartsLayer.appendChild(el);
//   setTimeout(() => el.remove(), duration * 1000);
// }

// setInterval(spawnHeart, 350);

const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    window.location.href = "./ask.html";
  });
}
