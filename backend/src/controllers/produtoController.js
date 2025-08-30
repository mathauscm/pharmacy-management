const { runQuery } = require('../config/database');
const { logger } = require('../middleware/logger');

/**
 * Listar produtos com informações de estoque e preços
 */
exports.getProdutos = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      fabricante, 
      orderBy = 'nome',
      orderDirection = 'ASC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (p.nome ILIKE ? OR p.codigo ILIKE ? OR p.codigo_barras ILIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (fabricante) {
      whereClause += ' AND p.fabricante ILIKE ?';
      params.push(`%${fabricante}%`);
    }
    
    const validOrderBy = ['nome', 'fabricante', 'ultima_compra', 'menor_preco'];
    const validDirection = ['ASC', 'DESC'];
    
    const orderByField = validOrderBy.includes(orderBy) ? orderBy : 'nome';
    const direction = validDirection.includes(orderDirection.toUpperCase()) ? orderDirection.toUpperCase() : 'ASC';
    
    const query = `
      SELECT 
        p.id,
        p.codigo,
        p.codigo_barras,
        p.nome,
        p.fabricante,
        p.unidade,
        p.ncm,
        MAX(i.valor_liquido) as maior_preco,
        MIN(i.valor_liquido) as menor_preco,
        AVG(i.valor_liquido) as preco_medio,
        MAX(n.data_emissao) as ultima_compra,
        SUM(i.quantidade) as quantidade_total_comprada,
        COUNT(DISTINCT n.id) as total_notas
      FROM produtos p
      LEFT JOIN itens_nota i ON p.id = i.produto_id
      LEFT JOIN notas n ON i.nota_id = n.id
      WHERE ${whereClause}
      GROUP BY p.id, p.codigo, p.nome, p.fabricante, p.unidade, p.ncm
      ORDER BY ${orderByField} ${direction}
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const produtos = await runQuery(query, params);
    
    // Formatar preços
    const produtosFormatados = produtos.map(produto => ({
      ...produto,
      preco_medio: produto.preco_medio ? parseFloat(produto.preco_medio).toFixed(2) : '0.00',
      maior_preco: produto.maior_preco ? parseFloat(produto.maior_preco).toFixed(2) : '0.00',
      menor_preco: produto.menor_preco ? parseFloat(produto.menor_preco).toFixed(2) : '0.00'
    }));
    
    // Contar total de produtos
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM produtos p
      LEFT JOIN itens_nota i ON p.id = i.produto_id
      LEFT JOIN notas n ON i.nota_id = n.id
      WHERE ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const countResult = await runQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    res.json({
      success: true,
      data: produtosFormatados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos',
      error: error.message
    });
  }
};

/**
 * Obter detalhes de um produto específico
 */
exports.getProdutoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        COUNT(DISTINCT n.id) as total_notas,
        SUM(i.quantidade) as quantidade_total_comprada,
        AVG(i.valor_liquido) as preco_medio,
        MAX(i.valor_liquido) as maior_preco,
        MIN(i.valor_liquido) as menor_preco,
        MAX(n.data_emissao) as ultima_compra
      FROM produtos p
      LEFT JOIN itens_nota i ON p.id = i.produto_id
      LEFT JOIN notas n ON i.nota_id = n.id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const produtos = await runQuery(query, [id]);
    
    if (produtos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    const produto = produtos[0];
    
    // Buscar histórico de compras
    const historicoQuery = `
      SELECT 
        n.numero as nota_numero,
        n.data_emissao,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cnpj,
        i.quantidade,
        i.valor_unitario,
        i.valor_liquido,
        i.desconto,
        i.valor_liquido as preco_unitario_final
      FROM itens_nota i
      JOIN notas n ON i.nota_id = n.id
      JOIN fornecedores f ON n.fornecedor_id = f.id
      WHERE i.produto_id = ?
      ORDER BY n.data_emissao DESC
    `;
    
    const historico = await runQuery(historicoQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...produto,
        historico_compras: historico
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do produto',
      error: error.message
    });
  }
};

/**
 * Buscar histórico de preços de um produto
 */
exports.getHistoricoPrecos = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = '12' } = req.query; // Padrão: últimos 12 meses
    
    const query = `
      SELECT 
        f.nome as fornecedor,
        f.cnpj,
        n.data_emissao,
        n.numero as nota,
        i.quantidade,
        i.valor_unitario,
        i.valor_liquido,
        i.desconto,
        i.valor_liquido as preco_unitario_liquido
      FROM itens_nota i
      JOIN notas n ON i.nota_id = n.id
      JOIN fornecedores f ON n.fornecedor_id = f.id
      WHERE i.produto_id = ? 
        AND n.data_emissao >= DATE('now', '-' || ? || ' months')
      ORDER BY n.data_emissao DESC, i.valor_liquido ASC
    `;
    
    const historico = await runQuery(query, [id, periodo]);
    
    // Agrupar por fornecedor para análise
    const porFornecedor = {};
    
    historico.forEach(item => {
      if (!porFornecedor[item.fornecedor]) {
        porFornecedor[item.fornecedor] = {
          fornecedor: item.fornecedor,
          cnpj: item.cnpj,
          compras: [],
          menor_preco: null,
          maior_preco: null,
          preco_medio: 0,
          total_quantidade: 0
        };
      }
      
      porFornecedor[item.fornecedor].compras.push(item);
      
      const precoLiquido = parseFloat(item.preco_unitario_liquido);
      
      if (!porFornecedor[item.fornecedor].menor_preco || precoLiquido < porFornecedor[item.fornecedor].menor_preco) {
        porFornecedor[item.fornecedor].menor_preco = precoLiquido;
      }
      
      if (!porFornecedor[item.fornecedor].maior_preco || precoLiquido > porFornecedor[item.fornecedor].maior_preco) {
        porFornecedor[item.fornecedor].maior_preco = precoLiquido;
      }
      
      porFornecedor[item.fornecedor].total_quantidade += parseFloat(item.quantidade);
    });
    
    // Calcular preço médio por fornecedor
    Object.keys(porFornecedor).forEach(fornecedor => {
      const compras = porFornecedor[fornecedor].compras;
      const soma = compras.reduce((acc, compra) => acc + parseFloat(compra.preco_unitario_liquido), 0);
      porFornecedor[fornecedor].preco_medio = (soma / compras.length).toFixed(2);
    });
    
    res.json({
      success: true,
      data: {
        historico_completo: historico,
        analise_por_fornecedor: Object.values(porFornecedor),
        periodo_analise: `Últimos ${periodo} meses`,
        total_compras: historico.length
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar histórico de preços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de preços',
      error: error.message
    });
  }
};

/**
 * Buscar fornecedores que vendem um produto específico
 */
exports.getFornecedoresProduto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        f.id,
        f.nome,
        f.cnpj,
        f.nome_fantasia,
        COUNT(i.id) as total_vendas,
        SUM(i.quantidade) as quantidade_total,
        AVG(i.valor_liquido) as preco_medio,
        MIN(i.valor_liquido) as menor_preco,
        MAX(i.valor_liquido) as maior_preco,
        MAX(n.data_emissao) as ultima_venda
      FROM fornecedores f
      JOIN notas n ON f.id = n.fornecedor_id
      JOIN itens_nota i ON n.id = i.nota_id
      WHERE i.produto_id = ?
      GROUP BY f.id, f.nome, f.cnpj, f.nome_fantasia
      ORDER BY menor_preco ASC, ultima_venda DESC
    `;
    
    const fornecedores = await runQuery(query, [id]);
    
    res.json({
      success: true,
      data: fornecedores.map(f => ({
        ...f,
        preco_medio: parseFloat(f.preco_medio).toFixed(2),
        menor_preco: parseFloat(f.menor_preco).toFixed(2),
        maior_preco: parseFloat(f.maior_preco).toFixed(2)
      }))
    });
    
  } catch (error) {
    logger.error('Erro ao buscar fornecedores do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar fornecedores',
      error: error.message
    });
  }
};

