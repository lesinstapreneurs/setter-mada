// ─────────────────────────────────────────────────────────────────────────
// Tags System.io reconnus par le webhook /webhook/sio-tag.
// Pour un nouveau webinaire (ex: mardi), ajouter simplement une ligne ici —
// aucun autre fichier à modifier.
// ⚠️ Les noms contiennent accents et espaces : comparaison exacte après trim,
// ne jamais normaliser / slugifier.
// ─────────────────────────────────────────────────────────────────────────

const TAGS_PRESENT_WEBI = [
  { name: 'Présent Webi (lundi)', id: 1676347 },
  // Ajouter ici les futurs tags "présent webi"
];

const TAGS_ABSENT_WEBI = [
  { name: 'Absent Webi (lundi)', id: 1701606 },
  // Ajouter ici les futurs tags "absent webi"
];

const TAGS_RESA_CALL = [
  { name: 'Résa call', id: 1693176 },
];

// Tag à poser dans System.io quand un lead absent demande sa réinscription
const TAG_REINSCRIT_WEBI = 'Réinscrit webi';

function inList(list, tag) {
  const name = String(tag?.name ?? '').trim();
  const id = Number(tag?.id);
  // Double vérification : le nom exact OU l'ID suffit à router le tag
  return list.some((t) => t.name === name || (Number.isFinite(id) && t.id === id));
}

/**
 * Route un tag SIO vers son flux.
 * @returns {'present'|'absent'|'resa'|null}
 */
function matchTag(tag) {
  if (inList(TAGS_PRESENT_WEBI, tag)) return 'present';
  if (inList(TAGS_ABSENT_WEBI, tag)) return 'absent';
  if (inList(TAGS_RESA_CALL, tag)) return 'resa';
  return null;
}

module.exports = {
  TAGS_PRESENT_WEBI,
  TAGS_ABSENT_WEBI,
  TAGS_RESA_CALL,
  TAG_REINSCRIT_WEBI,
  matchTag,
};
