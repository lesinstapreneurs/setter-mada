// ─────────────────────────────────────────────────────────────────────────
// Service Notion — branché sur la base RÉELLE « 📢 Prospects webinaire »
// (CRM IPP). API REST Notion (fetch natif Node 18+), version 2022-06-28.
// On n'efface JAMAIS une page — archivage / statut uniquement.
//
// La base est alimentée automatiquement par System.io → Make. L'app setter
// ne fait que LIRE les prospects à appeler et ÉCRIRE les champs « setter ».
// ─────────────────────────────────────────────────────────────────────────
const { scoreChaleur } = require('./scoring');

const NOTION_API = 'https://api.notion.com/v1';

// Renseigné par ensureSetterDatabase() depuis NOTION_SETTER_DB_ID
let dbId = null;

// Noms EXACTS des propriétés de la base (accents compris)
const F = {
  nom: 'Nom',                       // title
  prenom: 'Prénom',                 // rich_text
  tel: 'Téléphone',                 // phone_number
  email: 'Email',                   // email
  presence: 'Présence webi',        // select : ✅ Présent / ❌ Absent / ⏳ À venir / ❓ Inconnu
  gisement: 'Gisement',             // select : 🔴 No-show / 🟠 Présent sans RDV / 🟢 A réservé un call
  niveau: 'Niveau IG déclaré',      // select
  objectif: 'Objectif déclaré',     // rich_text
  situation: 'Situation professionnelle', // rich_text
  instagram: 'Lien Instagram',      // url
  aReserve: 'A réservé un call',    // checkbox
  dateInscr: 'Date inscription webi', // date
  dateResa: 'Date réservation call',  // date
  tagSio: 'Tag SIO',                // rich_text
  // Champs « setter » ajoutés pour l'app
  statut: 'Statut setter',          // select
  noteWebi: 'Note webi /10',        // number
  financement: 'Financement détecté', // select
  notes: 'Notes setter',            // rich_text
  nbTent: 'Nb tentatives setter',   // number
  dateRappel: 'Date rappel',        // date
  manques: 'Manques webi',          // rich_text
  positifs: 'Points positifs',      // rich_text
  objection: 'Contenu réponse',     // rich_text : objection « pas intéressé »
};

// Téléphone exploitable ? (au moins 8 chiffres) — on n'appelle pas les contacts
// sans numéro ou au numéro manifestement erroné.
function validPhone(s) {
  return String(s || '').replace(/\D/g, '').length >= 8;
}

