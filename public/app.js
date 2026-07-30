/* ══════════════════════════════════════════════════════════════════════
   Frontend setter — Les Instapreneurs
   Se connecte à /api/* ; bascule en mode démo si le backend Notion
   n'est pas configuré (permet de tester l'interface sans rien brancher).
   ══════════════════════════════════════════════════════════════════════ */

const CALENDLY_URL = 'https://calendly.com/contact-3568/etre-rappele-par-les-instapreneurs-set';

/* ── Liens par webinaire (réinscription + replay) ──────────────────────
   Le lead porte son webinaire d'origine (type_webi : 'ia' | 'social').   */
const LINKS = {
  social: {
    label: '📱 Réseaux sociaux', jour: 'lundi',
    inscription: 'https://membre.les-instapreneurs.com/conference-gratuite-lundi',
    replay: 'https://les-instapreneurs.com/replay-conference-lundi/',
  },
  ia: {
    label: '🤖 IA', jour: 'mercredi',
    inscription: 'https://les-instapreneurs.com/optin-conference-ia/',
    replay: '', // replay IA : à venir (URL fournie plus tard)
  },
};
function webiTypeOf(lead) { return lead && lead.type_webi === 'ia' ? 'ia' : 'social'; }

/* ── Script d'appel : les speechs, à lire mot pour mot ─────────────────
   {prenom} est remplacé automatiquement par le prénom du lead.
   Deux jeux : `social` (réseaux sociaux, lundi) et `ia` (IA, mercredi).
   Ressenti / manques / profil / pitch RDV sont communs ; seules l'ouverture,
   la relance « absent » et le SMS changent selon le webinaire.            */
const SP_COMMON = {
  ressenti: () =>
    `— Super ! Et globalement, <strong>qu'est-ce qui vous a le plus plu</strong> ?`,

  manques: () =>
    `— Et si vous deviez citer <strong>ce qui vous a manqué</strong>, ce serait quoi ?`,

  profil: () =>
    `— <strong>Vous vous êtes inscrit·e à la conférence pour quelles raisons</strong> ?`,

  // Pitch RDV — on évoque le financement (OF certifié Qualiopi) juste avant de proposer le créneau
  rdv: () =>
    `— Parfait, j'en ai fini avec mon petit questionnaire ! Je voulais vous proposer ` +
    `<strong>gratuitement un appel de 30 minutes avec notre expert, Jordan</strong>, pour échanger sur vos besoins. ` +
    `Petit point utile : nous sommes <strong>organisme de formation certifié Qualiopi</strong>, donc ` +
    `<strong>selon votre situation</strong> — salarié·e, indépendant·e, en recherche d'emploi… — ` +
    `l'accompagnement peut même être <strong>financé en totalité</strong>, ` +
    `et c'est justement ce que Jordan pourra regarder avec vous. ` +
    `On regarde une dispo ensemble ? <strong>Ça ne vous engage à rien.</strong>`,
};

const SPEECHES = {
  social: {
    ...SP_COMMON,
    ouverture: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, je suis <strong>Sylvie, des Instapreneurs</strong> ! ` +
      `Je vous prends juste <strong>3 minutes de votre temps</strong>, s'il vous plaît : ` +
      `on cherche à <strong>améliorer le contenu</strong> qu'on offre chaque lundi lors de notre ` +
      `<strong>conférence gratuite sur Instagram</strong>, et j'avais <strong>4 questions</strong> à vous poser. ` +
      `Premièrement, est-ce que vous avez <strong>pu y assister</strong> ?`,

    absent: () =>
      `— Vous avez loupé quelque chose 🙂 Vous voulez que je vous <strong>réinscrive pour lundi prochain</strong>, ` +
      `ou vous préférez profiter d'un <strong>appel gratuit de 30 min avec un expert de l'équipe</strong> ` +
      `pour échanger sur votre projet ou votre idée ? ` +
      `Personnellement, je trouve qu'avec un appel on est <strong>beaucoup plus efficace</strong>… pas vous ?`,

    sms: (p) =>
      `Bonjour ${p || ''}, je suis Sylvie des Instapreneurs. ` +
      `Je vous ai appelé·e au sujet de la conférence qu'on organise chaque lundi à 20h — avez-vous pu y assister ?\n` +
      `Je vous propose un échange gratuit avec notre expert Jordan : 30 minutes offertes pour parler de votre projet et/ou de vos problématiques.\n` +
      `Je vous envoie le lien pour réserver un appel selon votre planning ?\n` +
      `Merci d'avance pour votre retour 🙏`,
  },

  ia: {
    ...SP_COMMON,
    ouverture: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, je suis <strong>Sylvie, des Instapreneurs</strong> ! ` +
      `Je vous prends juste <strong>3 minutes de votre temps</strong>, s'il vous plaît : ` +
      `on cherche à <strong>améliorer le contenu</strong> de notre <strong>conférence gratuite sur l'intelligence artificielle</strong> ` +
      `(chaque mercredi soir), et j'avais <strong>4 questions</strong> à vous poser. ` +
      `Premièrement, est-ce que vous avez <strong>pu y assister</strong> ?`,

    absent: () =>
      `— Vous avez loupé quelque chose 🙂 Vous voulez que je vous <strong>réinscrive pour le prochain (mercredi soir)</strong>, ` +
      `ou vous préférez profiter d'un <strong>appel gratuit de 30 min avec un expert de l'équipe</strong> ` +
      `pour échanger sur votre projet ou votre idée ? ` +
      `Personnellement, je trouve qu'avec un appel on est <strong>beaucoup plus efficace</strong>… pas vous ?`,

    sms: (p) =>
      `Bonjour ${p || ''}, je suis Sylvie des Instapreneurs. ` +
      `Je vous ai appelé·e au sujet de notre conférence sur l'IA (chaque mercredi à 20h) — avez-vous pu y assister ?\n` +
      `Je vous propose un échange gratuit avec notre expert Jordan : 30 minutes offertes pour parler de votre projet et/ou de vos problématiques.\n` +
      `Je vous envoie le lien pour réserver un appel selon votre planning ?\n` +
      `Merci d'avance pour votre retour 🙏`,
  },
};

// Jeu de speechs adapté au webinaire d'origine du lead
function speechesFor(lead) { return SPEECHES[webiTypeOf(lead)]; }

