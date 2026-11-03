// backend/utils/asyncHandler.js
// Transmet les erreurs des contrôleurs async au middleware d'erreur (évite les promesses rejetées non gérées)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
