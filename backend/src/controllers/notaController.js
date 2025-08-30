const multer = require('../config/multer');
const xmlParser = require('../services/xmlParser');
const { runQuery } = require('../config/database');
const logger = require('../middleware/logger');
const path = require('path');
const fs = require('fs');

/**
 * Upload e processamento de XMLs
 */
exports.uploadXML = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    logger.info(`Recebidos ${req.files.length} arquivo(s) XML para processamento`);
    
    const results = [];
    
    for (const file of req.files) {
      try {
        // Processar XML
        const result = await xmlParser.processXML(file.path);
        
        results.push({
          filename: file.originalname,
          success: true,
          data: {
            nota: result.data.nota.numero,
            fornecedor: result.data.fornecedor.nome,
            itens: result.data.itens.length
          }
        });
        
        // Remover arquivo temporário após processamento
        fs.unlinkSync(file.path);
        
      } catch (error) {
        logger.error(`Erro ao processar ${file.originalname}:`, error);
        
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
        
        // Remover arquivo mesmo em caso de erro
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Processamento concluído: ${successCount} sucesso, ${errorCount} erro(s)`,
      results
    });
    
  } catch (error) {
    logger.error('Erro no upload de XML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar notas fiscais
 */
exports.getNotas = async (req, res) => {
  try {
    const { page = 1, limit = 10, fornecedor, dataInicio, dataFim } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (fornecedor) {
      whereClause += ' AND f.nome ILIKE ?';
      params.push(`%${fornecedor}%`);
    }
    
    if (dataInicio) {
      whereClause += ' AND DATE(n.data_emissao) >= ?';
      params.push(dataInicio);
    }
    
    if (dataFim) {
      whereClause += ' AND DATE(n.data_emissao) <= ?';
      params.push(dataFim);
    }
    
    const query = `
      SELECT 
        n.id,
        n.numero,
        n.serie,
        n.data_emissao,
        n.chave_acesso,
        n.valor_total,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cnpj,
        COUNT(i.id) as total_itens
      FROM notas n
      JOIN fornecedores f ON n.fornecedor_id = f.id
      LEFT JOIN itens_nota i ON n.id = i.nota_id
      WHERE ${whereClause}
      GROUP BY n.id, f.nome, f.cnpj
      ORDER BY n.data_emissao DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const notas = await runQuery(query, params);
    
    // Contar total de registros
    const countQuery = `
      SELECT COUNT(DISTINCT n.id) as total
      FROM notas n
      JOIN fornecedores f ON n.fornecedor_id = f.id
      WHERE ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remover limit e offset
    const countResult = await runQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    res.json({
      success: true,
      data: notas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar notas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar notas fiscais',
      error: error.message
    });
  }
};

/**
 * Obter detalhes de uma nota fiscal
 */
exports.getNotaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar dados da nota
    const notaQuery = `
      SELECT 
        n.*,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cnpj,
        f.nome_fantasia as fornecedor_fantasia,
        f.endereco_completo as fornecedor_endereco
      FROM notas n
      JOIN fornecedores f ON n.fornecedor_id = f.id
      WHERE n.id = ?
    `;
    
    const notas = await runQuery(notaQuery, [id]);
    
    if (notas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }
    
    const nota = notas[0];
    
    // Buscar itens da nota
    const itensQuery = `
      SELECT 
        i.*,
        p.nome as produto_nome,
        p.codigo as produto_codigo,
        p.codigo_barras,
        p.fabricante,
        p.unidade
      FROM itens_nota i
      JOIN produtos p ON i.produto_id = p.id
      WHERE i.nota_id = ?
      ORDER BY i.item
    `;
    
    const itens = await runQuery(itensQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...nota,
        itens
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da nota',
      error: error.message
    });
  }
};

/**
 * Excluir nota fiscal
 */
exports.deleteNota = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a nota existe
    const checkQuery = 'SELECT id FROM notas WHERE id = ?';
    const existing = await runQuery(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nota fiscal não encontrada'
      });
    }
    
    // Excluir itens da nota primeiro (devido à chave estrangeira)
    await runQuery('DELETE FROM itens_nota WHERE nota_id = ?', [id]);
    
    // Excluir a nota
    await runQuery('DELETE FROM notas WHERE id = ?', [id]);
    
    logger.info(`Nota fiscal ${id} excluída com sucesso`);
    
    res.json({
      success: true,
      message: 'Nota fiscal excluída com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao excluir nota:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir nota fiscal',
      error: error.message
    });
  }
};

/**
 * Reprocessar XML de uma nota
 */
exports.reprocessXML = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo XML é obrigatório'
      });
    }
    
    // Excluir dados antigos
    await runQuery('DELETE FROM itens_nota WHERE nota_id = ?', [id]);
    await runQuery('DELETE FROM notas WHERE id = ?', [id]);
    
    // Processar novo XML
    const result = await xmlParser.processXML(req.file.path);
    
    // Limpar arquivo temporário
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: 'XML reprocessado com sucesso',
      data: result.data
    });
    
  } catch (error) {
    logger.error('Erro ao reprocessar XML:', error);
    
    // Limpar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao reprocessar XML',
      error: error.message
    });
  }
};