/* ── Options des questions ─────────────────────────────────────────────── */
const OPTIONS = {
  repondu: [
    { label: 'Oui, a décroché', value: 'oui', tone: 'oui' },
    { label: 'Non, pas de réponse', value: 'non', tone: 'non' },
  ],
  vuWebi: [
    { label: 'Oui, je l\'ai suivie', value: 'oui', tone: 'oui' },
    { label: 'Non, je n\'ai pas pu', value: 'non', tone: 'non' },
  ],
  reinscription: [
    { label: 'Réinscrire pour lundi', value: 'reinscrire', tone: 'orange' },
    { label: 'Réserver un call', value: 'call', tone: 'oui' },
    { label: 'Pas intéressé·e', value: 'non', tone: 'non' },
  ],
  manques: [
    'Trop court', 'Pas assez concret', 'Trop de théorie',
    'Manque de cas concrets', 'Son ou image moyens', 'Rien à signaler',
  ],
  positifs: [
    'Les résultats montrés', 'La méthode claire', 'Les témoignages clients',
    'La rapidité des résultats', 'L\'accompagnement', 'Le contact humain',
  ],
  situations: [
    'Salarié', 'Demandeur emploi', 'Auto-entrepreneur',
    'Chef d\'entreprise', 'En reconversion', 'Autre',
  ],
  objectifs: [
    'Développer sa visibilité', 'Monétiser ses réseaux', 'Quitter son emploi',
    'Créer du contenu qui vend', 'Construire sa marque perso',
  ],
  statutsAppel: [
    { label: 'Intéressé·e — on booke le RDV 🎯', value: 'interesse', tone: 'oui' },
    { label: 'Veut réfléchir — à rappeler', value: 'rappeler', tone: 'neutral' },
    { label: 'Pas intéressé·e', value: 'pasinteresse', tone: 'non' },
  ],
  // Objections recueillies quand le prospect est « pas intéressé »
  objections: [
    'Pas le temps maintenant', 'Question de budget', 'Doit en parler (conjoint / associé)',
    'Veut juste réfléchir', 'Pas convaincu·e par l\'offre', 'Déjà accompagné·e ailleurs',
    'Ne se sent pas concerné·e',
  ],
  // Piste de financement détectée (optionnel) — trace l'info dans Notion
  financement: [
    { label: 'CPF', value: 'CPF' },
    { label: 'OPCO', value: 'OPCO' },
    { label: 'France Travail', value: 'France Travail' },
    { label: 'Autofinancement', value: 'Autofinancement' },
    { label: 'À vérifier', value: 'À vérifier' },
  ],
};

/* ── Données de démo (si backend non connecté) ─────────────────────────── */
const DEMO_LEADS = [
  { id: 'demo-1', nom: 'Marie Dupont', telephone: '0612345678', email: 'marie@mail.com', statut: '🔥 Présent webi', webi: 'Présent', score: 9, niveau_ig: 'Débutant', situation_pro: 'Salarié', objectif: 'Monétiser ses réseaux', lien_instagram: 'https://instagram.com/mariedupont', briefing: 'Lead très chaud : salariée, veut quitter son emploi, a suivi tout le webinaire. CPF dispo a priori.', nb_tentatives: 0, notes: '', financement: 'Non identifié' },
  { id: 'demo-2', nom: 'Lucas Bernard', telephone: '0698765432', email: 'lucas@mail.com', statut: '🔥 Présent webi', webi: 'Présent', score: 7, niveau_ig: 'Intermédiaire', situation_pro: 'Auto-entrepreneur', objectif: 'Construire sa marque perso', lien_instagram: '', briefing: 'Auto-entrepreneur, OPCO possible. Cherche de la clarté sur son positionnement.', nb_tentatives: 1, notes: '', financement: 'Non identifié' },
  { id: 'demo-3', nom: 'Sophie Martin', telephone: '0611223344', email: 'sophie@mail.com', statut: '📭 Absent webi', webi: 'Absent', type_webi: 'ia', score: 6, niveau_ig: 'Débutant', situation_pro: 'En reconversion', objectif: 'Quitter son emploi', lien_instagram: 'https://instagram.com/sophiemartin', briefing: 'En reconversion, motivée, mais n\'a pas vu le webinaire IA. Proposer la réinscription en douceur.', nb_tentatives: 0, notes: '', financement: 'Non identifié' },
  { id: 'demo-4', nom: 'Thomas Leclerc', telephone: '0633445566', email: 'thomas@mail.com', statut: '📭 Absent webi', webi: 'Absent', type_webi: 'social', score: 3, niveau_ig: 'Débutant', situation_pro: 'Salarié', objectif: '', lien_instagram: '', briefing: 'Score froid : inscrit par curiosité, 2 tentatives sans réponse. Dernier essai avant de classer.', nb_tentatives: 2, notes: '', financement: 'Non identifié' },
];

/* ── État ──────────────────────────────────────────────────────────────── */
let leads = [];
let currentLead = null;
let currentFilter = 'appeler';
let searchText = '';
let demoMode = false;
let rdvBookesDemo = 0;
let timerInterval = null;
let timerSeconds = 0;
let rdvChart = null;
let autosaveTimer = null;

let call = newCallState();
function newCallState() {
  return {
    repondu: null, vuWebi: null, reinscription: null,
    manques: [], positifs: [], objectifs: [], objectifAutre: '',
    issue: null, nbTentatives: 0,
    objections: [], objectionDetail: '', financement: null,
  };
}

