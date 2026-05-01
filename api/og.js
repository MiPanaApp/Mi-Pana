import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// Detectar bots por User Agent O por ausencia de cabeceras de navegador real
const BOT_AGENTS = [
  "whatsapp", "telegrambot", "facebookexternalhit",
  "twitterbot", "linkedinbot", "slackbot", "discordbot",
  "googlebot", "bingbot", "opengraph", "preview", "crawler",
  "spider", "bot", "curl", "python", "axios", "fetch"
];

function isBot(userAgent = "") {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

export default async function handler(req, res) {
  const userAgent = req.headers["user-agent"] || "";
  const { id } = req.query;

  if (!isBot(userAgent) || !id) {
    return res.redirect(302, `/perfil-producto?id=${id || ""}`);
  }

  try {
    const snap = await db.collection("products").doc(id).get();

    if (!snap.exists) {
      return res.redirect(302, "/");
    }

    const product = snap.data();

    const title = product.title || "Producto en Mi Pana";
    const description = product.description
      ? product.description.slice(0, 120) + (product.description.length > 120 ? "..." : "")
      : "Encuentra servicios y productos de la comunidad venezolana.";
    const price = product.price ? `${product.price}€` : "";
    const location = product.location?.municipality || product.location?.level2 || product.location?.level1 || "";
    const image = (product.images && product.images[0]) || "https://mipana.net/og-image.png";
    const url = `https://mipana.net/perfil-producto?id=${id}`;
    const fullDescription = [price, location, description].filter(Boolean).join(" · ");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta property="og:type" content="product" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Mi Pana" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${fullDescription}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${fullDescription}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <a href="${url}">Ver producto en Mi Pana</a>
</body>
</html>`;

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);

  } catch (err) {
    console.error("OG handler error:", err);
    return res.redirect(302, "/");
  }
}