/**
 * Obter consulta detalhada do produto com todas as informações necessárias
 */
exports.getConsultaProduto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Informações básicas do produto
    const produtoQuery = `
      SELECT * FROM produtos WHERE id = ? AND ativo = TRUE
    `;
    
    const produtos = await runQuery(produtoQuery, [id]);
    
    if (produtos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    const produto = produtos[0];
    
    // Último preço e fornecedor
    const ultimoPrecoQuery = `
      SELECT 
        i.valor_liquido as preco_unitario,
        f.nome as fornecedor_nome,
        n.data_emissao
      FROM itens_nota i
      JOIN notas n ON i.nota_id = n.id
      JOIN fornecedores f ON n.fornecedor_id = f.id
      WHERE i.produto_id = ?
      ORDER BY n.data_emissao DESC
      LIMIT 1
    `;
    
    const ultimoPreco = await runQuery(ultimoPrecoQuery, [id]);
    
    // Todos os laboratórios (fabricantes)
    const laboratoriosQuery = `
      SELECT DISTINCT p.fabricante as laboratorio
      FROM produtos p
      JOIN itens_nota i ON p.id = i.produto_id
      WHERE p.id = ? AND p.fabricante IS NOT NULL
    `;
    
    const laboratorios = await runQuery(laboratoriosQuery, [id]);
    
    // Todos os fornecedores
    const fornecedoresQuery = `
      SELECT DISTINCT f.nome as fornecedor
      FROM fornecedores f
      JOIN notas n ON f.id = n.fornecedor_id
      JOIN itens_nota i ON n.id = i.nota_id
      WHERE i.produto_id = ?
      ORDER BY f.nome
    `;
    
    const fornecedores = await runQuery(fornecedoresQuery, [id]);
    
    // 3 melhores preços agrupados por fabricante
    const melhoresPrecos = await this.getMelhoresPrecosPorFabricante(id);
    
    // Pedido médio mensal (baseado em 1 ano)
    const pedidoMedioQuery = `
      SELECT 
        AVG(monthly_total) as pedido_medio_mensal
      FROM (
        SELECT 
          DATE_TRUNC('month', n.data_emissao) as mes,
          SUM(i.quantidade) as monthly_total
        FROM itens_nota i
        JOIN notas n ON i.nota_id = n.id
        WHERE i.produto_id = ?
          AND n.data_emissao >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('month', n.data_emissao)
      ) monthly_data
    `;
    
    const pedidoMedio = await runQuery(pedidoMedioQuery, [id]);
    
    res.json({
      success: true,
      data: {
        produto: produto.nome,
        codigo: produto.codigo,
        laboratorios: laboratorios.map(l => l.laboratorio).filter(Boolean),
        fornecedores: fornecedores.map(f => f.fornecedor),
        ultimo_preco: ultimoPreco.length > 0 ? {
          valor: parseFloat(ultimoPreco[0].preco_unitario).toFixed(2),
          fornecedor: ultimoPreco[0].fornecedor_nome,
          data: ultimoPreco[0].data_emissao
        } : null,
        melhores_precos: melhoresPrecos,
        pedido_medio_mensal: pedidoMedio[0]?.pedido_medio_mensal 
          ? Math.round(parseFloat(pedidoMedio[0].pedido_medio_mensal))
          : 0
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar consulta do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar produto',
      error: error.message
    });
  }
};

/**
 * Função auxiliar para obter os 3 melhores preços por fabricante
 */
exports.getMelhoresPrecosPorFabricante = async (produtoId) => {
  try {
    const query = `
      WITH preco_por_fabricante AS (
        SELECT DISTINCT
          p.fabricante,
          MIN(i.valor_liquido) OVER (PARTITION BY p.fabricante) as menor_preco
        FROM itens_nota i
        JOIN produtos p ON i.produto_id = p.id
        JOIN notas n ON i.nota_id = n.id
        WHERE i.produto_id = ? 
          AND p.fabricante IS NOT NULL 
          AND p.fabricante != 'Não informado'
          AND i.quantidade > 0
      )
      SELECT 
        fabricante,
        menor_preco as preco_unitario
      FROM preco_por_fabricante
      ORDER BY menor_preco ASC
      LIMIT 3
    `;
    
    const result = await runQuery(query, [produtoId]);
    
    return result.map(item => ({
      fabricante: item.fabricante,
      preco: parseFloat(item.preco_unitario).toFixed(2)
    }));
    
  } catch (error) {
    logger.error('Erro ao buscar melhores preços por fabricante:', error);
    return [];
  }
};