/* ── Helpers API ───────────────────────────────────────────────────────── */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function patchLead(id, payload) {
  if (demoMode) {
    const l = leads.find((x) => x.id === id);
    if (l) Object.assign(l, normalizeDemoPatch(payload));
    return;
  }
  await api(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  const l = leads.find((x) => x.id === id);
  if (l) Object.assign(l, normalizeDemoPatch(payload));
}

// Reflète le payload dans l'objet lead local, pour que la restitution
// (réouverture d'une fiche) montre ce qui vient d'être saisi sans recharger.
function normalizeDemoPatch(p) {
  const out = {};
  if ('statut' in p) out.statut = p.statut;
  if ('nb_tentatives' in p) out.nb_tentatives = p.nb_tentatives;
  if ('notes' in p) out.notes = p.notes;
  if ('financement' in p) out.financement = p.financement;
  if ('situation_pro' in p) out.situation_pro = p.situation_pro;
  if ('manques_webi' in p) out.manques = p.manques_webi;
  if ('points_positifs' in p) out.positifs = p.points_positifs;
  if ('objectif' in p) out.objectif = p.objectif;
  if ('objection' in p) out.objection = p.objection;
  return out;
}

/* ── Init ──────────────────────────────────────────────────────────────── */
function init() {
  renderAllChipGroups();
  renderTentatives();
  // Recherche dans la liste des leads
  document.getElementById('searchInput').addEventListener('input', onSearchInput);
  // Les notes libres s'auto-sauvegardent au fil de la frappe
  document.getElementById('notesLibres').addEventListener('input', scheduleAutosave);
  // Champ « Autre raison » (étape 3)
  const autre = document.getElementById('objectifAutre');
  if (autre) autre.addEventListener('input', (e) => { call.objectifAutre = e.target.value; scheduleAutosave(); });
  // Détail d'objection (verbatim du prospect)
  const objDetail = document.getElementById('objectionDetail');
  if (objDetail) objDetail.addEventListener('input', (e) => { call.objectionDetail = e.target.value; saveObjection(); });
  loadLeads();
}

async function loadLeads() {
  try {
    leads = await api('/api/leads');
    demoMode = false;
  } catch {
    leads = JSON.parse(JSON.stringify(DEMO_LEADS));
    demoMode = true;
    document.getElementById('demoBanner').classList.add('show');
  }
  renderLeads();
  updateSidebarStats();
}

/* ── Liste des leads : recherche + filtres ─────────────────────────────── */
// Catégorie d'un lead pour les filtres (chaque lead est dans un seul bucket)
function leadCategory(l) {
  if (l.archived) return 'archive'; // lot archivé → onglet Archivés
  if (l.statut === '✅ RDV booké' || l.a_reserve) return 'booke';
  if (l.statut === '🚫 Pas intéressé' || l.statut === '❌ Injoignable') return 'perdu';
  if (l.statut === '🔄 À rappeler' || l.statut === '🔄 À réinscrire') return 'rappeler';
  return 'appeler'; // 📞 À appeler / vide
}
// Normalise un téléphone FR : enlève tout sauf chiffres, l'indicatif 33 et le 0
// de tête → forme canonique de 9 chiffres (ex: 33652379895 / 0652379895 → 652379895)
function normPhone(s) {
  let d = String(s || '').replace(/\D/g, '');
  if (d.startsWith('33')) d = d.slice(2);
  return d.replace(/^0+/, '');
}
// Affichage uniformisé : 06 52 37 98 95 (sinon, renvoie tel quel)
function formatPhone(s) {
  const n = normPhone(s);
  if (n.length === 9) return ('0' + n).replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  return s || '—';
}
function matchSearch(l, q) {
  const text = q.toLowerCase();
  const textMatch = [l.nom, l.prenom, l.email].some((v) => String(v || '').toLowerCase().includes(text));
  const qDigits = normPhone(q);
  const phoneMatch = qDigits.length >= 3 && normPhone(l.telephone).includes(qDigits);
  return textMatch || phoneMatch;
}

function renderLeads() {
  const q = searchText.trim();
  // Recherche = GLOBALE (tous les filtres) ; sans recherche = filtre actif
  const visibles = (q ? leads.filter((l) => matchSearch(l, q))
                      : leads.filter((l) => leadCategory(l) === currentFilter))
    .sort((a, b) => (a.webi === b.webi ? b.score - a.score : a.webi === 'Présent' ? -1 : 1));

  document.getElementById('leadsCount').textContent = visibles.length;
  const list = document.getElementById('leadsList');

  if (!visibles.length) {
    const vide = q ? '🔍 Aucun lead pour cette recherche.'
      : currentFilter === 'appeler' ? '🎉 Plus personne à appeler dans ce filtre !'
      : 'Aucun lead dans ce filtre.';
    list.innerHTML = `<div class="list-placeholder">${vide}</div>`;
    return;
  }

  list.innerHTML = visibles.map((l) => {
    const scoreCls = l.score >= 7 ? 'score-hot' : l.score >= 4 ? 'score-warm' : 'score-cold';
    const webiCls = l.webi === 'Présent' ? 'badge-present' : 'badge-absent';
    const webiLabel = l.webi === 'Présent' ? '🔥 Présent webi' : '📭 Absent webi';
    const isIA = l.type_webi === 'ia';
    const typeCls = isIA ? 'badge-ia' : 'badge-rs';
    const typeLabel = isIA ? '🤖 IA' : '📱 RS';
    const typeFlag = isIA ? ' type-ia' : ' type-rs';
    const active = currentLead && currentLead.id === l.id ? ' active' : '';
    const orange = l.statut === '🔄 À réinscrire' ? ' orange-flag' : '';
    const dimmed = (l.statut === '🚫 Pas intéressé' || l.statut === '❌ Injoignable') ? ' dimmed' : '';
    const statutBadge =
      l.statut === '🔄 À réinscrire' ? '<span class="badge badge-reinscrit">À réinscrire</span>' :
      l.statut === '🔄 À rappeler' ? '<span class="badge badge-statut">À rappeler</span>' :
      l.statut === '🚫 Pas intéressé' ? '<span class="badge badge-statut">Pas intéressé</span>' :
      l.statut === '❌ Injoignable' ? '<span class="badge badge-statut">Injoignable</span>' : '';
    return `<div class="lead-card${active}${orange}${dimmed}${typeFlag}" onclick="openLead('${l.id}')">
      <div class="card-top">
        <span class="card-name">${esc(l.nom)}</span>
        <span class="score-pill ${scoreCls}">${l.score}/10</span>
      </div>
      <div class="card-badges">
        <span class="badge ${typeCls}">${typeLabel}</span>
        <span class="badge ${webiCls}">${webiLabel}</span>
        ${statutBadge}
        ${l.nb_tentatives > 0 ? `<span class="badge badge-tentatives">${l.nb_tentatives} appel${l.nb_tentatives > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="card-phone">${esc(formatPhone(l.telephone))}</div>
    </div>`;
  }).join('');
}

// Change le filtre actif et rafraîchit la liste
function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.filter === f));
  renderLeads();
}

function onSearchInput(e) {
  searchText = e.target.value;
  document.querySelector('.search-box').classList.toggle('has-text', !!searchText);
  renderLeads();
}

function clearSearch() {
  searchText = '';
  document.getElementById('searchInput').value = '';
  document.querySelector('.search-box').classList.remove('has-text');
  renderLeads();
}

async function updateSidebarStats() {
  let presents, absents, rdv, taux;
  if (demoMode) {
    const actifs = leads.filter((l) => l.statut !== '✅ RDV booké');
    presents = actifs.filter((l) => l.webi === 'Présent').length;
    absents = actifs.filter((l) => l.webi === 'Absent').length;
    rdv = rdvBookesDemo;
    taux = leads.length ? Math.round((rdv / leads.length) * 100) + '%' : '0%';
  } else {
    try {
      const s = await api('/api/stats');
      presents = s.presents_webi; absents = s.absents_webi;
      rdv = s.rdv_bookes; taux = s.taux_conversion + '%';
    } catch { return; }
  }
  document.getElementById('statPresents').textContent = presents;
  document.getElementById('statAbsents').textContent = absents;
  document.getElementById('statRdv').textContent = rdv;
  document.getElementById('statTaux').textContent = taux;
}

/* ── Restitution d'une fiche déjà travaillée ───────────────────────────── */
function splitList(s) {
  return String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
}
function preselectMulti(containerId, values) {
  const el = document.getElementById(containerId);
  if (!el || !values.length) return;
  [...el.children].forEach((c) => { if (values.includes(c.dataset.value)) c.classList.add('selected-multi'); });
}
function preselectSingle(containerId, value, toneClass) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const chip = [...el.children].find((c) => c.dataset.value === value);
  if (chip) chip.classList.add(toneClass);
}
function reveal(id, done) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  if (done) el.classList.add('done-step');
}

// Re-affiche dans le script tout ce qui a déjà été saisi pour ce lead.
function prefillFromLead(lead) {
  // Étape 0 — tentatives
  const nt = lead.nb_tentatives || 0;
  if (nt >= 1 && nt <= 3) {
    const btn = [...document.getElementById('tentativesRow').children][nt - 1];
    if (btn) btn.classList.add('sel-hi');
  }
  // Étape 2 — ressenti
  const manques = splitList(lead.manques);
  const positifs = splitList(lead.positifs);
  preselectMulti('chipsManques', manques); call.manques = manques;
  preselectMulti('chipsPositifs', positifs); call.positifs = positifs;
  // Étape 3 — raisons (options connues + champ « Autre »)
  const reasons = splitList(lead.objectif);
  const known = reasons.filter((r) => OPTIONS.objectifs.includes(r));
  const autre = reasons.filter((r) => !OPTIONS.objectifs.includes(r)).join(', ');
  preselectMulti('chipsObjectifs', known); call.objectifs = known;
  if (autre) { document.getElementById('objectifAutre').value = autre; call.objectifAutre = autre; }
  // Financement déjà détecté
  if (lead.financement && OPTIONS.financement.some((o) => o.value === lead.financement)) {
    preselectSingle('chipsFinancement', lead.financement, 'selected-oui');
    call.financement = lead.financement;
  }
  // Objection
  let hasObjection = false;
  if (lead.objection) {
    const parts = String(lead.objection).split(' · ').map((x) => x.trim()).filter(Boolean);
    const detail = parts.find((p) => p.startsWith('«'));
    const objs = parts.filter((p) => !p.startsWith('«'));
    preselectMulti('chipsObjections', objs); call.objections = objs;
    if (detail) {
      const d = detail.replace(/^«\s?/, '').replace(/\s?»$/, '');
      document.getElementById('objectionDetail').value = d; call.objectionDetail = d;
    }
    hasObjection = objs.length > 0 || !!detail;
  }
  // Révèle les étapes déjà renseignées et reflète le statut
  const isPasInt = lead.statut === '🚫 Pas intéressé';
  const hasPresentData = manques.length || positifs.length || known.length || !!autre;
  if (lead.webi === 'Absent') {
    if (lead.statut === '🔄 À réinscrire' || isPasInt || hasObjection) {
      reveal('step1', true); reveal('step2non');
      if (lead.statut === '🔄 À réinscrire') preselectSingle('chipsReinscription', 'reinscrire', 'selected-orange');
      if (isPasInt) preselectSingle('chipsReinscription', 'non', 'selected-non');
    }
  } else if (hasPresentData || isPasInt || lead.statut === '🔄 À rappeler' || hasObjection) {
    document.getElementById('step0').classList.add('done-step');
    reveal('step1', true); reveal('step2oui'); reveal('step3'); reveal('step5');
    if (isPasInt) preselectSingle('chipsStatutAppel', 'pasinteresse', 'selected-non');
    if (lead.statut === '🔄 À rappeler') preselectSingle('chipsStatutAppel', 'rappeler', 'selected-neutral');
  }
  if (hasObjection) reveal('objectionStep');
}

// Récap clair, en haut de la fiche, de tout ce qui a déjà été saisi
// (pour qu'en rouvrant une fiche on voie l'historique d'un coup d'œil).
function renderFicheRecap(lead) {
  const box = document.getElementById('ficheRecap');
  if (!box) return;
  const rows = [];
  if (lead.statut && lead.statut !== '📞 À appeler') rows.push(['Statut', lead.statut]);
  if (lead.nb_tentatives) rows.push(['Tentatives', lead.nb_tentatives + ' appel' + (lead.nb_tentatives > 1 ? 's' : '')]);
  if (lead.positifs) rows.push(['Ce qui a plu', lead.positifs]);
  if (lead.manques) rows.push(['Ce qui a manqué', lead.manques]);
  if (lead.objectif) rows.push(['Raisons d\'inscription', lead.objectif]);
  if (lead.objection) rows.push(['Objection', lead.objection]);
  if (lead.financement) rows.push(['Financement', lead.financement]);
  if (lead.date_rdv) rows.push(['RDV', String(lead.date_rdv).replace('T', ' à ').slice(0, 16)]);

  if (!rows.length && !lead.notes) { box.classList.add('hidden'); box.innerHTML = ''; return; }

  let html = '<div class="recap-title">📋 Déjà saisi pour ce lead</div>';
  if (lead.notes) html += `<div class="recap-notes">${esc(lead.notes)}</div>`;
  if (rows.length) {
    html += '<div class="recap-grid">' + rows.map(([k, v]) =>
      `<div class="recap-cell"><span class="recap-k">${k}</span><span class="recap-v">${esc(String(v))}</span></div>`).join('') + '</div>';
  }
  box.innerHTML = html;
  box.classList.remove('hidden');
}

/* ── Ressources : liens du bon webinaire (réinscription + replay) ─────── */
function renderRessources(lead) {
  const box = document.getElementById('ficheRessources');
  if (!box) return;
  const L = LINKS[webiTypeOf(lead)];
  const rows = [`<div class="res-title">🔗 Ressources — ${L.label}</div>`];
  rows.push(resLink('📝 Réinscription', L.inscription));
  if (L.replay) rows.push(resLink('▶️ Replay', L.replay));
  else rows.push('<div class="res-muted">▶️ Replay : à venir</div>');
  box.innerHTML = rows.join('');
}

function resLink(label, url) {
  return `<div class="res-row"><span class="res-lbl">${label}</span>` +
    `<a class="res-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>` +
    `<button class="res-copy" title="Copier le lien" onclick="copyText(${JSON.stringify(url)}, this)">📋</button></div>`;
}

// Remplit le bloc de réinscription (absent → « réinscrire ») avec le bon lien
// et le bon wording selon le webinaire. IA : pas de tag lundi, envoi manuel.
function fillReinscritBlock(lead) {
  const block = document.getElementById('reinscritBlock');
  if (!block) return;
  const L = LINKS[webiTypeOf(lead)];
  if (webiTypeOf(lead) === 'ia') {
    block.innerHTML =
      `<strong>✔️ Action :</strong> réinscrire ce lead au <strong>webinaire IA (mercredi soir)</strong> — ` +
      `envoie-lui le lien d'inscription par message. ` +
      `<em>(Pas de tag « Réinscrit webi » : celui-ci réinscrit au lundi.)</em>` +
      resLink('📝 Inscription IA', L.inscription);
  } else {
    block.innerHTML =
      `<strong>✔️ Action System.io :</strong> réinscrire ce lead au <strong>webinaire de lundi prochain</strong> — ` +
      `le tag <code>Réinscrit webi</code> est posé automatiquement. Tu peux aussi lui envoyer le lien :` +
      resLink('📝 Inscription lundi', L.inscription);
  }
}

// Copie un texte dans le presse-papier + petit feedback visuel sur le bouton
function copyText(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    if (btn) { const old = btn.textContent; btn.textContent = '✓'; setTimeout(() => (btn.textContent = old), 1200); }
  }).catch(() => showToast('⚠️ Copie impossible'));
}

// Force l'enregistrement des changements en attente du lead courant
// (évite la perte si on quitte la fiche dans la fenêtre de ~0,7 s du debounce).
function flushAutosave() {
  if (!autosaveTimer) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = null;
  if (currentLead) autosaveNow(currentLead.id);
}

/* ── Ouverture d'un lead ───────────────────────────────────────────────── */
function openLead(id) {
  flushAutosave(); // sauvegarde le lead précédent avant de changer
  const next = leads.find((l) => l.id === id);
  if (!next) return;
  currentLead = next;

  call = newCallState();
  call.nbTentatives = currentLead.nb_tentatives || 0;
  resetScriptUI();
  renderLeads();

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('scriptArea').style.display = 'block';
  document.getElementById('layout').classList.add('show-script');

  const prenom = currentLead.prenom || (currentLead.nom || '').trim().split(/\s+/)[0] || '';

  // En-tête
  const initiales = (currentLead.nom || '?').split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('leadAvatar').textContent = initiales;
  document.getElementById('leadName').textContent = currentLead.nom;
  const wLabel = webiTypeOf(currentLead) === 'ia' ? '🤖 Webi IA' : '📱 Webi Réseaux sociaux';
  document.getElementById('leadMeta').textContent =
    `${wLabel} · ${currentLead.webi === 'Présent' ? '🔥 présent' : '📭 absent'}` +
    ` · Score ${currentLead.score}/10 · ${call.nbTentatives} appel${call.nbTentatives > 1 ? 's' : ''} passé${call.nbTentatives > 1 ? 's' : ''}`;

  // Infos
  const tel = document.getElementById('infoTel');
  tel.textContent = formatPhone(currentLead.telephone);
  const telDigits = normPhone(currentLead.telephone);
  tel.href = telDigits ? 'tel:0' + telDigits : '#';
  document.getElementById('infoEmail').textContent = currentLead.email || '—';
  document.getElementById('infoNiveau').textContent = currentLead.niveau_ig || '—';
  document.getElementById('infoSituation').textContent = currentLead.situation_pro || '—';
  document.getElementById('infoScore').textContent = currentLead.score + '/10';

  const ig = document.getElementById('infoIG');
  if (currentLead.lien_instagram) {
    ig.textContent = '@' + currentLead.lien_instagram.replace(/\/+$/, '').split('/').pop();
    ig.href = currentLead.lien_instagram;
  } else { ig.textContent = '—'; ig.href = '#'; }

  document.getElementById('infoBriefing').textContent =
    currentLead.briefing || 'Pas encore de briefing pour ce lead.';

  // Speechs personnalisés (jeu adapté au webinaire d'origine)
  const sp = speechesFor(currentLead);
  document.getElementById('speechOuverture').innerHTML = sp.ouverture(prenom);
  document.getElementById('speechAbsent').innerHTML = sp.absent();
  document.getElementById('speechRessenti').innerHTML = sp.ressenti();
  document.getElementById('speechManques').innerHTML = sp.manques();
  document.getElementById('speechProfil').innerHTML = sp.profil();
  document.getElementById('speechRdv').innerHTML = sp.rdv();
  document.getElementById('speechSms').textContent = sp.sms(prenom);

  // Notes existantes
  document.getElementById('notesLibres').value = currentLead.notes || '';
  clearTimeout(autosaveTimer);
  setSaveStatus('');

  // Récap visible + ressources (liens du bon webinaire) + restitution
  renderFicheRecap(currentLead);
  renderRessources(currentLead);
  prefillFromLead(currentLead);

  // Timer
  clearInterval(timerInterval);
  timerSeconds = 0;
  document.getElementById('timerDisplay').textContent = '00:00';
  timerInterval = setInterval(() => {
    timerSeconds++;
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = m + ':' + s;
  }, 1000);

  document.getElementById('mainArea').scrollTop = 0;
}

function closeLead() {
  flushAutosave(); // sauvegarde les changements en attente avant de fermer
  clearInterval(timerInterval);
  clearTimeout(autosaveTimer);
  setSaveStatus('');
  currentLead = null;
  document.getElementById('scriptArea').style.display = 'none';
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('layout').classList.remove('show-script');
  renderLeads();
}

function resetScriptUI() {
  ['step1', 'step2non', 'step2oui', 'step3', 'step5', 'objectionStep'].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('active-step', 'done-step');
  });
  const s0 = document.getElementById('step0');
  s0.classList.remove('done-step');
  s0.classList.add('active-step');

  document.querySelectorAll('.chip').forEach((c) =>
    c.classList.remove('selected-oui', 'selected-non', 'selected-orange', 'selected-neutral', 'selected-multi'));
  document.querySelectorAll('.score-btn').forEach((b) =>
    b.classList.remove('sel-low', 'sel-mid', 'sel-hi'));
  document.getElementById('reinscritBlock').classList.remove('show');
  document.getElementById('smsBlock').classList.add('hidden');
  document.getElementById('bookingSection').classList.add('hidden');
  document.getElementById('bookingSectionAbs').classList.add('hidden');
  document.getElementById('rdvDate').value = '';
  document.getElementById('rdvTime').value = '';
  document.getElementById('rdvDateAbs').value = '';
  document.getElementById('rdvTimeAbs').value = '';
  const objDetail = document.getElementById('objectionDetail');
  if (objDetail) objDetail.value = '';
  const autre = document.getElementById('objectifAutre');
  if (autre) autre.value = '';
}

