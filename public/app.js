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
    replay: 'https://les-instapreneurs.com/replay-conference-ia/',
  },
};
function webiTypeOf(lead) { return lead && lead.type_webi === 'ia' ? 'ia' : 'social'; }

/* ── Trames de conversation ────────────────────────────────────────────
   Ce ne sont PAS des textes à lire mot à mot : ce sont des repères.
   Sylvie formule à sa façon, vouvoiement obligatoire.
   {prenom} est remplacé automatiquement.                                */

const SUJET = { social: 'Instagram et les réseaux sociaux', ia: "l'intelligence artificielle" };

const SP_COMMON = {
  // Ce qu'il a réellement vu — on le demande UNE fois, formulé selon le tag.
  vuPresent: () =>
    `— Vous avez pu <strong>rester jusqu'à la fin</strong> ?`,
  vuAbsent: () =>
    `— Vous avez eu l'occasion de <strong>regarder le replay</strong> depuis ?`,

  // Pas de question ouverte bateau : on ouvre en proposant deux chemins.
  // La personne n'a plus qu'à se reconnaître dans l'un ou l'autre.
  interet: () =>
    `— Dites-moi, pour que je comprenne votre situation :`,

  // Préparer la personne à l'entretien : c'est le cœur du rôle.
  preparation: () =>
    `— Je vous explique comment va se dérouler la suite. <strong>Jordan va vous appeler.</strong> ` +
    `Ça dure une trentaine de minutes. Il va <strong>analyser votre situation</strong> et voir si ` +
    `la formation peut vraiment vous aider et vous apporter. ` +
    `<strong>Si ce n'est pas le cas, il vous le dira clairement.</strong>` +
    `<br><br>— Qu'est-ce que vous aimeriez qu'il regarde avec vous, ou qu'est-ce que vous voulez lui demander ?`,

  // Si le prospect demande explicitement le prix : on ne l'improvise pas.
  prixSiDemande: () =>
    `— Le tarif dépend de votre situation et de votre financement, et je préfère ne pas vous donner ` +
    `un chiffre approximatif. <strong>C'est Jordan qui vous le dira précisément</strong>, ` +
    `avec ce qui est finançable dans votre cas. C'est un accompagnement payant, ` +
    `je vous le dis franchement — l'échange avec lui, lui, est gratuit.`,

  // Rassurance — seulement si la personne doute du sérieux.
  rassurance: () =>
    `— Ça fait <strong>8 ans</strong> qu'on accompagne des entrepreneurs, ` +
    `<strong>plus de 5 000 à ce jour</strong>, et on est à <strong>4,8 sur 5 sur Trustpilot</strong>. ` +
    `L'accompagnement dure 6 semaines, avec un coach dédié et 6 rendez-vous individuels.`,
};

/* Les deux webinaires n'ont ni le même public ni les mêmes douleurs :
   tout ce qui suit est décliné. */
