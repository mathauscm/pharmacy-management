const { runQuery } = require('../config/database');
const { logger } = require('../middleware/logger');

/**
 * Obter dados do dashboard principal
 */
exports.getDashboard = async (req, res) => {
  try {
    // Total de produtos cadastrados
    const totalProdutosQuery = 'SELECT COUNT(*) as total FROM produtos';
    const totalProdutos = await runQuery(totalProdutosQuery);
    
    // Total de fornecedores ativos
    const totalFornecedoresQuery = 'SELECT COUNT(*) as total FROM fornecedores';
    const totalFornecedores = await runQuery(totalFornecedoresQuery);
    
    // Total de notas importadas
    const totalNotasQuery = 'SELECT COUNT(*) as total FROM notas';
    const totalNotas = await runQuery(totalNotasQuery);
    
    // Valor total das compras
    const valorTotalQuery = 'SELECT SUM(valor_total) as total FROM notas';
    const valorTotal = await runQuery(valorTotalQuery);
    
    // Últimas notas importadas (top 5)
    const ultimasNotasQuery = `
      SELECT 
        n.numero,
        n.data_emissao,
        n.valor_total,
        f.nome as fornecedor,
        COUNT(i.id) as total_itens
      FROM notas n
      JOIN fornecedores f ON n.fornecedor_id = f.id
      LEFT JOIN itens_nota i ON n.id = i.nota_id
      GROUP BY n.id, f.nome
      ORDER BY n.created_at DESC
      LIMIT 5
    `;
    const ultimasNotas = await runQuery(ultimasNotasQuery);
    
    // Top 5 produtos mais comprados (por quantidade)
    const topProdutosQuery = `
      SELECT 
        p.nome,
        p.fabricante,
        SUM(i.quantidade) as quantidade_total,
        COUNT(DISTINCT n.id) as total_notas,
        AVG(i.valor_liquido / i.quantidade) as preco_medio
      FROM produtos p
      JOIN itens_nota i ON p.id = i.produto_id
      JOIN notas n ON i.nota_id = n.id
      GROUP BY p.id, p.nome, p.fabricante
      ORDER BY quantidade_total DESC
      LIMIT 5
    `;
    const topProdutos = await runQuery(topProdutosQuery);
    
    // Top 5 fornecedores por valor
    const topFornecedoresQuery = `
      SELECT 
        f.nome,
        f.cnpj,
        COUNT(n.id) as total_notas,
        SUM(n.valor_total) as valor_total,
        MAX(n.data_emissao) as ultima_compra
      FROM fornecedores f
      JOIN notas n ON f.id = n.fornecedor_id
      GROUP BY f.id, f.nome, f.cnpj
      ORDER BY valor_total DESC
      LIMIT 5
    `;
    const topFornecedores = await runQuery(topFornecedoresQuery);
    
    // Estatísticas por período (mensal dos últimos 6 meses)
    const estatisticasMensaisQuery = `
      SELECT 
        TO_CHAR(data_emissao, 'YYYY-MM') as mes,
        COUNT(*) as total_notas,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as valor_medio
      FROM notas
      WHERE data_emissao >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(data_emissao, 'YYYY-MM')
      ORDER BY mes DESC
    `;
    const estatisticasMensais = await runQuery(estatisticasMensaisQuery);
    
    res.json({
      success: true,
      data: {
        resumo: {
          total_produtos: totalProdutos[0]?.total || 0,
          total_fornecedores: totalFornecedores[0]?.total || 0,
          total_notas: totalNotas[0]?.total || 0,
          valor_total_compras: parseFloat(valorTotal[0]?.total || 0).toFixed(2)
        },
        ultimas_notas: ultimasNotas.map(nota => ({
          ...nota,
          valor_total: parseFloat(nota.valor_total).toFixed(2)
        })),
        top_produtos: topProdutos.map(produto => ({
          ...produto,
          preco_medio: parseFloat(produto.preco_medio).toFixed(2)
        })),
        top_fornecedores: topFornecedores.map(fornecedor => ({
          ...fornecedor,
          valor_total: parseFloat(fornecedor.valor_total).toFixed(2)
        })),
        estatisticas_mensais: estatisticasMensais.map(stat => ({
          ...stat,
          valor_total: parseFloat(stat.valor_total).toFixed(2),
          valor_medio: parseFloat(stat.valor_medio).toFixed(2)
        }))
      }
    });
    
  } catch (error) {
    logger.error('Erro ao carregar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do dashboard',
      error: error.message
    });
  }
};