/* ── Rendu des chips ───────────────────────────────────────────────────── */
const CHECK_SVG =
  '<svg width="9" height="7" viewBox="0 0 9 7"><polyline points="1,3.5 3.5,6 8,1" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function renderChipGroup(containerId, items, { multi = false, onSelect } = {}) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach((raw) => {
    const item = typeof raw === 'string' ? { label: raw, value: raw } : raw;
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.value = item.value ?? item.label;
    chip.innerHTML =
      `<div class="check-box">${CHECK_SVG}</div>` +
      `<div><div>${esc(item.label)}</div>${item.sub ? `<div class="chip-sub">${esc(item.sub)}</div>` : ''}</div>`;
    chip.onclick = () => {
      if (multi) {
        chip.classList.toggle('selected-multi');
        const selected = [...el.querySelectorAll('.selected-multi')].map((c) => c.dataset.value);
        onSelect && onSelect(selected);
      } else {
        [...el.children].forEach((c) =>
          c.classList.remove('selected-oui', 'selected-non', 'selected-orange', 'selected-neutral'));
        const tone = item.tone === 'non' ? 'selected-non'
          : item.tone === 'orange' ? 'selected-orange'
          : item.tone === 'neutral' ? 'selected-neutral'
          : 'selected-oui';
        chip.classList.add(tone);
        onSelect && onSelect(item.value ?? item.label, chip);
      }
    };
    el.appendChild(chip);
  });
}

