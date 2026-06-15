// Score chaleur : 10 au jour de l'inscription, -1 tous les 3 jours, plancher 0.
// Recalculé à chaque chargement de la liste — jamais figé en base.
function scoreChaleur(dateStr) {
  if (!dateStr) return 10;
  const ts = new Date(dateStr).getTime();
  if (Number.isNaN(ts)) return 10;
  const jours = Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
  return Math.max(0, 10 - Math.floor(jours / 3));
}

module.exports = { scoreChaleur };
