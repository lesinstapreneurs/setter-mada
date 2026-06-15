// ─────────────────────────────────────────────────────────────────────────
// Synchro ENTRANTE System.io → Notion (sens « les tags alimentent la file »).
//
// Au lieu de dépendre des webhooks System.io (qui demandent une config dans
// l'UI System.io), on interroge périodiquement le MCP System.io :
//   • contacts tagués « Présent Webi »  → upsert dans Notion (✅ Présent)
//   • contacts tagués « Absent Webi »   → upsert dans Notion (❌ Absent)
//   • contacts tagués « Résa call »     → archivés (sortent de la file)
//
// On ne tire que les inscrits récents (registeredAfter = aujourd'hui - N jours)
// pour ne pas réimporter tout l'historique. N = SYSTEMEIO_SYNC_WINDOW_DAYS.
//
// upsertWebiLead / archiveSetterLead sont idempotents (matching par email) :
// relancer la synchro ne crée jamais de doublon.
// ─────────────────────────────────────────────────────────────────────────
const { TAGS_PRESENT_WEBI, TAGS_ABSENT_WEBI, TAGS_RESA_CALL } = require('../config');
const systemeio = require('./systemeio');
const notion = require('./notion');

function cutoffISO(days) {
  return new Date(Date.now() - Number(days) * 86_400_000).toISOString();
}

// Contact MCP System.io → forme attendue par notion.upsertWebiLead
function normalize(c) {
  return {
    email: c.email,
    first_name: systemeio.field(c, 'first_name'),
    last_name: systemeio.field(c, 'surname'),
    phone: systemeio.field(c, 'phone_number'),
  };
}

// Rassemble (dédupliqués par email) les contacts portant l'un des tags listés
async function collect(tagList, registeredAfter) {
  const map = new Map();
  for (const tag of tagList) {
    const items = await systemeio.listContactsByTag(tag.id, { registeredAfter });
    for (const c of items) {
      if (c.email) map.set(c.email.toLowerCase(), c);
    }
  }
  return map;
}

/**
 * Exécute une passe de synchro.
 * @param {{windowDays?:number, dryRun?:boolean}} opts
 * @returns {Promise<object>} résumé chiffré (+ échantillon en dryRun)
 */
async function syncOnce({ windowDays, dryRun = false } = {}) {
  if (!systemeio.isReady()) throw new Error('System.io non configuré (SYSTEMEIO_MCP_KEY manquant)');
  if (!notion.isReady()) throw new Error('Notion non configuré (NOTION_TOKEN / base manquants)');

  const days = Number(windowDays || process.env.SYSTEMEIO_SYNC_WINDOW_DAYS || 14);
  const registeredAfter = cutoffISO(days);

  const [present, absent, resa] = await Promise.all([
    collect(TAGS_PRESENT_WEBI, registeredAfter),
    collect(TAGS_ABSENT_WEBI, registeredAfter),
    collect(TAGS_RESA_CALL, registeredAfter),
  ]);

  // Résa call = priorité (sort de la file) ; sinon présent > absent
  const actions = [];
  for (const [email] of resa) actions.push({ email, kind: 'resa' });
  for (const [email, c] of present) {
    if (!resa.has(email)) actions.push({ email, kind: 'present', contact: c });
  }
  for (const [email, c] of absent) {
    if (!resa.has(email) && !present.has(email)) actions.push({ email, kind: 'absent', contact: c });
  }

  const summary = {
    windowDays: days,
    registeredAfter,
    found: { present: present.size, absent: absent.size, resa: resa.size },
    upserts: actions.filter((a) => a.kind !== 'resa').length,
    archives: actions.filter((a) => a.kind === 'resa').length,
    dryRun,
  };

  if (dryRun) {
    summary.sample = actions.slice(0, 12).map((a) => `${a.kind.padEnd(7)} ${a.email}`);
    return summary;
  }

  let okUpserts = 0, okArchives = 0, errors = 0;
  for (const a of actions) {
    try {
      if (a.kind === 'resa') { await notion.archiveSetterLead(a.email); okArchives++; }
      else { await notion.upsertWebiLead(normalize(a.contact), a.kind); okUpserts++; }
    } catch (e) {
      errors++;
      console.error(`⚠️ Sync ${a.kind} ${a.email} : ${e.message}`);
    }
  }
  summary.applied = { upserts: okUpserts, archives: okArchives, errors };
  console.log(
    `🔄 Sync System.io→Notion : ${okUpserts} upserts, ${okArchives} archives` +
    (errors ? `, ${errors} erreurs` : '') + ` (fenêtre ${days} j)`
  );
  return summary;
}

// Démarre la boucle périodique si SYSTEMEIO_SYNC_ENABLED=true. Sinon no-op.
function startScheduler() {
  if (String(process.env.SYSTEMEIO_SYNC_ENABLED).toLowerCase() !== 'true') {
    console.log('⏸️  Synchro System.io→Notion désactivée (SYSTEMEIO_SYNC_ENABLED ≠ true).');
    return null;
  }
  if (!systemeio.isReady()) {
    console.warn('⚠️ SYSTEMEIO_SYNC_ENABLED=true mais SYSTEMEIO_MCP_KEY manquant — synchro inactive.');
    return null;
  }
  const minutes = Math.max(2, Number(process.env.SYSTEMEIO_SYNC_INTERVAL_MIN || 10));
  console.log(`▶️  Synchro System.io→Notion active : toutes les ${minutes} min.`);
  const tick = () => syncOnce({}).catch((e) => console.error('Sync auto :', e.message));
  tick(); // une passe au démarrage
  return setInterval(tick, minutes * 60_000);
}

module.exports = { syncOnce, startScheduler };