function renderAllChipGroups() {
  renderChipGroup('chipsRepondu', OPTIONS.repondu, { onSelect: onRepondu });
  renderChipGroup('chipsVuWebi', OPTIONS.vuWebi, { onSelect: onVuWebi });
  renderChipGroup('chipsReinscription', OPTIONS.reinscription, { onSelect: onReinscription });
  renderChipGroup('chipsManques', OPTIONS.manques, { multi: true, onSelect: (v) => { call.manques = v; scheduleAutosave(); } });
  renderChipGroup('chipsPositifs', OPTIONS.positifs, { multi: true, onSelect: (v) => { call.positifs = v; scheduleAutosave(); } });
  renderChipGroup('chipsObjectifs', OPTIONS.objectifs, { multi: true, onSelect: (v) => { call.objectifs = v; scheduleAutosave(); } });
  renderChipGroup('chipsObjections', OPTIONS.objections, { multi: true, onSelect: (v) => { call.objections = v; saveObjection(); } });
  renderChipGroup('chipsStatutAppel', OPTIONS.statutsAppel, { onSelect: onStatutAppel });
  renderChipGroup('chipsFinancement', OPTIONS.financement, { onSelect: (v) => { call.financement = v; scheduleAutosave(); } });
}

// Construit la chaîne d'objection et l'enregistre (champ dédié dans Notion)
function saveObjection() {
  if (!currentLead) return;
  const parts = [...call.objections];
  if (call.objectionDetail) parts.push('« ' + call.objectionDetail + ' »');
  const txt = parts.join(' · ');
  setSaveStatus('saving');
  patchLead(currentLead.id, { objection: txt })
    .then(() => setSaveStatus('saved'))
    .catch(() => setSaveStatus('error'));
}

