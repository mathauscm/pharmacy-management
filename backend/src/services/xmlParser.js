const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const logger = require('../middleware/logger');
const { runQuery, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/database');

/**
 * Parser de XML de Nota Fiscal Eletrônica
 */
class XMLParser {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
  }

  /**
   * Processar arquivo XML da NFe
   */