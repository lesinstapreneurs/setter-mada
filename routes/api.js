// ─────────────────────────────────────────────────────────────────────────
// API interne consommée par le frontend (public/app.js).
// ─────────────────────────────────────────────────────────────────────────
const express = require('express');
const notion = require('../services/notion');

const router = express.Router();

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
    await notion.updateSetterLead(req.params.id, req.body || {});
    res.json({ success: true });
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
    await notion.bookSetterLead(req.params.id, dateRdv);
    res.json({ success: true });
  } catch (e) {
    console.error('POST /api/leads/book :', e.message);
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

module.exports = router;