// Boutons 1 à 3 pour le nombre de tentatives (étape 0)
function renderTentatives() {
  const row = document.getElementById('tentativesRow');
  row.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const btn = document.createElement('button');
    btn.className = 'score-btn';
    btn.textContent = i;
    btn.onclick = () => {
      [...row.children].forEach((b) => b.classList.remove('sel-hi'));
      btn.classList.add('sel-hi');
      call.nbTentatives = i;
      scheduleAutosave();
    };
    row.appendChild(btn);
  }
}

/* ── Logique du script branché ─────────────────────────────────────────── */
// Étape 0 — le prospect a-t-il décroché ?
function onRepondu(val) {
  call.repondu = val;
  const s0 = document.getElementById('step0');
  const sms = document.getElementById('smsBlock');
  if (val === 'oui') {
    sms.classList.add('hidden');
    s0.classList.remove('active-step');
    s0.classList.add('done-step');
    show('step1');
  } else {
    // Pas de réponse → afficher le SMS et marquer « à rappeler »
    sms.classList.remove('hidden');
    hide('step1'); hide('step2non'); hide('step2oui'); hide('step3'); hide('step5');
    setStatut('🔄 À rappeler', '🔄 Pas de réponse — envoie le SMS, lead à rappeler',
      { nb_tentatives: call.nbTentatives || (currentLead?.nb_tentatives || 0) });
  }
}

// Pas de réponse après tentatives → classer injoignable (+ tag System.io)
function markInjoignable() {
  setStatut('❌ Injoignable', '🚫 Lead classé injoignable — tag posé dans System.io',
    { nb_tentatives: call.nbTentatives || (currentLead?.nb_tentatives || 0) });
}

function copySms() {
  const txt = document.getElementById('speechSms').textContent || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(
      () => showToast('📋 SMS copié — colle-le dans ton appli SMS'),
      () => showToast('⚠️ Copie impossible — sélectionne le texte à la main')
    );
  } else {
    showToast('⚠️ Copie impossible — sélectionne le texte à la main');
  }
}

function onVuWebi(val) {
  call.vuWebi = val;
  const s1 = document.getElementById('step1');
  s1.classList.remove('active-step');
  s1.classList.add('done-step');

  if (val === 'non') {
    show('step2non');
    hide('step2oui'); hide('step3'); hide('step5');
  } else {
    hide('step2non');
    show('step2oui'); show('step3'); show('step5');
  }
}