const SPEECHES = {
  social: {
    ...SP_COMMON,
    ouverturePresent: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, c'est <strong>Sylvie des Instapreneurs</strong>. ` +
      `Je vous appelle à la suite de la <strong>conférence de lundi</strong>. Vous avez quelques minutes ?`,
    ouvertureAbsent: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, c'est <strong>Sylvie des Instapreneurs</strong>. ` +
      `Vous vous étiez inscrit·e à notre <strong>conférence sur Instagram</strong>. Vous avez quelques minutes ?`,

    // Elle enchaîne : on propose, on ne laisse pas chercher.
    propositions: [
      'C\'est la magnifique publicité que vous avez vue passer sur Instagram ou Facebook ?',
      'Ou vous avez un projet, en tête ou déjà en cours, et vous aimeriez le développer grâce aux réseaux sociaux ?',
    ],
    // Les douleurs qu'on reconnaît chez ce public.
    douleurs: 'Et vous, le plus difficile, c\'est quoi ? La <strong>régularité</strong> ? ' +
      'Les <strong>retours qui ne suivent pas l\'effort</strong> ? ' +
      'Le <strong>temps passé pour peu de clients</strong> ?',

    intentionOffre: () =>
      `— Au vu de la présentation faite par <strong>Capucine</strong>, vous vous êtes dit qu'un de ` +
      `<strong>nos accompagnements</strong> pourrait potentiellement vous aider ?`,
    intentionDecouverte: () =>
      `— Ce que nous proposons, ce n'est pas une simple formation : c'est vraiment une ` +
      `<strong>méthodologie</strong> qui va vous permettre de <strong>gagner du temps</strong> et ` +
      `d'être <strong>efficace sur vos réseaux</strong>, de la recherche d'idées jusqu'à la vente.`,

    rdv: () =>
      `— Ce que vous me décrivez, on le travaille pendant <strong>notre accompagnement</strong>. ` +
      `L'avantage, c'est que vous êtes en <strong>visio individuelle avec votre coach</strong> et que ` +
      `vous travaillez <strong>sur votre projet</strong> — à l'issue, la valeur ajoutée est énorme. ` +
      `Vous pouvez en parler avec <strong>Jordan</strong> : c'est gratuit et sans engagement.`,

    sms: (p) =>
      `${p || 'Bonjour'} ! Sylvie des Instapreneurs 👋\n` +
      `Je vous ai appelé·e deux fois et je ne tombe visiblement pas au bon moment 😄\n` +
      `C'était au sujet de la conférence Instagram à laquelle vous vous étiez inscrit·e.\n` +
      `Un mot et je vous rappelle quand ça vous arrange — même dans 3 semaines, je ne suis pas vexée.`,
  },

  ia: {
    ...SP_COMMON,
    ouverturePresent: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, c'est <strong>Sylvie des Instapreneurs</strong>. ` +
      `Je vous appelle à la suite de la <strong>conférence de mercredi</strong>. Vous avez quelques minutes ?`,
    ouvertureAbsent: (p) =>
      `— Bonjour${p ? ' ' + p : ''}, c'est <strong>Sylvie des Instapreneurs</strong>. ` +
      `Vous vous étiez inscrit·e à notre <strong>conférence sur l'intelligence artificielle</strong>. ` +
      `Vous avez quelques minutes ?`,

    propositions: [
      'C\'est la magnifique publicité que vous avez vue passer sur Instagram ou Facebook ?',
      'Ou vous avez un projet, en tête ou déjà en cours, et vous aimeriez l\'accélérer grâce à l\'IA ?',
    ],
    douleurs: 'Et vous, vous êtes comme beaucoup : <strong>noyé·e sous les nouveaux sujets IA</strong> ' +
      'qui sortent chaque seconde ? Peur de <strong>faire le mauvais choix</strong> ? ' +
      'Ou vous ne savez tout simplement pas <strong>par où commencer</strong> ?',

    intentionOffre: () =>
      `— Au vu de la présentation faite par <strong>Capucine</strong>, vous vous êtes dit qu'un de ` +
      `<strong>nos accompagnements</strong> pourrait potentiellement vous aider ?`,
    intentionDecouverte: () =>
      `— Ce que nous proposons, ce n'est pas une simple formation : c'est vraiment une ` +
      `<strong>méthodologie</strong> qui va vous permettre de <strong>gagner du temps</strong> et ` +
      `d'utiliser l'IA <strong>efficacement dans votre activité</strong>, sans vous perdre dans les outils.`,

    rdv: () =>
      `— Ce que vous me décrivez, on le travaille pendant <strong>notre accompagnement</strong>. ` +
      `L'avantage, c'est que vous êtes en <strong>visio individuelle avec votre coach</strong> et que ` +
      `vous travaillez <strong>sur votre projet</strong> — à l'issue, la valeur ajoutée est énorme. ` +
      `Vous pouvez en parler avec <strong>Jordan</strong> : c'est gratuit et sans engagement.`,

    sms: (p) =>
      `${p || 'Bonjour'} ! Sylvie des Instapreneurs 👋\n` +
      `Je vous ai appelé·e deux fois et je ne tombe visiblement pas au bon moment 😄\n` +
      `C'était au sujet de la conférence IA à laquelle vous vous étiez inscrit·e.\n` +
      `Un mot et je vous rappelle quand ça vous arrange — même dans 3 semaines, je ne suis pas vexée.`,
  },
};

/* Relances facultatives — affichées sous la question principale, à piocher. */
const RELANCES = {
  interet: [
    'Vous faites quoi comme activité ?',
    'Et aujourd’hui, comment vous faites ?',
    'Vous avez déjà essayé ? Qu’est-ce que ça a donné ?',
  ],
  besoin: [
    'Qu’est-ce qui bloque, concrètement ?',
    'C’est comme ça depuis longtemps ?',
    'Et si ça marchait, ça changerait quoi pour vous ?',
  ],
  hesitation: [
    { t: 'Il parle de budget',
      q: 'Investir dans sa réussite, ça fait peur, je comprends. Je peux vous rassurer sur deux choses : ça fait 8 ans qu\'on accompagne des entrepreneurs, et si on n\'avait pas de résultats on aurait déjà mis la clé sous la porte, avec la concurrence qu\'on voit partout. Et on est éligibles à tous les modes de financement — on peut aussi vous proposer un échelonnement.' },
    { t: 'Il ne veut pas s’engager',
      q: 'Si vous comptez passer par un financement, sachez que les règles se durcissent : l\'État resserre les budgets de la formation. Ce n\'est pas de la pression, c\'est juste que les conditions d\'aujourd\'hui ne seront pas forcément celles de l\'an prochain.' },
    { t: 'Il dit qu’il va réfléchir',
      q: 'Bien sûr. Il vous manque quelle information pour y voir clair ?' },
    { t: 'Ce n’est pas lui qui décide',
      q: 'Vous en parlez avec qui ? Ce serait utile que la personne soit là pendant l\'échange ?' },
  ],
};

/* Éléments de rassurance — publics et vérifiables, à sortir SEULEMENT si la
   personne doute du sérieux. Source : page formation du site, 04/11/2026.    */
const RASSURANCE = [
  { k: '4,8 / 5', v: 'sur Trustpilot, avis vérifiés' },
  { k: '+ 5 000', v: 'entrepreneurs accompagnés' },
  { k: '6 semaines', v: '9 modules + 6 rendez-vous individuels avec un coach dédié' },
  { k: 'RS7692', v: 'certification enregistrée au Répertoire spécifique' },
  { k: '91 %', v: 'de réussite au jury — arrêté au 1ᵉʳ déc. 2025, sur la certification précédente (RS6702)' },
];

