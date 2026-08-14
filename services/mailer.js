// ─────────────────────────────────────────────────────────────────────────
// Envoi d'emails depuis la boîte Gmail des Instapreneurs (SMTP + mot de
// passe d'application). Utilisé pour envoyer le replay au prospect depuis
// la fiche : la setter valide/édite le message avant envoi, la signature
// « Sylvie — Les Instapreneurs » est ajoutée ici (toujours identique).
// Config Railway : GMAIL_USER, GMAIL_APP_PASSWORD.
// ─────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');
const dns = require('dns');

// Railway (et d'autres hébergeurs) n'ont pas d'IPv6 sortant : si Node résout
// smtp.gmail.com en IPv6 d'abord, la connexion pend → timeout. On force l'IPv4.
try { dns.setDefaultResultOrder('ipv4first'); } catch { /* vieux Node */ }

const user = () => (process.env.GMAIL_USER || '').trim();
const pass = () => (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''); // Google affiche le code avec des espaces

// Relais Apps Script (HTTPS) — utilisé en priorité : Railway bloque le SMTP
// sortant, donc on passe par un mini web-app Google Apps Script déployé sur le
// compte Gmail des Instapreneurs (GmailApp.sendEmail = part de la vraie boîte).
const webappUrl = () => (process.env.MAIL_WEBAPP_URL || '').trim();
const webappSecret = () => (process.env.MAIL_WEBAPP_SECRET || '').trim();

const isReady = () => Boolean(webappUrl() && webappSecret()) || Boolean(user() && pass());

async function makeTransport(port) {
  // Résolution IPv4 explicite : ipv4first ne suffit pas partout, on se
  // connecte directement à l'adresse A de smtp.gmail.com. Le certificat TLS
  // reste validé sur le nom via tls.servername (SNI).
  let host = 'smtp.gmail.com';
  try {
    const ips = await dns.promises.resolve4('smtp.gmail.com');
    if (ips.length) host = ips[0];
  } catch { /* on retombe sur le nom d'hôte */ }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,            // 465 = TLS direct ; 587 = STARTTLS
    requireTLS: true,
    auth: { user: user(), pass: pass() },
    tls: { servername: 'smtp.gmail.com' },
    // Timeouts courts : si l'hébergeur bloque le SMTP sortant, on veut une
    // erreur claire en quelques secondes, pas une requête qui pend.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

// Envoie via 465, et retente automatiquement en 587 si la connexion échoue
// (certains réseaux ne laissent passer qu'un des deux ports).
async function smtpSend(message) {
  const ports = process.env.SMTP_PORT ? [Number(process.env.SMTP_PORT)] : [465, 587];
  let lastErr;
  for (const port of ports) {
    try {
      return await (await makeTransport(port)).sendMail(message);
    } catch (e) {
      lastErr = e;
      const connIssue = /timeout|ECONN|ETIMEDOUT|ESOCKET|EDNS/i.test(String(e.code || e.message));
      console.error(`⚠️ SMTP port ${port} : ${e.message}`);
      if (!connIssue) break; // erreur d'authentification & co → inutile d'essayer l'autre port
    }
  }
  throw lastErr;
}

// Signature ajoutée à la fin de chaque email (non éditable côté setter).
const SIGNATURE_HTML =
  '<div style="margin-top:24px;padding-top:14px;border-top:2px solid #84cc16;font-family:Arial,Helvetica,sans-serif">' +
  '<div style="font-size:15px;font-weight:bold;color:#23271c">Sylvie</div>' +
  '<div style="font-size:13px;color:#4d7c0f;font-weight:bold">Les Instapreneurs</div>' +
  '<div style="font-size:12px;color:#6b7160">Organisme de formation certifié Qualiopi</div>' +
  '<div style="font-size:12px;margin-top:4px"><a href="https://les-instapreneurs.com" style="color:#4d7c0f">les-instapreneurs.com</a></div>' +
  '</div>';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Corps texte (éditée par la setter) → HTML simple : liens cliquables + <br>
function bodyToHtml(text) {
  const withLinks = esc(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#4d7c0f">$1</a>'
  );
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#23271c;line-height:1.6">${withLinks.replace(/\n/g, '<br>')}</div>`;
}

// Envoi via un relais HTTPS (port 443 — jamais bloqué) : webhook Make branché
// sur le module Gmail des Instapreneurs (ou web-app Apps Script équivalente).
// Make répond « Accepted » en texte brut ; Apps Script répond du JSON.
async function webappSend({ to, subject, text, html }) {
  const res = await fetch(webappUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: webappSecret(), to, subject, text, html }),
    redirect: 'follow',
  });
  const raw = await res.text();
  let out = {};
  try { out = JSON.parse(raw); } catch { /* réponse non-JSON (Make → « Accepted ») */ }
  const okText = /^(accepted|ok|queued)?$/i.test(raw.trim()) || /accepted/i.test(raw.slice(0, 40));
  if (!res.ok || out.error || (!out.success && !okText)) {
    throw new Error(out.error || `Relais Gmail → HTTP ${res.status} : ${raw.slice(0, 120)}`);
  }
  return { messageId: out.id || 'relais-gmail' };
}

/**
 * Envoie un email signé Sylvie. `body` = texte tel que validé par la setter
 * (la signature est ajoutée automatiquement, ne pas l'inclure).
 */
async function sendAsSylvie({ to, subject, body }) {
  if (!isReady()) throw new Error('Email non configuré (MAIL_WEBAPP_URL / MAIL_WEBAPP_SECRET manquants sur Railway)');
  const dest = String(to || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest)) throw new Error(`Destinataire invalide : « ${dest} »`);
  if (!String(subject || '').trim()) throw new Error('Objet manquant');
  if (!String(body || '').trim()) throw new Error('Message vide');

  const message = {
    to: dest,
    subject: String(subject).trim(),
    text: `${body}\n\n--\nSylvie\nLes Instapreneurs — Organisme de formation certifié Qualiopi\nhttps://les-instapreneurs.com`,
    html: bodyToHtml(body) + SIGNATURE_HTML,
  };

  const info = webappUrl() && webappSecret()
    ? await webappSend(message)
    : await smtpSend({ ...message, from: { name: 'Sylvie — Les Instapreneurs', address: user() } });
  console.log(`✉️  Email envoyé à ${dest} (${info.messageId})`);
  return { messageId: info.messageId };
}

module.exports = { isReady, sendAsSylvie };