function onReinscription(val) {
  call.reinscription = val;
  const block = document.getElementById('reinscritBlock');
  const booking = document.getElementById('bookingSectionAbs');
  if (val === 'reinscrire') {
    block.classList.add('show');
    booking.classList.add('hidden');
    showObjections(false);
    fillReinscritBlock(currentLead);
    const msg = webiTypeOf(currentLead) === 'ia'
      ? '🟠 Lead IA « à réinscrire » — envoie le lien d\'inscription IA (pas de tag lundi)'
      : '🟠 Lead « à réinscrire » — tag « Réinscrit webi » posé dans System.io';
    setStatut('🔄 À réinscrire', msg);
  } else if (val === 'call') {
    block.classList.remove('show');
    booking.classList.remove('hidden'); // le booking confirmera le RDV
    showObjections(false);
  } else {
    block.classList.remove('show');
    booking.classList.add('hidden');
    setStatut('🚫 Pas intéressé', '🚫 Lead « pas intéressé » — tag posé dans System.io');
    showObjections(true);
  }
}

function onStatutAppel(val) {
  call.issue = val;
  const booking = document.getElementById('bookingSection');
  if (val === 'interesse') {
    booking.classList.remove('hidden');
    showObjections(false);
    return;
  }
  booking.classList.add('hidden');
  if (val === 'pasinteresse') {
    setStatut('🚫 Pas intéressé', '🚫 Lead « pas intéressé » — tag posé dans System.io');
    showObjections(true);
  } else {
    setStatut('🔄 À rappeler', '🔄 Lead à rappeler');
    showObjections(false);
  }
}

// Affiche/masque le bloc « objections » (recueil du pourquoi)
function showObjections(show) {
  const el = document.getElementById('objectionStep');
  if (!el) return;
  el.classList.toggle('hidden', !show);
  el.classList.toggle('active-step', show);
}

async function setStatut(statut, toastMsg, extra = {}) {
  if (!currentLead) return;
  try {
    await patchLead(currentLead.id, { statut, ...extra });
    currentLead.statut = statut;
    renderLeads();
    updateSidebarStats();
    if (toastMsg) showToast(toastMsg);
  } catch (e) {
    showToast('⚠️ Erreur de sauvegarde — réessaie');
    console.error(e);
  }
}

/* ── Booking ───────────────────────────────────────────────────────────── */
// Construit l'URL Calendly avec pré-remplissage (nom, email, téléphone).
// Calendly : ?name=&email= sont standards ; le téléphone passe par la 1re
// question personnalisée (a1) du formulaire — à ajuster selon ta config.
function calendlyUrlFor(lead) {
  if (!lead) return CALENDLY_URL;
  const p = new URLSearchParams();
  const prenom = (lead.prenom || lead.nom || '').trim();
  // name = formulaire à champ unique ; first_name = formulaire prénom/nom séparés.
  // (on n'a généralement que le prénom côté System.io, pas le nom de famille)
  if (prenom) { p.set('name', prenom); p.set('first_name', prenom); }
  if (lead.email) p.set('email', lead.email);
  if (lead.telephone) p.set('a1', lead.telephone); // tél = 1re question perso
  const qs = p.toString();
  return qs ? CALENDLY_URL + (CALENDLY_URL.includes('?') ? '&' : '?') + qs : CALENDLY_URL;
}

function openCalendly() {
  window.open(calendlyUrlFor(currentLead), '_blank');
}

/* ── Réinitialiser une fiche ───────────────────────────────────────────── */
async function resetFiche() {
  if (!currentLead) return;
  const nom = currentLead.nom || 'ce prospect';
  if (!confirm(`Remettre la fiche de ${nom} à zéro ?\nTout ce qui a été saisi sera effacé.`)) return;
  const id = currentLead.id;
  clearTimeout(autosaveTimer); autosaveTimer = null; // annule un autosave en attente

  const vierge = { statut: '📞 À appeler', a_reserve: false, notes: '', manques: '', positifs: '', objectif: '', objection: '', nb_tentatives: 0 };
  try {
    if (!demoMode) await api(`/api/leads/${id}/reset`, { method: 'POST' });
    const l = leads.find((x) => x.id === id);
    if (l) Object.assign(l, vierge);
    openLead(id);            // rouvre la fiche vierge (prefill lit les champs vidés)
    renderLeads();
    updateSidebarStats();
    showToast('↺ Fiche réinitialisée');
  } catch (e) {
    showToast('⚠️ Erreur lors de la réinitialisation — réessaie');
    console.error(e);
  }
}

async function confirmerRDV(suffix) {
  if (!currentLead) return;
  const sfx = suffix || '';
  const date = document.getElementById('rdvDate' + sfx).value;
  const time = document.getElementById('rdvTime' + sfx).value;
  if (!date) { showToast('⚠️ Renseigne d\'abord la date du RDV'); return; }
  const dateRdv = `${date}T${time || '10:00'}:00`;

  try {
    if (demoMode) {
      currentLead.statut = '✅ RDV booké';
      rdvBookesDemo++;
    } else {
      await api(`/api/leads/${currentLead.id}/book`, {
        method: 'POST',
        body: JSON.stringify({ date_rdv: dateRdv }),
      });
      currentLead.statut = '✅ RDV booké';
    }
  } catch (e) {
    showToast('⚠️ Erreur lors du booking — réessaie');
    return console.error(e);
  }

  showToast('✅ RDV confirmé — lead gagné, bien joué !');
  renderLeads();
  updateSidebarStats();
  setTimeout(closeLead, 1500);
}

/* ── Sauvegarde de la fiche ────────────────────────────────────────────
   Tout ce que la setter saisit part dans Notion. Les statuts et le booking
   sont écrits immédiatement (setStatut / confirmerRDV). La note /10, la
   qualif et les notes sont auto-sauvegardés ~0,7 s après
   chaque changement. Le bouton reste comme sauvegarde manuelle explicite. */
function buildPayload() {
  const payload = {
    notes: document.getElementById('notesLibres').value,
    nb_tentatives: call.nbTentatives,
  };
  if (call.manques.length) payload.manques_webi = call.manques.join(', ');
  if (call.positifs.length) payload.points_positifs = call.positifs.join(', ');
  const raisons = [...call.objectifs];
  if (call.objectifAutre) raisons.push(call.objectifAutre);
  if (raisons.length) payload.objectif = raisons.join(', ');
  if (call.financement) payload.financement = call.financement;
  return payload;
}

