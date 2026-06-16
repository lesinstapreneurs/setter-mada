require('dotenv').config();
const express = require('express');
const path = require('path');
const { ensureSetterDatabase } = require('./services/notion');
const { startScheduler } = require('./services/syncSio');

const app = express();

// rawBody conservé pour la vérification de signature Calendly
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Fichiers statiques SANS cache navigateur : la setter a toujours la dernière
// version (HTML/JS/CSS revalidés à chaque chargement) — évite les « je vois
// encore l'ancienne version ».
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (/\.(html|js|css)$/.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
  },
}));

app.use('/webhook', require('./routes/webhooks'));
app.use('/api', require('./routes/api'));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

(async () => {
  if (process.env.NOTION_TOKEN) {
    try {
      const id = await ensureSetterDatabase();
      console.log(`📋 Base « Prospects webinaire » connectée : ${id}`);
    } catch (e) {
      console.error('⚠️ Init Notion :', e.message);
      console.error('   → Vérifie que la base est partagée avec l\'intégration. La synchro réessaiera à chaque passe.');
    }
    // Démarre la synchro même si la vérif initiale a échoué : chaque passe
    // revérifie l'accès à l'exécution (utile si le partage est corrigé après coup).
    startScheduler();
  } else {
    console.warn('⚠️ NOTION_TOKEN non défini — frontend en mode démo (copie .env.example vers .env).');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Setter app — Les Instapreneurs : http://localhost:${PORT}`);
  });
})();
