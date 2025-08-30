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
  async processXML(filePath) {
    try {
      logger.info(`Iniciando processamento do XML: ${filePath}`);
      
      // Ler arquivo XML
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      // Fazer parse do XML
      const result = await this.parser.parseStringPromise(xmlData);
      
      // Extrair dados da NFe
      const nfeData = this.extractNFeData(result);
      
      // Salvar no banco de dados
      await this.saveToDatabase(nfeData);
      
      logger.info(`XML processado com sucesso: ${filePath}`);
      return { success: true, data: nfeData };
      
    } catch (error) {
      logger.error(`Erro ao processar XML ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Extrair dados estruturados da NFe
   */
  extractNFeData(xmlResult) {
    try {
      const nfe = xmlResult.nfeProc?.NFe?.infNFe || xmlResult.NFe?.infNFe;
      
      if (!nfe) {
        throw new Error('Estrutura de NFe inválida no XML');
      }

      // Dados do emissor (fornecedor)
      const emit = nfe.emit;
      const fornecedor = {
        cnpj: emit.CNPJ,
        nome: emit.xNome,
        fantasia: emit.xFant || emit.xNome,
        endereco: {
          logradouro: emit.enderEmit?.xLgr,
          numero: emit.enderEmit?.nro,
          bairro: emit.enderEmit?.xBairro,
          municipio: emit.enderEmit?.xMun,
          uf: emit.enderEmit?.UF,
          cep: emit.enderEmit?.CEP
        }
      };

      // Dados da nota
      const ide = nfe.ide;
      const nota = {
        numero: ide.nNF,
        serie: ide.serie,
        dataEmissao: ide.dhEmi || ide.dEmi,
        chaveAcesso: nfe.$.Id?.replace('NFe', ''),
        valorTotal: parseFloat(nfe.total?.ICMSTot?.vNF || 0),
        fornecedor: fornecedor
      };

      // Produtos/itens da nota
      let detItems = nfe.det;
      if (!Array.isArray(detItems)) {
        detItems = [detItems];
      }

      const itens = detItems.map((item, index) => {
        const prod = item.prod;
        
        return {
          item: index + 1,
          produto: {
            codigo: prod.cProd,
            codigoBarras: prod.cEAN || prod.cEANTrib,
            nome: prod.xProd,
            ncm: prod.NCM,
            unidade: prod.uCom,
            fabricante: prod.xProd?.split(' - ')[0] || 'Não informado'
          },
          quantidade: parseFloat(prod.qCom || 0),
          valorUnitario: parseFloat(prod.vUnCom || 0),
          valorTotal: parseFloat(prod.vProd || 0),
          desconto: parseFloat(prod.vDesc || 0),
          valorLiquido: parseFloat(prod.vProd || 0) - parseFloat(prod.vDesc || 0)
        };
      });

      return {
        nota,
        fornecedor,
        itens
      };
      
    } catch (error) {
      logger.error('Erro ao extrair dados do XML:', error);
      throw new Error('Erro ao processar estrutura do XML: ' + error.message);
    }
  }

  /**
   * Salvar dados extraídos no banco de dados
   */
  async saveToDatabase(nfeData) {
    const connection = await beginTransaction();
    
    try {
      const { nota, fornecedor, itens } = nfeData;
      
      // 1. Inserir/atualizar fornecedor
      const fornecedorId = await this.insertFornecedor(fornecedor, connection);
      
      // 2. Inserir nota
      const notaId = await this.insertNota({ ...nota, fornecedorId }, connection);
      
      // 3. Processar produtos e itens
      for (const item of itens) {
        // Inserir/atualizar produto
        const produtoId = await this.insertProduto(item.produto, connection);
        
        // Inserir item da nota
        await this.insertItemNota({
          notaId,
          produtoId,
          ...item
        }, connection);
      }
      
      await commitTransaction(connection);
      logger.info(`Dados salvos no banco: Nota ${nota.numero}`);
      
    } catch (error) {
      await rollbackTransaction(connection);
      logger.error('Erro ao salvar no banco:', error);
      throw error;
    }
  }

  /**
   * Inserir ou atualizar fornecedor
   */
  async insertFornecedor(fornecedor, connection) {
    try {
      const query = `
        INSERT INTO fornecedores (cnpj, nome, nome_fantasia, endereco_completo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(cnpj) DO UPDATE SET
          nome = EXCLUDED.nome,
          nome_fantasia = EXCLUDED.nome_fantasia,
          endereco_completo = EXCLUDED.endereco_completo,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const enderecoCompleto = [
        fornecedor.endereco.logradouro,
        fornecedor.endereco.numero,
        fornecedor.endereco.bairro,
        fornecedor.endereco.municipio,
        fornecedor.endereco.uf,
        fornecedor.endereco.cep
      ].filter(Boolean).join(', ');
      
      const result = await runQuery(query, [
        fornecedor.cnpj,
        fornecedor.nome,
        fornecedor.fantasia,
        enderecoCompleto
      ], connection);
      
      return result[0].id;
      
    } catch (error) {
      logger.error('Erro ao inserir fornecedor:', error);
      throw error;
    }
  }

  /**
   * Inserir nota fiscal
   */
  async insertNota(nota, connection) {
    try {
      const query = `
        INSERT INTO notas (numero, serie, data_emissao, chave_acesso, valor_total, fornecedor_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(chave_acesso) DO UPDATE SET
          numero = EXCLUDED.numero,
          serie = EXCLUDED.serie,
          data_emissao = EXCLUDED.data_emissao,
          valor_total = EXCLUDED.valor_total,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const result = await runQuery(query, [
        nota.numero,
        nota.serie,
        nota.dataEmissao,
        nota.chaveAcesso,
        nota.valorTotal,
        nota.fornecedorId
      ], connection);
      
      return result[0].id;
      
    } catch (error) {
      logger.error('Erro ao inserir nota:', error);
      throw error;
    }
  }

  /**
   * Inserir ou atualizar produto
   */
  async insertProduto(produto, connection) {
    try {
      const query = `
        INSERT INTO produtos (codigo, codigo_barras, nome, ncm, unidade, fabricante)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(codigo) DO UPDATE SET
          codigo_barras = EXCLUDED.codigo_barras,
          nome = EXCLUDED.nome,
          ncm = EXCLUDED.ncm,
          unidade = EXCLUDED.unidade,
          fabricante = EXCLUDED.fabricante,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const result = await runQuery(query, [
        produto.codigo,
        produto.codigoBarras,
        produto.nome,
        produto.ncm,
        produto.unidade,
        produto.fabricante
      ], connection);
      
      return result[0].id;
      
    } catch (error) {
      logger.error('Erro ao inserir produto:', error);
      throw error;
    }
  }

  /**
   * Inserir item da nota
   */
  async insertItemNota(item, connection) {
    try {
      const query = `
        INSERT INTO itens_nota (
          nota_id, produto_id, item, quantidade, 
          valor_unitario, valor_total, desconto, valor_liquido
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await runQuery(query, [
        item.notaId,
        item.produtoId,
        item.item,
        item.quantidade,
        item.valorUnitario,
        item.valorTotal,
        item.desconto,
        item.valorLiquido
      ], connection);
      
    } catch (error) {
      logger.error('Erro ao inserir item da nota:', error);
      throw error;
    }
  }

  /**
   * Processar múltiplos arquivos XML
   */
  async processMultipleXMLs(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.processXML(filePath);
        results.push({ file: filePath, ...result });
      } catch (error) {
        results.push({ 
          file: filePath, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
}

module.exports = new XMLParser();