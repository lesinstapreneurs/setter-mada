// ─────────────────────────────────────────────────────────────────────────
// Webhooks entrants : System.io (tags) et Calendly (réservations).
// Contrainte : répondre < 500 ms → on répond 200 immédiatement,
// le traitement Notion se fait en asynchrone derrière.
// ─────────────────────────────────────────────────────────────────────────
const express = require('express');
const crypto = require('crypto');
const { matchTag } = require('../config');
const notion = require('../services/notion');
const nocrm = require('../services/nocrm');

const router = express.Router();

// ── POST /webhook/sio-tag ────────────────────────────────────────────────
router.post('/sio-tag', (req, res) => {
  res.status(200).json({ ok: true }); // réponse immédiate à System.io
  processSioTag(req.body || {}).catch((e) =>
    console.error('Webhook SIO :', e.message)
  );
});

async function processSioTag(body) {
  // SIO envoie le tag dans tag.* ou data.tag.* selon la version → fallback
  const tag = body.tag || body.data?.tag || {};
  const contact = body.contact || body.data?.contact || {};
  const kind = matchTag(tag);

  if (!kind) {
    return console.log(`↩️ Tag SIO ignoré : "${String(tag.name || '?').trim()}" (id ${tag.id || '?'})`);
  }
  if (!notion.isReady()) {
    return console.warn('⚠️ Webhook SIO reçu mais Notion non configuré — ignoré');
  }

  const email = String(contact.email || '').trim();
  console.log(`📨 Webhook SIO : tag "${String(tag.name || '').trim()}" → flux ${kind} (${email || 'sans email'})`);

  if (kind === 'resa') {
    // Le lead a réservé directement via Calendly → on archive sa fiche setter
    if (email) await notion.archiveSetterLead(email);
    return;
  }
  await notion.upsertWebiLead(contact, kind);
}

// ── POST /webhook/calendly ───────────────────────────────────────────────
router.post('/calendly', (req, res) => {
  if (!verifyCalendlySignature(req)) {
    console.warn('⚠️ Webhook Calendly : signature invalide — rejeté');
    return res.status(401).json({ error: 'invalid signature' });
  }
  res.status(200).json({ ok: true });
  processCalendly(req.body || {}).catch((e) =>
    console.error('Webhook Calendly :', e.message)
  );
});

function verifyCalendlySignature(req) {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('⚠️ CALENDLY_WEBHOOK_SECRET non défini — signature non vérifiée');
    return true;
  }
  const header = req.get('Calendly-Webhook-Signature') || '';
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
  );
  if (!parts.t || !parts.v1 || !req.rawBody) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${parts.t}.${req.rawBody}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

async function processCalendly(body) {
  if (!notion.isReady()) {
    return console.warn('⚠️ Webhook Calendly reçu mais Notion non configuré — ignoré');
  }
  // Structures possibles selon la version de l'API Calendly → fallbacks
  const p = body.payload || body;
  const email =
    p.email || p.invitee?.email || body.invitee?.email || '';
  const dateRdv =
    p.scheduled_event?.start_time ||
    p.event?.start_time ||
    body.event?.start_time ||
    '';

  if (!email) return console.warn('⚠️ Webhook Calendly sans email invitee — ignoré');
  console.log(`📅 Webhook Calendly : ${email} → RDV ${dateRdv || 'sans date'}`);
  const lead = await notion.markBookedByEmail(email.trim(), dateRdv || null);
  // Création du lead noCRM avec le récap + notes (best-effort)
  if (lead) nocrm.pushBooking(lead, dateRdv || null).catch((e) => console.error('⚠️ noCRM (calendly) :', e.message));
}

module.exports = router;
