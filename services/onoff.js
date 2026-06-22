// ─────────────────────────────────────────────────────────────────────────
// Client Onoff Business — vraies stats d'appels (API publique, offre Max).
// Base : https://public-apigateway.onoffapp.net · Auth : header x-api-key.
// Endpoints utilisés : /api/v1/members (liste), /api/v1/calls (logs paginés).
// La clé est lue dans ONOFF_API_KEY. SMS non exposé par la clé (401) → ignoré.
// ─────────────────────────────────────────────────────────────────────────
const BASE = 'https://public-apigateway.onoffapp.net';

const key = () => (process.env.ONOFF_API_KEY || '').trim();
const isReady = () => Boolean(key());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, _retry = 0) {
  const res = await fetch(BASE + path, {
    headers: { 'x-api-key': key(), Accept: 'application/json' },
  });
  // Onoff limite le débit → backoff puis retry (Retry-After ou exponentiel)
  if (res.status === 429 && _retry < 6) {
    const ra = Number(res.headers.get('retry-after'));
    await sleep((Number.isFinite(ra) && ra > 0 ? ra * 1000 : 800 * 2 ** _retry) + 200);
    return api(path, _retry + 1);
  }
  if (!res.ok) throw new Error(`Onoff ${path} → ${res.status} : ${(await res.text()).slice(0, 150)}`);
  return res.json();
}

// Membres qui ont un numéro (ceux qui passent des appels)
async function membersWithNumber() {
  const j = await api('/api/v1/members');
  return (j.members || []).filter((m) => (m.numberIdRefs || []).length > 0);
}

// Tous les appels d'un membre sur une période (pagination via nextOffset)
async function callsForMember(memberId, startISO, endISO) {
  const out = [];
  let offset = '';
  do {
    const qs = `startDate=${startISO}&endDate=${endISO}&memberIdRef=${memberId}` +
      (offset ? `&offset=${encodeURIComponent(offset)}` : '');
    const j = await api(`/api/v1/calls?${qs}`);
    out.push(...(j.callLogs || []));
    offset = j.nextOffset || '';
    if (offset) await sleep(250); // throttle léger entre les pages
  } while (offset && out.length < 5000);
  return out;
}

// Cache mémoire (5 min) — évite de re-paginer l'API à chaque ouverture des stats
const cache = new Map();
const TTL = 5 * 60 * 1000;

async function callStats({ days = 14 } = {}) {
  const hit = cache.get(days);
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  const data = await computeCallStats({ days });
  cache.set(days, { t: Date.now(), data });
  return data;
}

async function computeCallStats({ days = 14 } = {}) {
  const now = new Date();
  const start = new Date(now.getTime() - Number(days) * 86_400_000);
  const startISO = start.toISOString().slice(0, 19) + 'Z';
  const endISO = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 19) + 'Z';
  const startDay = start.toISOString().slice(0, 10);

  const members = await membersWithNumber();
  const all = [];
  for (const m of members) {
    const calls = await callsForMember(m.id, startISO, endISO);
    for (const c of calls) all.push({ ...c, member: `${m.firstName} ${m.lastName}`.trim() });
  }
  // L'API filtre mal la borne haute → on refiltre côté serveur
  const calls = all.filter((c) => (c.startedDate || '').slice(0, 10) >= startDay);
  const answered = calls.filter((c) => c.status === 'ANSWER');
  const totalDur = answered.reduce((s, c) => s + (c.duration || 0), 0);
  const real = answered.filter((c) => (c.duration || 0) >= 30);

  const byHour = {};
  answered.forEach((c) => { const h = (c.startedDate || '').slice(11, 13); if (h) byHour[h] = (byHour[h] || 0) + 1; });
  const byMember = {};
  calls.forEach((c) => { byMember[c.member] = (byMember[c.member] || 0) + 1; });
  const topHours = Object.entries(byHour).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h}h (${n})`);

  return {
    days: Number(days),
    total: calls.length,
    uniques: new Set(calls.map((c) => c.externalPhoneNumber)).size,
    answered: answered.length,
    answerRate: calls.length ? Math.round((answered.length / calls.length) * 100) : 0,
    realConvos: real.length,
    durationMin: Math.round(totalDur / 60),
    avgSec: answered.length ? Math.round(totalDur / answered.length) : 0,
    topHours,
    byMember,
    byHour,
  };
}

module.exports = { isReady, callStats };
