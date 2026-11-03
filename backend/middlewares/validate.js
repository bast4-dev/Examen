// backend/middlewares/validate.js
// Valide req[property] avec un schéma Joi ; remplace les données par la version nettoyée

const messages = {
  'any.required': '{{#label}} est obligatoire',
  'any.only': '{{#label}} doit valoir : {{#valids}}',
  'string.base': '{{#label}} doit être une chaîne de caractères',
  'string.empty': '{{#label}} ne peut pas être vide',
  'string.min': '{{#label}} doit contenir au moins {{#limit}} caractères',
  'string.max': '{{#label}} doit contenir au plus {{#limit}} caractères',
  'string.email': '{{#label}} doit être une adresse email valide',
  'string.alphanum': '{{#label}} ne doit contenir que des lettres et des chiffres',
  'string.pattern.base': "{{#label}} n'est pas au bon format",
  'number.base': '{{#label}} doit être un nombre',
  'number.integer': '{{#label}} doit être un nombre entier',
  'number.min': '{{#label}} doit être supérieur ou égal à {{#limit}}',
  'number.max': '{{#label}} doit être inférieur ou égal à {{#limit}}',
  'array.base': '{{#label}} doit être une liste',
  'array.min': '{{#label}} doit contenir au moins {{#limit}} élément(s)',
  'array.max': '{{#label}} doit contenir au plus {{#limit}} éléments',
  'object.base': '{{#label}} doit être un objet',
};

/**
 * Fabrique un middleware de validation Joi.
 * @param {Joi.Schema} schema - schéma Joi à appliquer
 * @param {'body'|'params'|'query'} [property='body'] - partie de la requête à valider
 * @returns {express.RequestHandler} répond 400 avec le détail des erreurs, sinon remplace req[property] par la valeur nettoyée
 */
module.exports =
  (schema, property = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      messages,
      errors: { wrap: { label: false } },
    });

    if (error) {
      return res.status(400).json({
        message: 'Données invalides',
        details: error.details.map((detail) => detail.message),
      });
    }

    req[property] = value;
    next();
  };