const ST_BOOKE = '✅ RDV booké';
const ST_APPELER = '📞 À appeler';
const ST_PAS_INT = '🚫 Pas intéressé';

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function notionFetch(path, method = 'GET', body, _retry = 0) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  // Rate limit (429) ou surcharge transitoire (502/503) → backoff puis retry.
  // Protège la synchro de masse ET les appels du frontend pendant la passe.
  if ((res.status === 429 || res.status === 502 || res.status === 503) && _retry < 5) {
    const ra = Number(res.headers.get('retry-after'));
    const waitMs = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 500 * 2 ** _retry;
    await sleep(waitMs + 100);
    return notionFetch(path, method, body, _retry + 1);
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Notion ${method} ${path} → ${res.status} : ${txt}`);
  }
  return res.json();
}

async function queryAll(body = {}) {
  const results = [];
  let cursor;
  do {
    const page = await notionFetch(`/databases/${dbId}/query`, 'POST', {
      ...body,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ── Lecture de propriétés ────────────────────────────────────────────────
const t = (p) => p?.title?.[0]?.plain_text || '';
const rt = (p) => (p?.rich_text || []).map((x) => x.plain_text).join('');
const sel = (p) => p?.select?.name || '';
const num = (p) => (p?.number ?? null);
const url = (p) => p?.url || '';
const mail = (p) => p?.email || '';
const phone = (p) => p?.phone_number || '';
const date = (p) => p?.date?.start || '';
const check = (p) => Boolean(p?.checkbox);

// ── Écriture de propriétés ───────────────────────────────────────────────
const wTitle = (s) => ({ title: [{ text: { content: String(s || '').slice(0, 200) } }] });
const wRt = (s) => ({ rich_text: s ? [{ text: { content: String(s).slice(0, 2000) } }] : [] });
const wSel = (s) => (s ? { select: { name: s } } : { select: null });
const wNum = (n) => ({ number: n === null || n === undefined || n === '' ? null : Number(n) });
const wDate = (d) => ({ date: d ? { start: d } : null });
const wCheck = (b) => ({ checkbox: Boolean(b) });

const today = () => new Date().toISOString().slice(0, 10);

// ── Initialisation : on utilise la base existante (pas de création) ──────
async function ensureSetterDatabase() {
  dbId = process.env.NOTION_SETTER_DB_ID;
  if (!dbId) {
    throw new Error(
      'NOTION_SETTER_DB_ID manquant — renseigne l\'ID de la base « Prospects webinaire » ' +
      '(23fb927e-d71f-467e-aa9b-07e6c97c7522).'
    );
  }
  // Vérifie l'accès en lisant le schéma (échoue tôt si le token n'a pas accès)
  await notionFetch(`/databases/${dbId}`);
  return dbId;
}

const isReady = () => Boolean(process.env.NOTION_TOKEN && dbId);

// ── Mapping page Notion → lead JSON pour le frontend ─────────────────────
function pageToLead(page) {
  const p = page.properties || {};
  const prenom = rt(p[F.prenom]) || t(p[F.nom]);
  const presence = sel(p[F.presence]);
  const webi = presence.includes('Présent') ? 'Présent' : presence.includes('Absent') ? 'Absent' : 'Présent';
  const dateInscr = date(p[F.dateInscr]) || (page.created_time || '').slice(0, 10);
  const gisement = sel(p[F.gisement]);
  const niveau = sel(p[F.niveau]);
  const situation = rt(p[F.situation]);
  const objectif = rt(p[F.objectif]);

  // Petit briefing synthétique (la base n'a pas de champ briefing dédié)
  const briefing = [
    gisement,
    niveau && `Niveau ${niveau}`,
    situation,
    objectif && `Objectif : ${objectif}`,
  ].filter(Boolean).join(' · ') || 'Prospect issu du webinaire.';

  return {
    id: page.id,
    nom: prenom || t(p[F.nom]),
    prenom,
    telephone: phone(p[F.tel]),
    email: mail(p[F.email]),
    statut: sel(p[F.statut]) || ST_APPELER,
    webi,
    score: scoreChaleur(dateInscr),
    niveau_ig: niveau,
    situation_pro: situation,
    objectif,
    lien_instagram: url(p[F.instagram]),
    briefing,
    nb_tentatives: num(p[F.nbTent]) || 0,
    date_ajout: dateInscr,
    date_rdv: date(p[F.dateRappel]) || date(p[F.dateResa]),
    note_webi: num(p[F.noteWebi]),
    financement: sel(p[F.financement]) || '',
    notes: rt(p[F.notes]),
    manques: rt(p[F.manques]),
    positifs: rt(p[F.positifs]),
    objection: rt(p[F.objection]),
    gisement,
    a_reserve: check(p[F.aReserve]),
    _edited: page.last_edited_time || '',
  };
}

async function findPageByEmail(email) {
  if (!email) return null;
  const r = await notionFetch(`/databases/${dbId}/query`, 'POST', {
    filter: { property: F.email, email: { equals: email } },
    page_size: 1,
  });
  return r.results[0] || null;
}

// ── API frontend ─────────────────────────────────────────────────────────
// Tous les présents/absents avec téléphone exploitable (tous statuts) — le
// frontend catégorise/filtre (À appeler / À rappeler / Booké / Perdu) et cherche.
async function getSetterLeads() {
  const pages = await queryAll({
    filter: {
      or: [
        { property: F.presence, select: { equals: '✅ Présent' } },
        { property: F.presence, select: { equals: '❌ Absent' } },
      ],
    },
  });
  const leads = pages.map(pageToLead).filter((l) => validPhone(l.telephone));
  // Présents d'abord, puis score décroissant
  leads.sort((a, b) =>
    a.webi === b.webi ? b.score - a.score : a.webi === 'Présent' ? -1 : 1
  );
  return leads;
}

// Renvoie { email } (depuis la réponse Notion) pour permettre au routeur de
// répercuter l'action côté System.io. Renvoie null si rien n'a été modifié.
async function updateSetterLead(pageId, body) {
  const props = {};
  if ('statut' in body) props[F.statut] = wSel(body.statut);
  if ('nb_tentatives' in body) props[F.nbTent] = wNum(body.nb_tentatives);
  if ('notes' in body) props[F.notes] = wRt(body.notes);
  if ('note_webi' in body) props[F.noteWebi] = wNum(body.note_webi);
  if ('manques_webi' in body) props[F.manques] = wRt(body.manques_webi);
  if ('points_positifs' in body) props[F.positifs] = wRt(body.points_positifs);
  if ('objection' in body) props[F.objection] = wRt(body.objection);
  if ('financement' in body) props[F.financement] = wSel(body.financement);
  if ('date_rdv' in body) props[F.dateRappel] = wDate(body.date_rdv);
  if ('situation_pro' in body) props[F.situation] = wRt(body.situation_pro);
  if ('objectif' in body) props[F.objectif] = wRt(body.objectif);
  if (!Object.keys(props).length) return null;
  const page = await notionFetch(`/pages/${pageId}`, 'PATCH', { properties: props });
  return { email: mail(page.properties?.[F.email]) };
}

// RDV confirmé par la setter → sort de la file (A réservé un call = ✔)
// Renvoie { email } pour poser le tag « Résa call » côté System.io.
async function bookSetterLead(pageId, dateRdv) {
  const page = await notionFetch(`/pages/${pageId}`, 'PATCH', {
    properties: {
      [F.statut]: wSel(ST_BOOKE),
      [F.aReserve]: wCheck(true),
      [F.gisement]: wSel('🟢 A réservé un call'),
      [F.dateResa]: wDate(dateRdv),
    },
  });
  return { email: mail(page.properties?.[F.email]) };
}

// Remet la fiche setter à zéro (repartir de zéro après avoir commencé à
// remplir) : statut → À appeler, tous les champs setter vidés. Renvoie { email }.
async function resetSetterLead(pageId) {
  const page = await notionFetch(`/pages/${pageId}`, 'PATCH', {
    properties: {
      [F.statut]: wSel(ST_APPELER),
      [F.aReserve]: wCheck(false),
      [F.notes]: wRt(''),
      [F.manques]: wRt(''),
      [F.positifs]: wRt(''),
      [F.objectif]: wRt(''),
      [F.objection]: wRt(''),
      [F.nbTent]: wNum(null),
      [F.dateRappel]: wDate(null),
      [F.dateResa]: wDate(null),
    },
  });
  return { email: mail(page.properties?.[F.email]) };
}

async function getStats() {
  const pages = await queryAll();
  const all = pages.map(pageToLead);
  // Toutes les stats sont calculées sur la population RÉELLEMENT APPELABLE
  // (téléphone valide) — cohérent avec la file affichée à la setter.
  const base = all.filter((l) => validPhone(l.telephone));
  // RDV booké RÉEL = uniquement setter (app) ou Calendly (plateforme) → statut booké.
  // Les « Résa call » System.io (a_reserve sans statut booké) ne comptent PAS.
  const estBooke = (l) => l.statut === ST_BOOKE;
  const horsFile = (l) => l.a_reserve || l.statut === ST_BOOKE || l.statut === ST_PAS_INT;
  const actifs = base.filter((l) => !horsFile(l));
  const bookes = base.filter(estBooke);
  const todayStr = today();

  const serie = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    serie.push({
      date: iso,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count: bookes.filter((l) => (l._edited || '').slice(0, 10) === iso).length,
    });
  }

  const scoreMoyen = actifs.length
    ? Math.round((actifs.reduce((s, l) => s + l.score, 0) / actifs.length) * 10) / 10
    : 0;

  return {
    total_leads: base.length,
    presents_webi: actifs.filter((l) => l.webi === 'Présent').length,
    absents_webi: actifs.filter((l) => l.webi === 'Absent').length,
    rdv_bookes: bookes.length,
    rdv_today: bookes.filter((l) => (l._edited || '').slice(0, 10) === todayStr).length,
    taux_conversion: base.length ? Math.round((bookes.length / base.length) * 1000) / 10 : 0,
    injoignables: base.filter((l) => l.statut === '❌ Injoignable').length,
    score_moyen: scoreMoyen,
    appels_today: base.filter(
      (l) => (l._edited || '').slice(0, 10) === todayStr && (l.nb_tentatives > 0 || estBooke(l))
    ).length,
    rdv_7_jours: serie,
  };
}

// ── Webhooks (filets de sécurité — Make alimente déjà la base) ───────────
// Tag présent/absent reçu : on s'assure que la fiche existe et reste à appeler
async function upsertWebiLead(sioContact, kind) {
  const email = String(sioContact.email || '').trim();
  if (!email) return;
  const presence = kind === 'present' ? '✅ Présent' : '❌ Absent';
  const existing = await findPageByEmail(email);
  if (existing) {
    if (sel(existing.properties?.[F.statut]) === ST_BOOKE) return;
    await notionFetch(`/pages/${existing.id}`, 'PATCH', {
      properties: { [F.presence]: wSel(presence) },
    });
  } else {
    const nom = [sioContact.first_name, sioContact.last_name].filter(Boolean).join(' ').trim() || email;
    await notionFetch('/pages', 'POST', {
      parent: { database_id: dbId },
      properties: {
        [F.nom]: wTitle(nom),
        [F.prenom]: wRt(sioContact.first_name || ''),
        [F.email]: { email },
        [F.tel]: { phone_number: sioContact.phone || null },
        [F.presence]: wSel(presence),
        [F.statut]: wSel(ST_APPELER),
        [F.dateInscr]: wDate(today()),
      },
    });
  }
}

// Tag « Résa call » venu de System.io : la résa a pu être déclenchée par un
// email/automation, PAS par la setter → on sort le lead de la file mais on ne
// le compte PAS comme RDV booké (statut inchangé). Seuls le booking in-app
// (bookSetterLead) et le webhook Calendly (markBookedByEmail) comptent.
async function archiveSetterLead(email) {
  const page = await findPageByEmail(email);
  if (!page) return;
  await notionFetch(`/pages/${page.id}`, 'PATCH', {
    properties: {
      [F.aReserve]: wCheck(true),
      [F.gisement]: wSel('🟢 A réservé un call'),
    },
  });
}

// Webhook Calendly : RDV pris → marquer booké
async function markBookedByEmail(email, dateRdv) {
  const page = await findPageByEmail(email);
  if (!page) return console.warn(`⚠️ Calendly : aucune fiche pour ${email}`);
  await notionFetch(`/pages/${page.id}`, 'PATCH', {
    properties: {
      [F.statut]: wSel(ST_BOOKE),
      [F.aReserve]: wCheck(true),
      [F.gisement]: wSel('🟢 A réservé un call'),
      [F.dateResa]: wDate(dateRdv),
    },
  });
}

module.exports = {
  ensureSetterDatabase,
  isReady,
  getSetterLeads,
  updateSetterLead,
  bookSetterLead,
  resetSetterLead,
  getStats,
  upsertWebiLead,
  archiveSetterLead,
  markBookedByEmail,
};
