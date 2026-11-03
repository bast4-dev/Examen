// backend/utils/httpError.js
// Erreur métier portant un code HTTP, interceptée par le middleware errorHandler
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