/* Le ciblage : à quoi on reconnaît un rendez-vous qui a du sens. */
const SIGNAUX = {
  pour: [
    'Un besoin concret, qu\'on sait traiter dans le programme',
    'Une activité réelle, ou un projet déjà engagé',
    'L\'envie d\'avancer, même sans date précise',
    'C\'est elle qui décide, ou elle sait avec qui',
  ],
  contre: [
    'Elle cherche surtout un conseil gratuit',
    'Ni activité ni projet — rien à travailler',
    'Le besoin est hors programme',
    'Elle a dit non clairement',
  ],
  jamais: [
    'Elle ne connaît pas son financement',
    'Elle n\'a pas de date en tête',
    'Elle hésite',
  ],
};

/* Garde-fous : ce qui ne doit pas sortir au téléphone. */
const GARDE_FOUS = [
  '<b>Vous ne vendez pas.</b> Vous préparez l\'échange avec Jordan — c\'est lui qui vend.',
  '<b>Ne pas annoncer de tarif.</b> Le prix dépend de la situation et du financement.',
  'Ne pas dérouler les chiffres de rassurance par défaut : <b>seulement si on doute du sérieux</b>.',
  'Ne pas promettre une <b>prise en charge totale</b> ni un reste à charge nul.',
  '<b>Sur le durcissement des financements</b> : dire que les règles se durcissent, <b>jamais</b> annoncer une date butoir, un montant de reste à charge ni « c\'est le dernier moment » — rien de tout cela n\'est confirmé par un texte publié.',
  'Ne jamais promettre un résultat commercial (« vous vivrez de votre activité »).',
  'Le <b>91 % de réussite</b> date du 1ᵉʳ déc. 2025 et porte sur la certification précédente — le dire comme tel.',
];


/* Mots qui sortent du programme — simple alerte, jamais un blocage. */
const HORS_PROGRAMME = [
  'montage vidéo', 'montage video', 'site web', 'site internet', 'wordpress', 'seo',
  'référencement', 'referencement', 'comptabilité', 'comptabilite', 'juridique',
  'immobilier', 'trading', 'dropshipping', 'tiktok ads', 'google ads',
];

// Jeu de trames adapté au webinaire d'origine du lead
function speechesFor(lead) { return SPEECHES[webiTypeOf(lead)]; }
function sujetFor(lead) { return SUJET[webiTypeOf(lead)]; }

/* ── Réponses à cocher ─────────────────────────────────────────────────
   Volontairement courtes : l'interface sert à noter vite, pas à remplir
   un formulaire. Tout ce qui est nuancé va dans les champs texte.        */
const OPTIONS = {
  repondu: [
    { label: 'A décroché', value: 'oui', tone: 'oui' },
    { label: 'Pas de réponse', value: 'non', tone: 'non' },
  ],
  // Ce qu'il a RÉELLEMENT vu — distinct du tag de présence, qui reste intact.
  vu: [
    { label: 'Rien vu', value: 'rien', tone: 'neutral', sub: 'ni la conférence ni le replay' },
    { label: 'Une partie', value: 'partie', tone: 'neutral', sub: 'sans voir la présentation de la formation' },
    { label: 'Vu la formation présentée', value: 'offre', tone: 'oui', sub: 'en direct ou en replay' },
    { label: 'Ne sait plus', value: 'inconnu', tone: 'neutral' },
  ],
  statut: [
    'Salarié·e', 'Indépendant·e', 'Demandeur·se d\'emploi', 'Retraité·e',
    'Chef·fe d\'entreprise', 'Association', 'En reconversion', 'Autre',
  ],
  intention: [
    { label: 'Envisage une formation', value: 'formation', tone: 'oui' },
    { label: 'Veut découvrir le sujet', value: 'decouverte', tone: 'neutral' },
    { label: 'Ne sait pas encore', value: 'inconnu', tone: 'neutral' },
    { label: 'Non, clairement', value: 'non', tone: 'non' },
  ],
  echeance: [
    { label: 'Dès que possible', value: 'maintenant' },
    { label: 'Dans 1 à 3 mois', value: '1-3 mois' },
    { label: 'Plus tard', value: 'plus tard' },
    { label: 'Ne sait pas', value: 'inconnu' },
  ],
  decision: [
    { label: 'Décide seul·e', value: 'seul' },
    { label: 'Avec son conjoint', value: 'conjoint' },
    { label: 'Avec un associé', value: 'associe' },
    { label: 'Conseil d\'administration', value: 'ca' },
    { label: 'Autre', value: 'autre' },
  ],
  financement: [
    { label: 'CPF', value: 'CPF' },
    { label: 'OPCO', value: 'OPCO' },
    { label: 'France Travail', value: 'France Travail' },
    { label: 'Autofinancement', value: 'Autofinancement' },
    { label: 'À vérifier', value: 'À vérifier' },
    { label: 'Difficulté exprimée', value: 'Difficulté exprimée', tone: 'non' },
  ],
  // Le jugement de Sylvie : ce rendez-vous a-t-il du sens pour Jordan ?
  ciblage: [
    { label: 'Oui, ça vaut le coup', value: 'oui', tone: 'oui', sub: 'un besoin qu\'on sait traiter' },
    { label: 'À reprendre plus tard', value: 'plus-tard', tone: 'neutral', sub: 'intéressée, mais pas maintenant' },
    { label: 'Non, ça ne servirait à rien', value: 'non', tone: 'non', sub: 'ce n\'est pas un échec — c\'est un créneau préservé' },
  ],
  issue: [
    { label: 'Rendez-vous avec Jordan', value: 'rdv', tone: 'oui' },
    { label: 'Replay / prochaine conférence', value: 'replay', tone: 'orange', sub: 'seulement s\'il le demande' },
    { label: 'Rappeler à une date', value: 'rappel', tone: 'neutral' },
    { label: 'Pas de suite', value: 'non', tone: 'non' },
  ],
  objections: [
    'Pas le temps', 'Budget', 'Doit en parler', 'Veut réfléchir',
    'Pas le bon moment', 'Pas concerné par le sujet', 'Déjà formé ailleurs',
    'Ne veut plus être contacté·e',
  ],
};

