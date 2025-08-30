/**
 * Constantes do sistema de gestão de farmácia
 */

// Status gerais
const STATUS = {
  ATIVO: 'ativo',
  INATIVO: 'inativo',
  PENDENTE: 'pendente',
  PROCESSADO: 'processado',
  ERRO: 'erro'
};

// Status de notas fiscais
const STATUS_NOTA = {
  PROCESSADA: 'processada',
  PENDENTE: 'pendente',
  ERRO: 'erro',
  CANCELADA: 'cancelada'
};

// Tipos de movimentação de estoque
const TIPO_MOVIMENTACAO = {
  ENTRADA: 'entrada',
  SAIDA: 'saida',
  AJUSTE: 'ajuste',
  TRANSFERENCIA: 'transferencia'
};

// Níveis de estoque
const NIVEL_ESTOQUE = {
  OK: 'OK',
  ATENCAO: 'ATENCAO',
  BAIXO: 'BAIXO',
  SEM_ESTOQUE: 'SEM_ESTOQUE',
  CRITICO: 'CRITICO'
};

// Tipos de arquivo suportados
const TIPOS_ARQUIVO = {
  XML: {
    MIME_TYPES: ['text/xml', 'application/xml'],
    EXTENSOES: ['.xml'],
    TAMANHO_MAX: 5 * 1024 * 1024 // 5MB
  }
};

// Configurações de paginação
const PAGINACAO = {
  LIMITE_PADRAO: 20,
  LIMITE_MAX: 100,
  PAGINA_PADRAO: 1
};

// Periodos para análises
const PERIODOS = {
  DIAS_ANALISE_ESTOQUE: 90,
  DIAS_COBERTURA_MINIMA: 15,
  DIAS_COBERTURA_SUGERIDA: 30,
  MESES_HISTORICO_PADRAO: 12
};

// Mensagens de erro padrão
const MENSAGENS_ERRO = {
  ARQUIVO_NAO_ENCONTRADO: 'Arquivo não encontrado',
  FORMATO_INVALIDO: 'Formato de arquivo inválido',
  TAMANHO_EXCEDIDO: 'Tamanho do arquivo excede o limite',
  XML_INVALIDO: 'Estrutura do XML é inválida',
  PRODUTO_NAO_ENCONTRADO: 'Produto não encontrado',
  FORNECEDOR_NAO_ENCONTRADO: 'Fornecedor não encontrado',
  NOTA_NAO_ENCONTRADA: 'Nota fiscal não encontrada',
  DADOS_OBRIGATORIOS: 'Dados obrigatórios não informados',
  ERRO_BANCO_DADOS: 'Erro ao acessar banco de dados',
  ERRO_INTERNO: 'Erro interno do servidor'
};

// Mensagens de sucesso
const MENSAGENS_SUCESSO = {
  XML_PROCESSADO: 'XML processado com sucesso',
  PRODUTO_SALVO: 'Produto salvo com sucesso',
  FORNECEDOR_SALVO: 'Fornecedor salvo com sucesso',
  NOTA_SALVA: 'Nota fiscal salva com sucesso',
  ESTOQUE_ATUALIZADO: 'Estoque atualizado com sucesso'
};

// Configurações de log
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// Expressões regulares úteis
const REGEX = {
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TELEFONE: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  CEP: /^\d{5}\-?\d{3}$/
};

// Configurações de cache
const CACHE = {
  TTL_PADRAO: 300, // 5 minutos
  TTL_DASHBOARD: 60, // 1 minuto
  TTL_PRODUTOS: 300, // 5 minutos
  TTL_FORNECEDORES: 600 // 10 minutos
};

// Exportar constantes
module.exports = {
  STATUS,
  STATUS_NOTA,
  TIPO_MOVIMENTACAO,
  NIVEL_ESTOQUE,
  TIPOS_ARQUIVO,
  PAGINACAO,
  PERIODOS,
  MENSAGENS_ERRO,
  MENSAGENS_SUCESSO,
  LOG_LEVELS,
  REGEX,
  CACHE,
  
  // Para compatibilidade com código existente
  STATUS_ATIVO: STATUS.ATIVO,
  STATUS_INATIVO: STATUS.INATIVO
};
