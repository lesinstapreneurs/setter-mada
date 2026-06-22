// ─────────────────────────────────────────────────────────────────────────
// Client System.io — passe par le **serveur MCP officiel** de System.io
// (https://mcp.systeme.io/mcp?mcpKey=…), pas par l'API REST.
//
// Pourquoi le MCP et pas l'API REST ?
//   • La clé dont dispose le compte est une « clé MCP » (Paramètres → Clés MCP),
//     pas une clé API REST. Le MCP est un simple endpoint HTTP JSON-RPC :
//     on l'appelle directement depuis Node, sans dépendance.
//
// Transport : « Streamable HTTP » (spec MCP 2025-06-18).
//   1) POST initialize            → renvoie l'en-tête Mcp-Session-Id
//   2) POST notifications/initialized
//   3) POST tools/call            → exécution d'un outil
// La session est mise en cache ; on ré-initialise une fois si elle expire.
//
// Outils utilisés : get_contacts, assign_contact_tag, remove_contact_tag,
//                    create_contact, remove_contact, get_tags.
// ─────────────────────────────────────────────────────────────────────────

const PROTOCOL_VERSION = '2025-06-18';

function mcpUrl() {
  if (process.env.SYSTEMEIO_MCP_URL) return process.env.SYSTEMEIO_MCP_URL.trim();
  const key = (process.env.SYSTEMEIO_MCP_KEY || '').trim();
  return key ? `https://mcp.systeme.io/mcp?mcpKey=${key}` : null;
}

const isReady = () => Boolean(mcpUrl());

let sessionId = null;

function baseHeaders(sid) {
  const h = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sid) h['Mcp-Session-Id'] = sid;
  return h;
}

// Le serveur peut répondre en JSON brut OU en flux SSE (event-stream).
// On gère les deux : pour le SSE on concatène les lignes « data: ».
function parseRpcBody(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  if (trimmed[0] === '{' || trimmed[0] === '[') return JSON.parse(trimmed);
  const data = trimmed
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('');
  return data ? JSON.parse(data) : null;
}

async function post(url, payload, sid) {
  return fetch(url, {
    method: 'POST',
    headers: baseHeaders(sid),
    body: JSON.stringify(payload),
  });
}

async function ensureSession() {
  if (sessionId) return sessionId;
  const url = mcpUrl();
  if (!url) throw new Error('SYSTEMEIO_MCP_KEY (ou SYSTEMEIO_MCP_URL) non défini');

  const res = await post(url, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'setter-app', version: '1.0.0' },
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`System.io initialize → ${res.status} : ${txt.slice(0, 200)}`);
  }
  sessionId = res.headers.get('mcp-session-id');
  await res.text(); // on draine le corps
  if (!sessionId) throw new Error('System.io : pas de Mcp-Session-Id renvoyé');

  // Notification obligatoire avant tout appel d'outil
  await post(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId);
  return sessionId;
}

let rpcCounter = 1;

async function callTool(name, args, _retried = false) {
  const url = mcpUrl();
  if (!url) throw new Error('System.io non configuré (SYSTEMEIO_MCP_KEY manquant)');

  const sid = await ensureSession();
  const res = await post(
    url,
    { jsonrpc: '2.0', id: ++rpcCounter, method: 'tools/call', params: { name, arguments: args } },
    sid
  );

  // Session expirée / invalide → on ré-initialise une fois
  if ((res.status === 400 || res.status === 404) && !_retried) {
    sessionId = null;
    return callTool(name, args, true);
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`System.io ${name} → ${res.status} : ${text.slice(0, 300)}`);

  const json = parseRpcBody(text);
  if (json?.error) throw new Error(`System.io ${name} : ${json.error.message || 'erreur RPC'}`);

  const result = json?.result;
  if (result?.isError) {
    const detail = result.structuredContent?.detail || result.content?.[0]?.text || 'erreur outil';
    throw new Error(`System.io ${name} : ${detail}`);
  }
  // structuredContent quand dispo, sinon le contenu texte parsé
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const txt = result?.content?.[0]?.text;
  if (txt) { try { return JSON.parse(txt); } catch { return txt; } }
  return result;
}

// ── Helpers métier ─────────────────────────────────────────────────────────

// Résout un email → id de contact System.io (ou null si introuvable)
async function findContactIdByEmail(email) {
  const mail = String(email || '').trim();
  if (!mail) return null;
  const r = await callTool('get_contacts', { data: { email: mail, limit: 10 } });
  const items = r?.items || [];
  // get_contacts filtre par email exact → le 1er résultat est le bon
  const match = items.find((c) => String(c.email).toLowerCase() === mail.toLowerCase()) || items[0];
  return match?.id ?? null;
}

// Pose un tag sur le contact identifié par email. Non bloquant côté appelant.
async function assignTag(email, tagId) {
  const id = await findContactIdByEmail(email);
  if (!id) {
    console.warn(`🏷️  System.io : aucun contact pour « ${email} » — tag ${tagId} non posé`);
    return false;
  }
  await callTool('assign_contact_tag', { contactId: id, tagId: Number(tagId) });
  console.log(`🏷️  System.io : tag ${tagId} posé sur ${email} (contact ${id})`);
  return true;
}

// Retire un tag du contact identifié par email.
async function removeTag(email, tagId) {
  const id = await findContactIdByEmail(email);
  if (!id) {
    console.warn(`🏷️  System.io : aucun contact pour « ${email} » — tag ${tagId} non retiré`);
    return false;
  }
  await callTool('remove_contact_tag', { contactId: id, tagId: Number(tagId) });
  console.log(`🏷️  System.io : tag ${tagId} retiré de ${email} (contact ${id})`);
  return true;
}

// Liste paginée des contacts portant un tag donné (pour la synchro entrante).
// registeredAfter (ISO date) permet de ne tirer que les inscrits récents.
async function listContactsByTag(tagId, { registeredAfter, registeredBefore, limit = 100 } = {}) {
  const out = [];
  let startingAfter;
  do {
    const data = { tags: String(tagId), limit: Math.min(Math.max(limit, 10), 100) };
    if (registeredAfter) data.registeredAfter = registeredAfter;
    if (registeredBefore) data.registeredBefore = registeredBefore;
    if (startingAfter) data.startingAfter = startingAfter;
    const page = await callTool('get_contacts', { data });
    const items = page?.items || [];
    out.push(...items);
    startingAfter = page?.hasMore ? items[items.length - 1]?.id : null;
  } while (startingAfter);
  return out;
}

// Petit utilitaire pour la lecture d'un champ de contact par slug
function field(contact, slug) {
  return (contact?.fields || []).find((f) => f.slug === slug)?.value || '';
}

module.exports = {
  isReady,
  callTool,
  findContactIdByEmail,
  assignTag,
  removeTag,
  listContactsByTag,
  field,
};