// Rien ne dépend plus du webinaire côté réponses : la trame de conversation
// s'en charge. On garde la fonction pour ne pas casser les appels existants.
function optFor(key) { return OPTIONS[key]; }

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
    repondu: null, nbTentatives: 0,
    vu: null,                      // 'rien' | 'partie' | 'offre' | 'inconnu'
    activite: '', statut: null,
    besoin: '',
    intention: null,               // 'formation' | 'decouverte' | 'inconnu' | 'non'
    echeance: null, decision: null,
    financement: null, ciblage: null, questionJordan: '',
    issue: null,
    objections: [], objectionDetail: '',
  };
}

/* Libellés lisibles pour le résumé transmis à Jordan */
const LBL_VU = {
  rien: "n'a vu ni la conférence ni le replay",
  partie: "a vu une partie, sans la présentation de la formation",
  offre: 'a vu la présentation de la formation',
  inconnu: 'ne se souvient pas de ce qu’il a vu',
};
const LBL_INTENTION = {
  formation: 'envisage une formation',
  decouverte: 'veut d’abord découvrir le sujet',
  inconnu: 'ne sait pas encore',
  non: 'pas intéressé',
};

/* ── Helpers API ───────────────────────────────────────────────────────── */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    // Remonte le message d'erreur du serveur s'il y en a un (plus parlant)
    let msg = `API ${path} → ${res.status}`;
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch { /* corps non-JSON */ }
    throw new Error(msg);
  }
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
  // Activité (étape 3)
  const act = document.getElementById('qActivite');
  if (act) act.addEventListener('input', (e) => { call.activite = e.target.value; saveQualif(); });
  // Besoin, dans les mots de la personne (étape 3)
  const bes = document.getElementById('qBesoin');
  if (bes) bes.addEventListener('input', (e) => {
    call.besoin = e.target.value; checkCouverture(); saveQualif();
  });
  // Ce que la personne veut demander à Jordan (préparation du RDV)
  const qj = document.getElementById('qQuestionJordan');
  if (qj) qj.addEventListener('input', (e) => { call.questionJordan = e.target.value; saveQualif(); });
  // Date de reprise de contact (étape 6)
  const rap = document.getElementById('rappelDate');
  if (rap) rap.addEventListener('change', () => scheduleAutosave());
  // Détail de ce qui a été dit en cas de refus
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
  // « Booké » = uniquement un vrai RDV plateforme (statut ✅ RDV booké). On IGNORE
  // le flag `a_reserve` de System.io (résa côté System.io ≠ RDV plateforme) →
  // ces fiches sont classées selon leur statut setter réel.
  if (l.statut === '✅ RDV booké') return 'booke';
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
  // Tentatives (étape 1)
  const nt = lead.nb_tentatives || 0;
  if (nt >= 1 && nt <= 3) {
    const btn = [...document.getElementById('tentativesRow').children][nt - 1];
    if (btn) btn.classList.add('sel-hi');
  }
  // Activité / statut déjà connus
  if (lead.situation_pro) {
    const parts = String(lead.situation_pro).split(' · ').map((x) => x.trim());
    const statut = parts.find((x) => OPTIONS.statut.includes(x));
    const activite = parts.filter((x) => x !== statut).join(' · ');
    if (activite) { document.getElementById('qActivite').value = activite; call.activite = activite; }
    if (statut) { preselectSingle('chipsStatut', statut, 'selected-oui'); call.statut = statut; }
  }
  // Besoin déjà noté
  if (lead.objectif) { document.getElementById('qBesoin').value = lead.objectif; call.besoin = lead.objectif; }
  // Financement déjà détecté
  if (lead.financement && OPTIONS.financement.some((o) => o.value === lead.financement)) {
    preselectSingle('chipsFinancement', lead.financement, 'selected-oui');
    call.financement = lead.financement;
  }
  // Ce qui a été dit en cas de refus
  let hasObjection = false;
  if (lead.objection) {
    const parts = String(lead.objection).split(' · ').map((x) => x.trim()).filter(Boolean);
    const detail = parts.find((x) => x.startsWith('«'));
    const objs = parts.filter((x) => !x.startsWith('«'));
    preselectMulti('chipsObjections', objs); call.objections = objs;
    if (detail) {
      const d = detail.replace(/^«\s?/, '').replace(/\s?»$/, '');
      document.getElementById('objectionDetail').value = d; call.objectionDetail = d;
    }
    hasObjection = objs.length > 0 || !!detail;
  }
  // Rouvrir les étapes déjà travaillées
  const dejaTravaille = call.activite || call.besoin || call.statut || hasObjection
    || (lead.statut && lead.statut !== '📞 À appeler');
  if (dejaTravaille) {
    document.getElementById('step0').classList.add('done-step');
    reveal('step1', true); reveal('step2'); reveal('step3'); reveal('step5');
    if (lead.statut === '🚫 Pas intéressé') preselectSingle('chipsIssue', 'non', 'selected-non');
    if (lead.statut === '🔄 À rappeler') preselectSingle('chipsIssue', 'rappel', 'selected-neutral');
    if (lead.statut === '🔄 À réinscrire') preselectSingle('chipsIssue', 'replay', 'selected-orange');
  }
  if (hasObjection) showObjections(true);
  renderResume();
}