/**
 * Obter relatório de estoque baixo
 */
exports.getEstoqueBaixo = async (req, res) => {
  try {
    const { limite = 10 } = req.query;
    
    // Esta consulta é simplificada, pois não temos estoque real
    // Em uma implementação real, haveria controle de entrada/saída
    const query = `
      SELECT 
        p.id,
        p.nome,
        p.fabricante,
        p.unidade,
        SUM(i.quantidade) as quantidade_comprada,
        MAX(n.data_emissao) as ultima_compra,
        AVG(i.valor_liquido / i.quantidade) as preco_medio,
        -- Simulação de estoque baixo baseado em tempo desde última compra
        julianday('now') - julianday(MAX(n.data_emissao)) as dias_sem_compra
      FROM produtos p
      LEFT JOIN itens_nota i ON p.id = i.produto_id
      LEFT JOIN notas n ON i.nota_id = n.id
      GROUP BY p.id, p.nome, p.fabricante, p.unidade
      HAVING dias_sem_compra > 30 OR dias_sem_compra IS NULL
      ORDER BY dias_sem_compra DESC
      LIMIT ?
    `;
    
    const produtosEstoqueBaixo = await runQuery(query, [limite]);
    
    res.json({
      success: true,
      data: produtosEstoqueBaixo.map(produto => ({
        ...produto,
        preco_medio: produto.preco_medio ? parseFloat(produto.preco_medio).toFixed(2) : '0.00',
        status_alerta: produto.dias_sem_compra === null ? 'nunca_comprado' : 
                      produto.dias_sem_compra > 60 ? 'critico' : 'atencao'
      }))
    });
    
  } catch (error) {
    logger.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos com estoque baixo',
      error: error.message
    });
  }
};

/**
 * Obter métricas de desempenho
 */
exports.getMetricas = async (req, res) => {
  try {
    const { periodo = '30' } = req.query; // dias
    
    // Compras por período
    const comprasQuery = `
      SELECT 
        COUNT(*) as total_notas,
        SUM(valor_total) as valor_total,
        AVG(valor_total) as ticket_medio,
        COUNT(DISTINCT fornecedor_id) as fornecedores_distintos
      FROM notas
      WHERE data_emissao >= DATE('now', '-' || ? || ' days')
    `;
    const compras = await runQuery(comprasQuery, [periodo]);
    
    // Produtos mais comprados no período
    const produtosPeriodoQuery = `
      SELECT 
        p.nome,
        SUM(i.quantidade) as quantidade,
        COUNT(DISTINCT n.id) as vezes_comprado
      FROM produtos p
      JOIN itens_nota i ON p.id = i.produto_id
      JOIN notas n ON i.nota_id = n.id
      WHERE n.data_emissao >= DATE('now', '-' || ? || ' days')
      GROUP BY p.id, p.nome
      ORDER BY quantidade DESC
      LIMIT 10
    `;
    const produtosPeriodo = await runQuery(produtosPeriodoQuery, [periodo]);
    
    // Comparação com período anterior
    const periodoAnteriorQuery = `
      SELECT 
        COUNT(*) as total_notas,
        SUM(valor_total) as valor_total
      FROM notas
      WHERE data_emissao >= DATE('now', '-' || (? * 2) || ' days')
        AND data_emissao < DATE('now', '-' || ? || ' days')
    `;
    const periodoAnterior = await runQuery(periodoAnteriorQuery, [periodo, periodo]);
    
    const comprasAtual = compras[0] || {};
    const comprasAnt = periodoAnterior[0] || {};
    
    const crescimentoNotas = comprasAnt.total_notas ? 
      (((comprasAtual.total_notas - comprasAnt.total_notas) / comprasAnt.total_notas) * 100) : 0;
    
    const crescimentoValor = comprasAnt.valor_total ? 
      (((comprasAtual.valor_total - comprasAnt.valor_total) / comprasAnt.valor_total) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        periodo_analisado: `Últimos ${periodo} dias`,
        metricas_atuais: {
          ...comprasAtual,
          valor_total: parseFloat(comprasAtual.valor_total || 0).toFixed(2),
          ticket_medio: parseFloat(comprasAtual.ticket_medio || 0).toFixed(2)
        },
        comparacao_periodo_anterior: {
          crescimento_notas: crescimentoNotas.toFixed(2),
          crescimento_valor: crescimentoValor.toFixed(2)
        },
        top_produtos_periodo: produtosPeriodo
      }
    });
    
  } catch (error) {
    logger.error('Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar métricas de desempenho',
      error: error.message
    });
  }
};
