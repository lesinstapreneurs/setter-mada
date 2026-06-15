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

// Point de départ par défaut : on ne charge que les inscrits depuis cette date.
// Demandé par le client : « on part du 1er juin ». Surchargé par SYSTEMEIO_SYNC_SINCE.
const DEFAULT_SINCE = '2026-06-01';

// Détermine le « registeredAfter » envoyé à System.io :
//   • windowDays explicite (ex: aperçu ?days=7) → fenêtre glissante, prioritaire
//   • sinon date fixe SYSTEMEIO_SYNC_SINCE / DEFAULT_SINCE (« depuis le 1er juin »)
function resolveRegisteredAfter({ since, windowDays } = {}) {
  if (windowDays) return cutoffISO(Number(windowDays));
  const fixed = String(since || process.env.SYSTEMEIO_SYNC_SINCE || DEFAULT_SINCE).trim();
  const iso = fixed.length <= 10 ? `${fixed}T00:00:00.000Z` : fixed;
  const d = new Date(iso);
  if (!isNaN(d.getTime())) return d.toISOString();
  return cutoffISO(Number(process.env.SYSTEMEIO_SYNC_WINDOW_DAYS || 14));
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
async function syncOnce({ since, windowDays, dryRun = false } = {}) {
  if (!systemeio.isReady()) throw new Error('System.io non configuré (SYSTEMEIO_MCP_KEY manquant)');
  if (!notion.isReady()) throw new Error('Notion non configuré (NOTION_TOKEN / base manquants)');

  const registeredAfter = resolveRegisteredAfter({ since, windowDays });

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
    since: registeredAfter.slice(0, 10),
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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let okUpserts = 0, okArchives = 0, errors = 0;
  for (const a of actions) {
    try {
      if (a.kind === 'resa') { await notion.archiveSetterLead(a.email); okArchives++; }
      else { await notion.upsertWebiLead(normalize(a.contact), a.kind); okUpserts++; }
    } catch (e) {
      errors++;
      console.error(`⚠️ Sync ${a.kind} ${a.email} : ${e.message}`);
    }
    await sleep(120); // throttle léger : ménage l'API Notion, garde le frontend réactif
  }
  summary.applied = { upserts: okUpserts, archives: okArchives, errors };
  console.log(
    `🔄 Sync System.io→Notion : ${okUpserts} upserts, ${okArchives} archives` +
    (errors ? `, ${errors} erreurs` : '') + ` (depuis ${registeredAfter.slice(0, 10)})`
  );
  return summary;
}

// Millisecondes jusqu'au prochain HH:00 heure de Paris (gère l'heure d'été
// via Intl/timeZone, sans dépendance). Ré-évalué après chaque passe.
function msUntilNextParisHour(hour) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date()).reduce((a, p) => ((a[p.type] = p.value), a), {});
  const nowSecs = +parts.hour * 3600 + +parts.minute * 60 + +parts.second;
  let secs = hour * 3600 - nowSecs;
  if (secs <= 0) secs += 24 * 3600;
  return secs * 1000;
}

// Programme la synchro : une passe peu après le démarrage (peuple la file tout
// de suite) puis tous les jours à SYSTEMEIO_SYNC_HOUR h (défaut 6) heure de Paris.
// Active par défaut dès que la clé MCP est présente ; coupée si
// SYSTEMEIO_SYNC_ENABLED=false.
function startScheduler() {
  if (String(process.env.SYSTEMEIO_SYNC_ENABLED).toLowerCase() === 'false') {
    console.log('⏸️  Synchro System.io→Notion désactivée (SYSTEMEIO_SYNC_ENABLED=false).');
    return null;
  }
  if (!systemeio.isReady()) {
    console.warn('⚠️ Synchro System.io→Notion inactive : SYSTEMEIO_MCP_KEY manquant.');
    return null;
  }
  const hour = Math.min(23, Math.max(0, Number(process.env.SYSTEMEIO_SYNC_HOUR ?? 6)));
  const run = (tag) => syncOnce({}).catch((e) => console.error(`Sync ${tag} :`, e.message));

  // 1) passe initiale 15 s après le boot
  setTimeout(() => run('initiale'), 15_000);

  // 2) puis chaque jour à HH:00 (Europe/Paris), ré-armé après chaque passe
  const arm = () => {
    const wait = msUntilNextParisHour(hour);
    console.log(
      `▶️  Synchro System.io→Notion : prochaine passe quotidienne dans ` +
      `~${Math.round(wait / 360000) / 10} h (${hour}h, Europe/Paris).`
    );
    setTimeout(async () => { await run('quotidienne'); arm(); }, wait);
  };
  arm();
  return true;
}

module.exports = { syncOnce, startScheduler };
