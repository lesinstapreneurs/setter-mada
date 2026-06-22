// ─────────────────────────────────────────────────────────────────────────
// API interne consommée par le frontend (public/app.js).
// ─────────────────────────────────────────────────────────────────────────
const express = require('express');
const notion = require('../services/notion');
const systemeio = require('../services/systemeio');
const onoff = require('../services/onoff');
const { syncOnce } = require('../services/syncSio');
const { SIO_TAG } = require('../config');

const router = express.Router();

// Statut setter → tag à poser dans System.io (sens Notion → System.io)
const STATUT_TO_SIO_TAG = {
  '🚫 Pas intéressé': SIO_TAG.PAS_INTERESSE,
  '❌ Injoignable': SIO_TAG.INJOIGNABLE,
  '🔄 À réinscrire': SIO_TAG.REINSCRIT,
};

// Pose un tag System.io sans bloquer ni faire échouer la requête (best-effort).
function tagSioAsync(email, tagId, label) {
  if (!tagId || !email || !systemeio.isReady()) return;
  systemeio
    .assignTag(email, tagId)
    .catch((e) => console.error(`⚠️ System.io (${label || 'tag'}) : ${e.message}`));
}

// Si Notion n'est pas configuré → 503, le frontend bascule en mode démo
router.use((req, res, next) => {
  if (!notion.isReady()) {
    return res.status(503).json({ error: 'Notion non configuré (NOTION_TOKEN / base setter manquants)' });
  }
  next();
});

// GET /api/leads — file d'appel (hors RDV bookés), présents d'abord puis score desc
router.get('/leads', async (req, res) => {
  try {
    res.json(await notion.getSetterLeads());
  } catch (e) {
    console.error('GET /api/leads :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/leads/:id — mise à jour d'une fiche pendant / après l'appel
router.patch('/leads/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const out = await notion.updateSetterLead(req.params.id, body);
    res.json({ success: true });
    // Répercussion System.io si le statut correspond à un tag (best-effort)
    const tagId = body.statut && STATUT_TO_SIO_TAG[body.statut];
    if (tagId && out?.email) tagSioAsync(out.email, tagId, body.statut);
  } catch (e) {
    console.error('PATCH /api/leads :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/leads/:id/book — RDV confirmé par la setter
router.post('/leads/:id/book', async (req, res) => {
  try {
    const dateRdv = req.body?.date_rdv;
    if (!dateRdv) return res.status(400).json({ error: 'date_rdv manquante' });
    const out = await notion.bookSetterLead(req.params.id, dateRdv);
    res.json({ success: true });
    // La setter a booké → tag « Résa call » dans System.io (best-effort)
    if (out?.email) tagSioAsync(out.email, SIO_TAG.RESA_CALL, 'Résa call');
  } catch (e) {
    console.error('POST /api/leads/book :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/leads/:id/reset — remet la fiche à zéro
router.post('/leads/:id/reset', async (req, res) => {
  try {
    const out = await notion.resetSetterLead(req.params.id);
    res.json({ success: true });
    // Retire aussi les tags posés par la setter dans System.io (best-effort)
    if (out?.email && systemeio.isReady()) {
      [SIO_TAG.PAS_INTERESSE, SIO_TAG.INJOIGNABLE, SIO_TAG.REINSCRIT, SIO_TAG.RESA_CALL].forEach(
        (tagId) => systemeio.removeTag(out.email, tagId).catch((e) =>
          console.error(`⚠️ System.io reset tag ${tagId} : ${e.message}`))
      );
    }
  } catch (e) {
    console.error('POST /api/leads/reset :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats — dashboard
router.get('/stats', async (req, res) => {
  try {
    res.json(await notion.getStats());
  } catch (e) {
    console.error('GET /api/stats :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/onoff-stats — vraies stats d'appels (Onoff). 404 si non configuré.
router.get('/onoff-stats', async (req, res) => {
  if (!onoff.isReady()) return res.status(404).json({ error: 'Onoff non configuré (ONOFF_API_KEY manquant)' });
  try {
    const days = req.query.days ? Number(req.query.days) : 14;
    res.json(await onoff.callStats({ days }));
  } catch (e) {
    console.error('GET /api/onoff-stats :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Synchro System.io → Notion (manuelle) ─────────────────────────────────
// GET  /api/sync/preview  → aperçu (dry-run, n'écrit RIEN)
// POST /api/sync/run      → exécute la synchro pour de vrai
function ensureSioReady(req, res, next) {
  if (!systemeio.isReady()) {
    return res.status(503).json({ error: 'System.io non configuré (SYSTEMEIO_MCP_KEY manquant)' });
  }
  next();
}

router.get('/sync/preview', ensureSioReady, async (req, res) => {
  try {
    const windowDays = req.query.days ? Number(req.query.days) : undefined;
    res.json(await syncOnce({ windowDays, since: req.query.since, until: req.query.until, dryRun: true }));
  } catch (e) {
    console.error('GET /api/sync/preview :', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync/run', ensureSioReady, async (req, res) => {
  try {
    const windowDays = req.body?.days ? Number(req.body.days) : undefined;
    res.json(await syncOnce({ windowDays, since: req.body?.since, until: req.body?.until, dryRun: false }));
  } catch (e) {
    console.error('POST /api/sync/run :', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/archive — archive tout le lot actif (sort de la file, gardé en archive)
router.post('/archive', async (req, res) => {
  try {
    const n = await notion.archiveActiveCohort();
    res.json({ success: true, archived: n });
  } catch (e) {
    console.error('POST /api/archive :', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
