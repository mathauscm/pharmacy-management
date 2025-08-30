const Joi = require('joi');
const logger = require('./logger');

/**
 * Validação de upload de XML
 */
exports.validateXMLUpload = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pelo menos um arquivo XML é obrigatório'
      });
    }

    // Verificar se todos os arquivos são XML
    const invalidFiles = req.files.filter(file => {
      const isXML = file.mimetype === 'text/xml' || 
                   file.mimetype === 'application/xml' ||
                   file.originalname.toLowerCase().endsWith('.xml');
      return !isXML;
    });

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Apenas arquivos XML são permitidos',
        invalidFiles: invalidFiles.map(f => f.originalname)
      });
    }

    // Verificar tamanho dos arquivos (máximo 5MB por arquivo)
    const oversizedFiles = req.files.filter(file => file.size > 5 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Arquivos muito grandes. Máximo 5MB por arquivo',
        oversizedFiles: oversizedFiles.map(f => f.originalname)
      });
    }

    next();
  } catch (error) {
    logger.error('Erro na validação de upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno na validação'
    });
  }
};

/**
 * Validação de ID de nota
 */
exports.validateNotaId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.number().integer().positive().required()
  });

  const { error } = schema.validate({ id: parseInt(req.params.id) });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'ID de nota inválido',
      details: error.details[0].message
    });
  }

  req.params.id = parseInt(req.params.id);
  next();
};

/**
 * Validação de ID de produto
 */
exports.validateProdutoId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.number().integer().positive().required()
  });

  const { error } = schema.validate({ id: parseInt(req.params.id) });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'ID de produto inválido',
      details: error.details[0].message
    });
  }

  req.params.id = parseInt(req.params.id);
  next();
};

/**
 * Validação de parâmetros de consulta de produtos
 */
exports.validateProdutoQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().max(100).optional(),
    fabricante: Joi.string().trim().max(100).optional(),
    orderBy: Joi.string().valid('nome', 'fabricante', 'ultima_compra', 'menor_preco').default('nome'),
    orderDirection: Joi.string().valid('ASC', 'DESC').default('ASC')
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros de consulta inválidos',
      details: error.details[0].message
    });
  }

  req.query = value;
  next();
};

/**
 * Validação de parâmetros de consulta de notas
 */
exports.validateNotaQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    fornecedor: Joi.string().trim().max(100).optional(),
    dataInicio: Joi.date().iso().optional(),
    dataFim: Joi.date().iso().min(Joi.ref('dataInicio')).optional()
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros de consulta inválidos',
      details: error.details[0].message
    });
  }

  req.query = value;
  next();
};

/**
 * Middleware genérico de validação de corpo da requisição
 */
exports.validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validação de parâmetros de período
 */
exports.validatePeriodo = (req, res, next) => {
  const schema = Joi.object({
    periodo: Joi.number().integer().min(1).max(365).default(30)
  });

  const { error, value } = schema.validate({ periodo: req.query.periodo });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Período inválido. Deve ser entre 1 e 365 dias',
      details: error.details[0].message
    });
  }

  req.query.periodo = value.periodo;
  next();
};

/**
 * Validação básica de arquivo único
 */
exports.validateSingleFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo é obrigatório'
    });
  }

  // Verificar se é XML
  const isXML = req.file.mimetype === 'text/xml' || 
               req.file.mimetype === 'application/xml' ||
               req.file.originalname.toLowerCase().endsWith('.xml');

  if (!isXML) {
    return res.status(400).json({
      success: false,
      message: 'Apenas arquivos XML são permitidos'
    });
  }

  // Verificar tamanho (máximo 5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'Arquivo muito grande. Máximo 5MB'
    });
  }

  next();
};
