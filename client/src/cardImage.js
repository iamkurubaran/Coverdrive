// Hand-rolled canvas renderer — turns a card payload into a shareable PNG.
// No DOM-capture libraries: we draw the shield directly, so exports are
// pixel-perfect on every device. Used by Download / Copy image / Story format.

import { avatarProxyUrl } from "./api";

const DISPLAY = '"Saira Condensed", "Arial Narrow", sans-serif';
const BODY = '"Inter", system-ui, sans-serif';

async function ensureFonts() {
  if (!document.fonts?.load) return;
  await Promise.allSettled([
    document.fonts.load(`700 100px ${DISPLAY}`),
    document.fonts.load(`600 40px ${DISPLAY}`),
    document.fonts.load(`400 24px ${BODY}`),
  ]);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Shield outline in fractional coordinates, scaled to (w, h) at (x, y).
function shieldPath(ctx, x, y, w, h) {
  const X = (fx) => x + fx * w;
  const Y = (fy) => y + fy * h;
  ctx.beginPath();
  ctx.moveTo(X(0.5), Y(0.955));
  ctx.quadraticCurveTo(X(0.2), Y(0.905), X(0.135), Y(0.78));
  ctx.bezierCurveTo(X(0.075), Y(0.6), X(0.075), Y(0.3), X(0.095), Y(0.085));
  ctx.lineTo(X(0.42), Y(0.085));
  ctx.bezierCurveTo(X(0.455), Y(0.085), X(0.46), Y(0.125), X(0.5), Y(0.125));
  ctx.bezierCurveTo(X(0.54), Y(0.125), X(0.545), Y(0.085), X(0.58), Y(0.085));
  ctx.lineTo(X(0.905), Y(0.085));
  ctx.bezierCurveTo(X(0.925), Y(0.3), X(0.925), Y(0.6), X(0.865), Y(0.78));
  ctx.quadraticCurveTo(X(0.8), Y(0.905), X(0.5), Y(0.955));
  ctx.closePath();
}

function drawShieldCard(ctx, card, avatar, x, y, w) {
  const h = w * 1.42;
  const X = (fx) => x + fx * w;
  const Y = (fy) => y + fy * h;

  // Outer glow
  ctx.save();
  ctx.shadowColor = card.tier.glow;
  ctx.shadowBlur = w * 0.09;
  shieldPath(ctx, x, y, w, h);
  ctx.fillStyle = "#0d0e11";
  ctx.fill();
  ctx.restore();

  // Cream face
  const face = ctx.createLinearGradient(x, y, x, y + h);
  face.addColorStop(0, "#f7f1e2");
  face.addColorStop(0.55, "#efe6cf");
  face.addColorStop(1, "#e3d5b4");
  shieldPath(ctx, x, y, w, h);
  ctx.fillStyle = face;
  ctx.fill();

  // Accent border
  shieldPath(ctx, x, y, w, h);
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.strokeStyle = card.tier.accent;
  ctx.stroke();

  const ink = "#5a4a1f";
  const inkSoft = "#8a7a4a";

  // Crest
  ctx.fillStyle = card.tier.accent;
  ctx.font = `600 ${w * 0.038}px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.fillText("★ ★ ★", X(0.5), Y(0.175));

  // Avatar (circular, upper-right of the id column)
  const ar = w * 0.24;
  const acx = X(0.62);
  const acy = Y(0.33);
  ctx.save();
  ctx.beginPath();
  ctx.arc(acx, acy, ar, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, acx - ar, acy - ar, ar * 2, ar * 2);
  } else {
    ctx.fillStyle = "#cbbd97";
    ctx.fillRect(acx - ar, acy - ar, ar * 2, ar * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(acx, acy, ar, 0, Math.PI * 2);
  ctx.lineWidth = w * 0.006;
  ctx.strokeStyle = card.tier.accent;
  ctx.stroke();

  // Rating / role / flag / language column
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.font = `700 ${w * 0.17}px ${DISPLAY}`;
  ctx.fillText(String(card.overall), X(0.16), Y(0.28));
  ctx.font = `600 ${w * 0.058}px ${DISPLAY}`;
  ctx.fillText(card.role.abbr, X(0.165), Y(0.335));
  ctx.font = `${w * 0.06}px ${BODY}`;
  ctx.fillText(card.country?.flag || "🌍", X(0.16), Y(0.41));
  ctx.font = `600 ${w * 0.036}px ${DISPLAY}`;
  ctx.fillStyle = inkSoft;
  ctx.fillText(card.topLanguage.toUpperCase(), X(0.16), Y(0.462));

  // Surname
  const surname = card.name.trim().split(/\s+/).slice(-1)[0].toUpperCase();
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = `700 ${w * 0.095}px ${DISPLAY}`;
  ctx.fillText(surname, X(0.5), Y(0.575), w * 0.72);

  // Rule
  ctx.strokeStyle = "rgba(90,74,31,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(0.22), Y(0.605));
  ctx.lineTo(X(0.78), Y(0.605));
  ctx.stroke();

  // Attributes — two columns of three
  const left = ["BAT", "BWL", "FLD"];
  const right = ["TEC", "EXP", "STA"];
  const rowH = h * 0.062;
  const startY = Y(0.675);

  function drawCol(keys, numX, keyX) {
    keys.forEach((k, i) => {
      const yy = startY + i * rowH;
      ctx.textAlign = "right";
      ctx.fillStyle = ink;
      ctx.font = `700 ${w * 0.058}px ${DISPLAY}`;
      ctx.fillText(String(card.attributes[k]), X(numX), yy);
      ctx.textAlign = "left";
      ctx.fillStyle = inkSoft;
      ctx.font = `600 ${w * 0.046}px ${DISPLAY}`;
      ctx.fillText(k, X(keyX), yy);
    });
  }
  drawCol(left, 0.33, 0.36);
  drawCol(right, 0.68, 0.71);

  // Column divider
  ctx.strokeStyle = "rgba(90,74,31,0.3)";
  ctx.beginPath();
  ctx.moveTo(X(0.5), startY - rowH * 0.7);
  ctx.lineTo(X(0.5), startY + rowH * 2.2);
  ctx.stroke();

  // Footer: tier · format
  ctx.textAlign = "center";
  ctx.fillStyle = inkSoft;
  ctx.font = `600 ${w * 0.034}px ${DISPLAY}`;
  ctx.fillText(`${card.tier.name}  ·  ${card.format}`, X(0.5), Y(0.9));
}

function drawBackground(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#0b0d10");
  bg.addColorStop(1, "#06070a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft stadium glow behind center
  const glow = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.7);
  glow.addColorStop(0, "rgba(232,199,102,0.14)");
  glow.addColorStop(1, "rgba(232,199,102,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Pitch crease lines at the bottom
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  [0.9, 0.94].forEach((fy) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * fy);
    ctx.lineTo(w * 0.9, h * fy);
    ctx.stroke();
  });
}

function drawStripe(ctx, x, y, w, h) {
  const seg = w / 3;
  ctx.fillStyle = "#1e7a46"; // pitch green
  ctx.fillRect(x, y, seg, h);
  ctx.fillStyle = "#e8c766"; // gold
  ctx.fillRect(x + seg, y, seg, h);
  ctx.fillStyle = "#c8102e"; // ball red
  ctx.fillRect(x + seg * 2, y, seg, h);
}

export async function renderCardBlob(card, { story = false } = {}) {
  await ensureFonts();

  let avatar = null;
  try {
    avatar = await loadImage(avatarProxyUrl(card.avatar));
  } catch {
    try {
      avatar = await loadImage(card.avatar);
    } catch {
      avatar = null;
    }
  }

  const canvas = document.createElement("canvas");
  const W = story ? 1080 : 1000;
  const H = story ? 1920 : 1220;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  drawBackground(ctx, W, H);

  // Wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = "#f3ede0";
  ctx.font = `700 ${story ? 76 : 54}px ${DISPLAY}`;
  ctx.fillText("COVERDRIVE", W / 2, story ? 190 : 110);
  drawStripe(ctx, W / 2 - 90, story ? 214 : 128, 180, 5);

  // Card
  const cardW = story ? 700 : 620;
  drawShieldCard(
    ctx,
    card,
    avatar,
    (W - cardW) / 2,
    story ? 330 : 190,
    cardW
  );

  // Footer line
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(243,237,224,0.55)";
  ctx.font = `400 ${story ? 30 : 24}px ${BODY}`;
  ctx.fillText(
    `@${card.username} — rated ${card.overall} · ${card.tier.name}`,
    W / 2,
    story ? H - 160 : H - 60
  );
  if (story) {
    ctx.fillStyle = "rgba(243,237,224,0.35)";
    ctx.font = `400 26px ${BODY}`;
    ctx.fillText("your GitHub, rated for the World XI", W / 2, H - 110);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