// Récap clair, en haut de la fiche, de tout ce qui a déjà été saisi
// (pour qu'en rouvrant une fiche on voie l'historique d'un coup d'œil).
function renderFicheRecap(lead) {
  const box = document.getElementById('ficheRecap');
  if (!box) return;
  const rows = [];
  if (lead.statut && lead.statut !== '📞 À appeler') rows.push(['Statut', lead.statut]);
  if (lead.nb_tentatives) rows.push(['Tentatives', lead.nb_tentatives + ' appel' + (lead.nb_tentatives > 1 ? 's' : '')]);
  if (lead.situation_pro) rows.push(['Activité / statut', lead.situation_pro]);
  if (lead.objectif) rows.push(['Ce qu\'il cherche à régler', lead.objectif]);
  if (lead.objection) rows.push(['Réserves exprimées', lead.objection]);
  // Champs de l'ancien script, conservés pour les fiches déjà travaillées
  if (lead.positifs) rows.push(['Ce qui a plu (ancien script)', lead.positifs]);
  if (lead.manques) rows.push(['Ce qui a manqué (ancien script)', lead.manques]);
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
  if (L.replay) {
    rows.push(resLink('▶️ Replay', L.replay));
    // Envoi du replay par email (fenêtre de validation avant envoi)
    if (lead.email) {
      rows.push(
        `<button class="btn-mail-replay" onclick="openEmailModal()">` +
        `✉️ Envoyer le replay par email à ${esc(lead.prenom || lead.nom || 'ce prospect')}</button>`
      );
    }
  } else {
    rows.push('<div class="res-muted">▶️ Replay : à venir</div>');
  }
  box.innerHTML = rows.join('');
}

/* ── Email replay : fenêtre de validation puis envoi (signé Sylvie) ────── */
function emailTemplateFor(lead) {
  const type = webiTypeOf(lead);
  const L = LINKS[type];
  const prenom = (lead.prenom || (lead.nom || '').trim().split(/\s+/)[0] || '').trim();
  const sujet = type === 'ia'
    ? 'Votre replay — conférence sur l\'IA 🎬'
    : 'Votre replay — conférence Instagram 🎬';
  const theme = type === 'ia'
    ? 'notre conférence gratuite sur l\'intelligence artificielle'
    : 'notre conférence gratuite sur Instagram';
  const corps =
`Bonjour${prenom ? ' ' + prenom : ''},

Suite à notre échange, voici le lien pour (re)voir ${theme} :
${L.replay}

Bon visionnage ! Et si vous avez la moindre question, répondez simplement à cet email.

À très vite,`;
  return { to: lead.email || '', subject: sujet, body: corps };
}

function openEmailModal() {
  if (!currentLead) return;
  const t = emailTemplateFor(currentLead);
  document.getElementById('emailTo').value = t.to;
  document.getElementById('emailSubject').value = t.subject;
  document.getElementById('emailBody').value = t.body;
  document.getElementById('emailModal').classList.remove('hidden');
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.add('hidden');
}

