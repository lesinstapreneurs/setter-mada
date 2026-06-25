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
  if (lead.webi) L.push(`Webinaire : ${lead.webi}`);
  const qual = [];
  if (lead.objectif) qual.push(`Raisons d'inscription : ${lead.objectif}`);
  if (lead.situation_pro) qual.push(`Situation : ${lead.situation_pro}`);
  if (lead.niveau_ig) qual.push(`Niveau Instagram : ${lead.niveau_ig}`);
  if (lead.positifs) qual.push(`Ce qui lui a plu : ${lead.positifs}`);
  if (lead.manques) qual.push(`Ce qui a manqué : ${lead.manques}`);
  if (lead.objection) qual.push(`Objection : ${lead.objection}`);
  if (qual.length) { L.push(''); L.push('— Qualification —'); L.push(...qual); }
  if (lead.notes) { L.push(''); L.push('📝 Notes setter :'); L.push(lead.notes); }
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

module.exports = { isReady, pushBooking, api };
