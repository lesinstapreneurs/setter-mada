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
// Reproduit la signature officielle : logo | barre orange | « Sylvie des
// instapreneurs » + icônes réseaux. HTML « email-safe » (tableaux + inline).
const SIG_ORANGE = '#EE7A1F';
const sigIcon = (href, bg, label, fs = 12) =>
  `<td style="padding-right:7px"><a href="${href}" style="display:inline-block;width:26px;height:26px;` +
  `background:${bg};border-radius:6px;text-align:center;line-height:26px;color:#ffffff;` +
  `font-size:${fs}px;font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif">${label}</a></td>`;

const SIGNATURE_HTML =
  '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;font-family:Arial,Helvetica,sans-serif">' +
  '<tr>' +
  '<td style="padding-right:20px;vertical-align:middle">' +
  '<a href="https://les-instapreneurs.com" style="text-decoration:none">' +
  '<img src="https://les-instapreneurs.com/wp-content/uploads/2022/05/logo_instapreneurs.png" ' +
  'alt="Les Instapreneurs" width="150" style="display:block;border:0;max-width:150px"></a>' +
  '</td>' +
  `<td style="border-left:3px solid ${SIG_ORANGE};padding-left:20px;vertical-align:middle">` +
  `<div style="font-size:17px;color:#111111"><span style="color:${SIG_ORANGE};font-weight:bold">Sylvie</span> des instapreneurs</div>` +
  '<div style="font-size:11px;color:#8a8f84;margin:3px 0 9px">Organisme de formation certifié Qualiopi</div>' +
  '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
  sigIcon('mailto:contact@instapreneurpro.fr', '#E8590C', '✉', 14) +
  sigIcon('https://www.facebook.com/groups/devenir.instapreneur', '#3b5093', 'fb') +
  sigIcon('https://www.instagram.com/lesinstapreneurs', '#C13584', 'ig') +
  sigIcon('https://www.youtube.com/c/lesinstapreneurs', '#CC2B1D', 'yt') +
  '</tr></table>' +
  '</td>' +
  '</tr>' +
  '</table>';

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
    text: `${body}\n\n--\nSylvie des instapreneurs\nOrganisme de formation certifié Qualiopi\nhttps://les-instapreneurs.com · Instagram : @lesinstapreneurs`,
    html: bodyToHtml(body) + SIGNATURE_HTML,
  };

  const info = webappUrl() && webappSecret()
    ? await webappSend(message)
    : await smtpSend({ ...message, from: { name: 'Sylvie — Les Instapreneurs', address: user() } });
  console.log(`✉️  Email envoyé à ${dest} (${info.messageId})`);
  return { messageId: info.messageId };
}

module.exports = { isReady, sendAsSylvie };