async function sendReplayEmailNow() {
  const to = document.getElementById('emailTo').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const body = document.getElementById('emailBody').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { showToast('⚠️ Adresse email invalide'); return; }
  if (!subject) { showToast('⚠️ L\'objet est vide'); return; }
  if (!body.trim()) { showToast('⚠️ Le message est vide'); return; }
  if (demoMode) { closeEmailModal(); showToast('Mode démo — email non envoyé'); return; }

  const btn = document.getElementById('emailSendBtn');
  btn.disabled = true; btn.textContent = 'Envoi…';
  try {
    await api('/api/email/send', { method: 'POST', body: JSON.stringify({ to, subject, body }) });
    closeEmailModal();
    showToast('✉️ Email envoyé à ' + to);
    // Trace l'envoi dans les notes de la fiche
    if (currentLead) {
      const d = new Date();
      const stamp = `📧 Replay envoyé le ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const notesEl = document.getElementById('notesLibres');
      notesEl.value = (notesEl.value ? notesEl.value + '\n' : '') + stamp;
      scheduleAutosave();
    }
  } catch (e) {
    console.error(e);
    showToast('⚠️ Échec de l\'envoi : ' + (e.message || 'erreur inconnue'));
  } finally {
    btn.disabled = false; btn.textContent = '✉️ Envoyer';
  }
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
  const ia = webiTypeOf(lead) === 'ia';
  block.innerHTML =
    `<div class="res-title">Que souhaite-t-il recevoir ?</div>` +
    `<p class="mini-note">Rien n'est envoyé tant que vous ne cliquez pas. ` +
    `Ne réinscrivez que s'il l'a demandé.</p>` +
    (L.replay ? resLink('▶️ Lien du replay', L.replay) : '') +
    resLink(ia ? '📝 Inscription conférence IA (mercredi)' : '📝 Inscription conférence (lundi)', L.inscription) +
    (ia
      ? `<p class="mini-note">Conférence IA : envoyez le lien d'inscription vous-même — ` +
        `le tag « Réinscrit webi » ne s'applique qu'au lundi.</p>`
      : `<button class="btn-copy" onclick="confirmerReinscription()">✔️ Réinscrire à la conférence de lundi</button>` +
        `<p class="mini-note">Ce bouton pose le tag System.io « Réinscrit webi », ` +
        `qui déclenche les e-mails d'invitation.</p>`);
}

// Réinscription effective : c'est le SEUL endroit qui pose le tag System.io.
async function confirmerReinscription() {
  if (!currentLead) return;
  try {
    setSaveStatus('saving');
    await patchLead(currentLead.id, { statut: '🔄 À réinscrire' });
    setSaveStatus('saved');
    showToast('✅ Réinscription demandée — tag System.io posé');
  } catch (e) {
    setSaveStatus('error');
    showToast('⚠️ ' + e.message);
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
  renderTypedChips(currentLead); // réponses adaptées au webinaire (IA / réseaux sociaux)
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

  // Trames de conversation — l'ouverture dépend du tag présent/absent,
  // que l'on ne redemande donc PAS pendant l'appel.
  const sp = speechesFor(currentLead);
  const present = currentLead.webi === 'Présent';
  document.getElementById('speechOuverture').innerHTML =
    present ? sp.ouverturePresent(prenom) : sp.ouvertureAbsent(prenom);
  document.getElementById('hintOuverture').innerHTML = present
    ? 'Fiche taguée <b>présent</b> — il a pu partir avant la présentation de la formation.'
    : 'Fiche taguée <b>absent</b> — il a pu regarder le replay depuis.';
  document.getElementById('speechVu').innerHTML = present ? sp.vuPresent() : sp.vuAbsent();
  document.getElementById('speechInteret').innerHTML = sp.interet();
  document.getElementById('speechDouleurs').innerHTML = '— ' + sp.douleurs;
  document.getElementById('propositionsList').innerHTML =
    sp.propositions.map((q) => `<span class="relance prop">${esc(q)}</span>`).join('');
  document.getElementById('speechRassurance').innerHTML = sp.rassurance();
  document.getElementById('speechPrixSiDemande').innerHTML = sp.prixSiDemande();
  document.getElementById('speechPreparation').innerHTML = sp.preparation();
  document.getElementById('speechRdv').innerHTML = sp.rdv();
  document.getElementById('speechSms').textContent = sp.sms(prenom);
  fillIntentionSpeech();
  renderRelances();
  renderGardeFous();
  renderPreuves();

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
  ['step1', 'step2', 'step3', 'step4', 'step5', 'stepResume', 'objectionStep'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
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
  document.getElementById('rappelSection').classList.add('hidden');
  ['rdvDate', 'rdvTime', 'rappelDate', 'qActivite', 'qQuestionJordan', 'objectionDetail'].forEach((id) => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const besoin = document.getElementById('qBesoin'); if (besoin) besoin.value = '';
  const warn = document.getElementById('couvertureWarn');
  if (warn) { warn.classList.add('hidden'); warn.innerHTML = ''; }
}

/* ── Relances facultatives : des repères, pas un texte à lire ─────────── */
function renderRelances() {
  const put = (id, items) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.map((q) => `<span class="relance">${esc(q)}</span>`).join('');
  };
  put('relancesInteret', RELANCES.interet);
  put('relancesBesoin', RELANCES.besoin);
  const h = document.getElementById('relancesHesitation');
  if (h) {
    h.innerHTML = '<div class="relance-title">S’il hésite — comprendre, pas retourner l’objection</div>' +
      RELANCES.hesitation.map((r) =>
        `<div class="relance-pair"><b>${esc(r.t)}</b><span>${esc(r.q)}</span></div>`).join('');
  }
}

function renderPreuves() {
  const el = document.getElementById('rassuranceList');
  if (el) {
    el.innerHTML = RASSURANCE.map((p) =>
      `<div class="preuve"><b>${p.k}</b><span>${p.v}</span></div>`).join('');
  }
  const sg = document.getElementById('signauxList');
  if (sg) {
    const col = (titre, items, cls) =>
      `<div class="sig-col ${cls}"><div class="sig-t">${titre}</div><ul>` +
      items.map((i) => `<li>${i}</li>`).join('') + '</ul></div>';
    sg.innerHTML =
      col('Ça vaut le coup si', SIGNAUX.pour, 'sig-pour') +
      col('Ça n\'en vaut pas la peine si', SIGNAUX.contre, 'sig-contre') +
      col('Jamais une raison d\'écarter', SIGNAUX.jamais, 'sig-jamais');
  }
}

/* Le ciblage : c'est ici que Sylvie décide, et elle a le droit de dire non. */
function onCiblage(val) {
  call.ciblage = val;
  const s4 = document.getElementById('step4');
  s4.classList.remove('active-step'); s4.classList.add('done-step');
  reveal('step5', true);
  if (val === 'non') {
    preselectSingle('chipsIssue', 'non', 'selected-non');
    onIssue('non');
  } else if (val === 'plus-tard') {
    preselectSingle('chipsIssue', 'rappel', 'selected-neutral');
    onIssue('rappel');
  }
  saveQualif();
}

function renderGardeFous() {
  const el = document.getElementById('gardeFouPrix');
  if (!el) return;
  el.innerHTML = '<div class="gf-title">⚠️ À ne pas dire</div><ul>' +
    GARDE_FOUS.map((g) => `<li>${g}</li>`).join('') + '</ul>';
}

/* Alerte douce quand le besoin exprimé sort visiblement du programme. */
function checkCouverture() {
  const warn = document.getElementById('couvertureWarn');
  if (!warn) return;
  const txt = (call.besoin || '').toLowerCase();
  const hit = HORS_PROGRAMME.find((k) => txt.includes(k));
  if (hit) {
    warn.innerHTML = `⚠️ « ${esc(hit)} » n’est pas forcément couvert par le programme. ` +
      `Vérifiez avant de proposer le rendez-vous : un intérêt pour le sujet n’est pas une intention d’achat.`;
    warn.classList.remove('hidden');
  } else {
    warn.classList.add('hidden'); warn.innerHTML = '';
  }
}

/* ── Résumé transmis à Jordan ──────────────────────────────────────────
   Objectif : qu'il n'ait pas à refaire toute la conversation.            */
function buildResume() {
  if (!currentLead) return '';
  const l = [];
  const sujet = webiTypeOf(currentLead) === 'ia' ? 'conférence IA' : 'conférence réseaux sociaux';
  l.push(`Appelé·e par Sylvie — ${sujet} (fiche taguée ${currentLead.webi.toLowerCase()}).`);
  if (call.vu) l.push(`A vu : ${LBL_VU[call.vu]}.`);
  const qui = [call.activite, call.statut].filter(Boolean).join(' · ');
  if (qui) l.push(`Activité : ${qui}.`);
  if (call.besoin) l.push(`Ce qu'il cherche à régler, dans ses mots : « ${call.besoin.trim()} »`);
  if (call.intention) l.push(`Où il en est : ${LBL_INTENTION[call.intention]}.`);
  if (call.echeance) l.push(`Échéance : ${call.echeance}.`);
  if (call.decision && call.decision !== 'seul') {
    const d = (OPTIONS.decision.find((o) => o.value === call.decision) || {}).label || call.decision;
    l.push(`Décision : ${d}.`);
  }
  if (call.financement) l.push(`Financement : ${call.financement}.`);
  if (call.questionJordan) l.push(`Ce qu'elle veut vous demander : « ${call.questionJordan.trim()} »`);
  l.push('Aucun tarif ne lui a été annoncé.');
  if (call.issue) {
    const i = (OPTIONS.issue.find((o) => o.value === call.issue) || {}).label || call.issue;
    l.push(`Suite convenue : ${i}.`);
  }
  if (call.objections.length || call.objectionDetail) {
    const o = [...call.objections]; if (call.objectionDetail) o.push(`« ${call.objectionDetail} »`);
    l.push(`Réserves exprimées : ${o.join(' · ')}.`);
  }
  const notes = (document.getElementById('notesLibres') || {}).value || '';
  if (notes.trim()) l.push(`Note de Sylvie : ${notes.trim()}`);
  return l.join('\n');
}

function renderResume() {
  const box = document.getElementById('resumeJordan');
  if (!box) return;
  const txt = buildResume();
  const step = document.getElementById('stepResume');
  if (!txt || !call.vu) { if (step) step.classList.add('hidden'); return; }
  box.textContent = txt;
  if (step) step.classList.remove('hidden');
}

function copyResume() {
  const txt = (document.getElementById('resumeJordan') || {}).textContent || '';
  if (!txt) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(
      () => showToast('📋 Résumé copié'),
      () => showToast('⚠️ Copie impossible — sélectionnez le texte'));
  } else showToast('⚠️ Copie impossible — sélectionnez le texte');
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
  renderChipGroup('chipsVu', OPTIONS.vu, { onSelect: onVu });
  renderChipGroup('chipsStatut', OPTIONS.statut, { onSelect: (v) => { call.statut = v; saveQualif(); } });
  renderChipGroup('chipsIntention', OPTIONS.intention, { onSelect: onIntention });
  renderChipGroup('chipsEcheance', OPTIONS.echeance, { onSelect: (v) => { call.echeance = v; saveQualif(); } });
  renderChipGroup('chipsDecision', OPTIONS.decision, { onSelect: (v) => { call.decision = v; saveQualif(); } });
  renderChipGroup('chipsFinancement', OPTIONS.financement, { onSelect: (v) => { call.financement = v; saveQualif(); } });
  renderChipGroup('chipsCiblage', OPTIONS.ciblage, { onSelect: onCiblage });
  renderChipGroup('chipsIssue', OPTIONS.issue, { onSelect: onIssue });
  renderChipGroup('chipsObjections', OPTIONS.objections, { multi: true, onSelect: (v) => { call.objections = v; saveObjection(); } });
  renderRelances();
  renderGardeFous();
  renderPreuves();
}

// Conservé pour compatibilité : plus aucune réponse ne dépend du webinaire.
function renderTypedChips() { /* no-op */ }

// Enregistre la qualification au fil de l'eau + rafraîchit le résumé Jordan
function saveQualif() {
  renderResume();
  scheduleAutosave();
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

/* ── Parcours : ce qu'il a réellement vu ───────────────────────────────
   On ne touche PAS au tag de présence : cette précision est une donnée
   distincte, recueillie pendant l'appel.                                 */
function onVu(val) {
  call.vu = val;
  const s1 = document.getElementById('step1');
  s1.classList.remove('active-step'); s1.classList.add('done-step');
  reveal('step2', true);
  fillIntentionSpeech();
  reveal('step3');
  scheduleAutosave();
}

// La question d'intention dépend de ce qu'il a vu.
function fillIntentionSpeech() {
  const sp = speechesFor(currentLead);
  const el = document.getElementById('speechIntention');
  if (!el) return;
  el.innerHTML = call.vu === 'offre'
    ? sp.intentionOffre()
    : sp.intentionDecouverte(sujetFor(currentLead));
}

function onIntention(val) {
  call.intention = val;
  const s3 = document.getElementById('step3');
  s3.classList.remove('active-step'); s3.classList.add('done-step');

  if (val === 'non') {
    // Refus clair : on respecte, on ne propose rien.
    hide('step4');
    reveal('step5', true);
    preselectSingle('chipsIssue', 'non', 'selected-non');
    onIssue('non');
  } else if (val === 'decouverte') {
    // Il veut découvrir : pas de rendez-vous forcé.
    hide('step4');
    reveal('step5', true);
  } else {
    // Envisage une formation, ou ne sait pas encore → Sylvie juge si le
    // rendez-vous a du sens avant de le proposer.
    reveal('step4', true);
  }
  scheduleAutosave();
}

/* ── Issue de l'appel ──────────────────────────────────────────────────
   Quatre suites possibles, aucune automatique : rien n'est envoyé ni
   réinscrit sans que Sylvie le fasse explicitement.                      */
function onIssue(val) {
  call.issue = val;
  const booking = document.getElementById('bookingSection');
  const rappel = document.getElementById('rappelSection');
  const replay = document.getElementById('reinscritBlock');
  booking.classList.add('hidden');
  rappel.classList.add('hidden');
  replay.classList.remove('show');
  showObjections(false);

  if (val === 'rdv') {
    booking.classList.remove('hidden');
  } else if (val === 'replay') {
    replay.classList.add('show');
    fillReinscritBlock(currentLead);
    // Aucun tag System.io n'est posé ici : la réinscription est un geste
    // explicite, déclenché par le bouton du bloc ci-dessous.
    setStatut('🔄 À réinscrire', '🟠 Noté — choisissez ensuite ce que vous lui envoyez', { skip_sio: true });
  } else if (val === 'rappel') {
    rappel.classList.remove('hidden');
    setStatut('🔄 À rappeler', '🔄 Reprise de contact notée');
  } else {
    setStatut('🚫 Pas intéressé', '🚫 Pas de suite — on note pourquoi');
    showObjections(true);
  }
  renderResume();
  scheduleAutosave();
}

// Affiche/masque le bloc « pas de suite » (recueil du pourquoi)
function showObjections(show) {
  const el = document.getElementById('objectionStep');
  if (!el) return;
  el.classList.toggle('hidden', !show);
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

async function confirmerRDV() {
  if (!currentLead) return;
  const d = document.getElementById('rdvDate').value;
  const t = document.getElementById('rdvTime').value;
  if (!d) { showToast('⚠️ Choisissez une date pour le rendez-vous'); return; }
  const dateRdv = t ? `${d}T${t}` : d;
  try {
    setSaveStatus('saving');
    await api(`/api/leads/${currentLead.id}/book`, {
      method: 'POST', body: JSON.stringify({ date_rdv: dateRdv, resume: buildResume() }),
    });
    await patchLead(currentLead.id, buildPayload());
    currentLead.statut = '✅ RDV booké';
    currentLead.date_rdv = dateRdv;
    setSaveStatus('saved');
    showToast('✅ Rendez-vous confirmé — le résumé est transmis à Jordan');
    renderLeads(); updateSidebarStats(); renderResume();
  } catch (e) {
    setSaveStatus('error');
    showToast('⚠️ ' + e.message);
  }
}

function buildPayload() {
  const payload = {
    notes: document.getElementById('notesLibres').value,
    nb_tentatives: call.nbTentatives,
  };
  // Activité + statut professionnel → un seul champ existant
  const situation = [call.activite, call.statut].filter(Boolean).join(' · ');
  if (situation) payload.situation_pro = situation;
  // Le besoin, dans les mots de la personne → champ « Objectif déclaré »
  if (call.besoin) payload.objectif = call.besoin;
  if (call.financement) payload.financement = call.financement;
  // Le résumé part vers noCRM au moment du booking (seul outil que lit Jordan),
  // pas dans Notion : on évite de dupliquer une information vivante.
  // Date de reprise de contact, si convenue
  const rappel = document.getElementById('rappelDate');
  if (call.issue === 'rappel' && rappel && rappel.value) payload.date_rdv = rappel.value;
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
