/**
 * Funções auxiliares e utilitárias do sistema
 */

/**
 * Formatar data para padrão brasileiro
 */
function formatarData(data, incluirHora = false) {
  if (!data) return null;
  
  const dateObj = new Date(data);
  
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  const opcoes = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  if (incluirHora) {
    opcoes.hour = '2-digit';
    opcoes.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('pt-BR', opcoes);
}

/**
 * Formatar valores monetários
 */
function formatarMoeda(valor, moeda = 'BRL') {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  
  const numero = parseFloat(valor);
  
  if (isNaN(numero)) return 'R$ 0,00';
  
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: moeda
  });
}

/**
 * Validar CNPJ
 */
function validarCNPJ(cnpj) {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  
  return resultado == digitos.charAt(1);
}

/**
 * Limpar e formatar CNPJ
 */
function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return cnpj;
  
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Gerar slug amigável para URLs
 */
function gerarSlug(texto) {
  if (!texto) return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9 -]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

/**
 * Validar email
 */
function validarEmail(email) {
  if (!email) return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Paginação - calcular offset e limit
 */
function calcularPaginacao(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
}

/**
 * Escapar string para uso em regex
 */
function escaparRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gerar hash simples para cache
 */
function gerarHash(dados) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(JSON.stringify(dados)).digest('hex');
}

/**
 * Aguardar por tempo determinado (para uso com async/await)
 */
function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Remover propriedades null/undefined de objeto
 */
function limparObjeto(obj) {
  const novoObj = {};
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      novoObj[key] = obj[key];
    }
  });
  
  return novoObj;
}

/**
 * Agrupar array por propriedade
 */
function agruparPor(array, propriedade) {
  return array.reduce((acc, item) => {
    const chave = item[propriedade];
    if (!acc[chave]) {
      acc[chave] = [];
    }
    acc[chave].push(item);
    return acc;
  }, {});
}

module.exports = {
  formatarData,
  formatarMoeda,
  validarCNPJ,
  formatarCNPJ,
  gerarSlug,
  validarEmail,
  calcularPaginacao,
  escaparRegex,
  gerarHash,
  aguardar,
  limparObjeto,
  agruparPor
};
