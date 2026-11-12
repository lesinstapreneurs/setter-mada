// ─────────────────────────────────────────────────────────────────────────
// Client noCRM.io — pousse un lead dans le pipeline quand un RDV est booké.
// API REST v2 : https://<sous-domaine>.nocrm.io/api/v2 · auth header X-API-Key.
// Config : NOCRM_API_KEY, NOCRM_BASE (sous-domaine), NOCRM_STEP_ID (optionnel).
// ─────────────────────────────────────────────────────────────────────────
const RAW_BASE = (process.env.NOCRM_BASE || 'https://instapreneurpro.nocrm.io').replace(/\/+$/, '');
const BASE = RAW_BASE + '/api/v2';

const key = () => (process.env.NOCRM_API_KEY || '').trim();
const isReady = () => Boolean(key());

async function api(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'X-API-Key': key(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`noCRM ${method} ${path} → ${res.status} : ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Récap lisible : infos contact + formulaire d'inscription + qualif setter + notes
function buildDescription(lead, dateRdv) {
  const L = [];
  if (dateRdv) {
    const d = String(dateRdv);
    const t = d.slice(11, 16);
    L.push(`📅 RDV : ${d.slice(0, 10)}${t ? ' à ' + t : ''}`);
  }
  if (lead.telephone) L.push(`📞 ${lead.telephone}`);
  if (lead.email) L.push(`📧 ${lead.email}`);

  // Le résumé rédigé pendant l'appel : c'est la vraie valeur pour le closer,
  // il évite de refaire toute la conversation. S'il existe, il prime.
  if (lead.resume) {
    L.push('');
    L.push('— Ce que Sylvie a recueilli —');
    L.push(lead.resume);
    return L.join('\n');
  }

  // Repli pour les fiches anciennes, sans résumé d'appel.
  if (lead.webi) {
    const wname = lead.type_webi === 'ia' ? 'IA' : 'Réseaux sociaux';
    L.push(`Webinaire : ${wname} — ${lead.webi === 'Présent' ? 'présent' : 'absent'}`);
  }
  const qual = [];
  if (lead.objectif) qual.push(`Ce qu'il cherche à régler : ${lead.objectif}`);
  if (lead.situation_pro) qual.push(`Activité / statut : ${lead.situation_pro}`);
  if (lead.entreprise) qual.push(`A déjà une entreprise : ${lead.entreprise}`);
  if (lead.dispo_webi) qual.push(`Conférence (appel d'inscription) : ${lead.dispo_webi}`);
  if (lead.niveau_ig) qual.push(`Niveau Instagram : ${lead.niveau_ig}`);
  if (lead.objection) qual.push(`Réserves : ${lead.objection}`);
  if (qual.length) { L.push(''); L.push('— Qualification —'); L.push(...qual); }
  if (lead.notes) { L.push(''); L.push('📝 Notes :'); L.push(lead.notes); }
  return L.join('\n');
}

// Crée le lead noCRM à partir d'une fiche bookée. Best-effort (ne bloque rien).
async function pushBooking(lead, dateRdv) {
  if (!isReady() || !lead) return null;
  const nom = (lead.nom || lead.prenom || lead.telephone || 'Prospect').trim();
  const body = {
    title: `RDV setter — ${nom}`,
    description: buildDescription(lead, dateRdv),
  };
  const remind = String(dateRdv || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(remind)) {
    body.remind_date = remind;
    const t = String(dateRdv).slice(11, 16);
    if (/^\d{2}:\d{2}$/.test(t)) body.remind_time = t;
  }
  const stepId = Number(process.env.NOCRM_STEP_ID);
  if (Number.isFinite(stepId) && stepId > 0) body.step_id = stepId;

  const created = await api('/leads', 'POST', body);
  console.log(`🧲 noCRM : lead créé pour ${nom} (id ${created.id})`);
  return created;
}

// ── Notes de Sylvie → noCRM ───────────────────────────────────────────────
// Jordan ne travaille que dans noCRM. Tout ce que Sylvie note sur une fiche
// (notes libres, activité, entreprise, attente, réserves…) est donc recopié sur
// le lead noCRM de la même personne, dans UN commentaire tenu à jour — pas un
// nouveau commentaire à chaque frappe.
const NOTES_TITRE = '📝 Notes de Sylvie (setter)';

function notesRows(lead) {
  const rows = [];
  if (lead.notes) rows.push(['Notes', String(lead.notes).trim()]);
  if (lead.situation_pro) rows.push(['Activité / statut', lead.situation_pro]);
  if (lead.entreprise) rows.push(['A déjà une entreprise', lead.entreprise]);
  if (lead.objectif) rows.push(['Ce qu\'il cherche à régler', lead.objectif]);
  if (lead.dispo_webi) rows.push(['Conférence (appel d\'inscription)', lead.dispo_webi]);
  if (lead.financement) rows.push(['Financement évoqué', lead.financement]);
  if (lead.objection) rows.push(['Réserves', lead.objection]);
  return rows;
}

// Lead noCRM le plus récent rattaché à cet email (ou null).
async function findLeadByEmail(email) {
  const mail = String(email || '').trim();
  if (!mail) return null;
  const list = await api(`/leads?email=${encodeURIComponent(mail)}&limit=5&direction=desc`);
  return Array.isArray(list) && list.length ? list[0] : null;
}

/**
 * Recopie les notes de la fiche sur le lead noCRM correspondant.
 * @returns {'absent'|'vide'|'deja'|'cree'|'maj'} ce qui a été fait
 */
async function syncNotes(lead) {
  if (!isReady() || !lead || !lead.email) return 'absent';
  const rows = notesRows(lead);
  if (!rows.length) return 'vide';
  const found = await findLeadByEmail(lead.email);
  if (!found) return 'absent'; // pas (encore) de lead côté Jordan : rien à faire

  const content = [NOTES_TITRE, ...rows.map(([k, v]) => `${k} : ${v}`)].join('\n');
  const comments = await api(`/leads/${found.id}/comments`);
  const mine = (Array.isArray(comments) ? comments : [])
    .find((c) => String(c.content || '').startsWith(NOTES_TITRE));
  if (mine) {
    if (String(mine.content).trim() === content) return 'deja';
    await api(`/leads/${found.id}/comments/${mine.id}`, 'PUT', { content });
    console.log(`🧲 noCRM : notes de Sylvie mises à jour (lead ${found.id})`);
    return 'maj';
  }
  // Tout est déjà dans la description (résumé transmis au moment du RDV) :
  // inutile de le répéter en commentaire.
  const desc = String(found.description || '');
  if (rows.every(([, v]) => desc.includes(v))) return 'deja';
  await api(`/leads/${found.id}/comments`, 'POST', { content });
  console.log(`🧲 noCRM : notes de Sylvie ajoutées (lead ${found.id})`);
  return 'cree';
}

// Envoi différé, un seul par fiche : Sylvie tape, l'app enregistre toutes les
// 0,7 s — on attend qu'elle ait fini avant d'écrire dans noCRM.
const pending = new Map();
function scheduleNotes(key, getLead, delayMs = Number(process.env.NOCRM_NOTES_DELAY_MS || 60_000)) {
  if (!isReady() || !key) return;
  clearTimeout(pending.get(key));
  pending.set(key, setTimeout(async () => {
    pending.delete(key);
    try { await syncNotes(await getLead()); }
    catch (e) { console.error('⚠️ noCRM (notes) :', e.message); }
  }, delayMs));
}

module.exports = { isReady, pushBooking, syncNotes, scheduleNotes, api };