function setSaveStatus(state) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  const map = {
    saving: ['Enregistrement…', 'save-status saving'],
    saved: ['✓ Enregistré', 'save-status saved'],
    error: ['⚠️ Non enregistré', 'save-status error'],
  };
  const [txt, cls] = map[state] || ['', 'save-status'];
  el.textContent = txt;
  el.className = cls;
}

// Auto-sauvegarde débouncée : on attend ~0,7 s que la setter ait fini de cliquer
function scheduleAutosave() {
  if (!currentLead) return;
  const id = currentLead.id;
  setSaveStatus('saving');
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => autosaveNow(id), 700);
}

async function autosaveNow(leadId) {
  if (!currentLead || currentLead.id !== leadId) return; // lead changé entre-temps
  try {
    await patchLead(currentLead.id, buildPayload());
    currentLead.notes = document.getElementById('notesLibres').value;
    setSaveStatus('saved');
  } catch (e) {
    setSaveStatus('error');
    console.error(e);
  }
}

// Bouton « Sauvegarder » : sauvegarde manuelle explicite (avec toast)
async function saveAll() {
  if (!currentLead) return;
  clearTimeout(autosaveTimer);
  setSaveStatus('saving');
  try {
    await patchLead(currentLead.id, buildPayload());
    currentLead.notes = document.getElementById('notesLibres').value;
    setSaveStatus('saved');
    showToast('💾 Fiche sauvegardée');
  } catch (e) {
    setSaveStatus('error');
    showToast('⚠️ Erreur de sauvegarde — réessaie');
    console.error(e);
  }
}

/* ── Vue stats ─────────────────────────────────────────────────────────── */
function switchView(name) {
  document.getElementById('viewAppels').classList.toggle('active', name === 'appels');
  document.getElementById('viewStats').classList.toggle('active', name === 'stats');
  document.getElementById('tabAppels').classList.toggle('active', name === 'appels');
  document.getElementById('tabStats').classList.toggle('active', name === 'stats');
  if (name === 'stats') loadStats();
}

async function loadStats() {
  let s;
  if (demoMode) {
    const actifs = leads.filter((l) => l.statut !== '✅ RDV booké');
    s = {
      total_leads: leads.length,
      presents_webi: actifs.filter((l) => l.webi === 'Présent').length,
      absents_webi: actifs.filter((l) => l.webi === 'Absent').length,
      rdv_bookes: rdvBookesDemo,
      taux_conversion: leads.length ? Math.round((rdvBookesDemo / leads.length) * 1000) / 10 : 0,
      injoignables: leads.filter((l) => l.statut === '❌ Injoignable').length,
      score_moyen: actifs.length ? Math.round((actifs.reduce((a, l) => a + l.score, 0) / actifs.length) * 10) / 10 : 0,
      appels_today: rdvBookesDemo,
      rdv_7_jours: [0, 1, 0, 2, 1, 0, rdvBookesDemo].map((c, i) => {
        const d = new Date(Date.now() - (6 - i) * 86_400_000);
        return { label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), count: c };
      }),
    };
  } else {
    try { s = await api('/api/stats'); }
    catch { document.getElementById('statsUpdated').textContent = '⚠️ Stats indisponibles'; return; }
  }

  document.getElementById('stTotal').textContent = s.total_leads;
  document.getElementById('stPresents').textContent = s.presents_webi;
  document.getElementById('stAbsents').textContent = s.absents_webi;
  document.getElementById('stRdv').textContent = s.rdv_bookes;
  document.getElementById('stTaux').textContent = s.taux_conversion + '%';
  document.getElementById('stScore').textContent = s.score_moyen + '/10';
  document.getElementById('stInjoignables').textContent = s.injoignables;
  document.getElementById('stAppels').textContent = s.appels_today;
  document.getElementById('statsUpdated').textContent =
    (demoMode ? 'Données de démonstration · ' : '') +
    'Actualisé le ' + new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  renderChart(s.rdv_7_jours || []);
  loadOnoffStats();
}

// Bascule la période (1=jour, 7=semaine, 30=mois) des stats Onoff
function setOnoffPeriod(days) {
  document.querySelectorAll('.onoff-period-btn').forEach((b) =>
    b.classList.toggle('active', Number(b.dataset.days) === days));
  loadOnoffStats(days);
}

// Stats d'appels réelles (Onoff). Section masquée si non configuré (404).
async function loadOnoffStats(days = 7) {
  const section = document.getElementById('onoffSection');
  if (demoMode) { section.classList.add('hidden'); return; }
  try {
    const o = await api('/api/onoff-stats?days=' + days);
    document.getElementById('onAppels').textContent = o.total;
    document.getElementById('onDecroche').textContent = o.answerRate + '%';
    document.getElementById('onConvos').textContent = o.realConvos;
    document.getElementById('onUniques').textContent = o.uniques;
    document.getElementById('onSms').textContent = o.smsSent;
    document.getElementById('onDuree').textContent = o.durationMin >= 60
      ? Math.floor(o.durationMin / 60) + 'h' + String(o.durationMin % 60).padStart(2, '0') : o.durationMin + ' min';
    document.getElementById('onMoy').textContent = o.avgSec + ' s';
    const top = (o.topHours || []).length ? `🕐 Meilleurs créneaux : <strong>${o.topHours.join(' · ')}</strong>` : '';
    document.getElementById('onoffExtra').innerHTML = top;
    section.classList.remove('hidden');
  } catch {
    section.classList.add('hidden'); // Onoff non branché → on masque la section
  }
}

function renderChart(serie) {
  if (!window.Chart) return;
  const ctx = document.getElementById('chartRdv');
  if (rdvChart) rdvChart.destroy();
  rdvChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: serie.map((d) => d.label),
      datasets: [{
        label: 'RDV bookés',
        data: serie.map((d) => d.count),
        borderColor: '#4d7c0f',
        backgroundColor: 'rgba(132, 204, 22, .14)',
        fill: true,
        tension: .35,
        pointBackgroundColor: '#4d7c0f',
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } },
      },
    },
  });
}

/* ── Utilitaires ───────────────────────────────────────────────────────── */
function show(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('active-step');
}
function hide(id) {
  const el = document.getElementById(id);
  el.classList.add('hidden');
  el.classList.remove('active-step');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimeout = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2800);
}

init();
