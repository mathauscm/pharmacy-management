/**
 * Queries SQL reutilizáveis do sistema
 */

// Queries de produtos
const PRODUTOS_QUERIES = {
  // Buscar todos os produtos com informações básicas
  GET_ALL: `
    SELECT 
      p.id, p.nome, p.codigo, p.codigo_barras, p.fabricante, 
      p.unidade, p.estoque_atual, p.estoque_minimo, p.ativo
    FROM produtos p
    WHERE p.ativo = TRUE
    ORDER BY p.nome
  `,
  
  // Buscar produto por ID com estatísticas
  GET_BY_ID_WITH_STATS: `
    SELECT 
      p.*,
      COUNT(DISTINCT i.nota_id) as total_notas,
      SUM(i.quantidade) as quantidade_total_comprada,
      AVG(i.valor_liquido / i.quantidade) as preco_medio,
      MAX(i.valor_liquido / i.quantidade) as maior_preco,
      MIN(i.valor_liquido / i.quantidade) as menor_preco,
      MAX(n.data_emissao) as ultima_compra
    FROM produtos p
    LEFT JOIN itens_nota i ON p.id = i.produto_id
    LEFT JOIN notas n ON i.nota_id = n.id
    WHERE p.id = $1
    GROUP BY p.id
  `,
  
  // Buscar produtos com filtros
  SEARCH: `
    SELECT 
      p.id, p.nome, p.codigo, p.codigo_barras, p.fabricante,
      p.unidade, p.estoque_atual, p.estoque_minimo,
      MAX(i.valor_liquido / i.quantidade) as maior_preco,
      MIN(i.valor_liquido / i.quantidade) as menor_preco,
      AVG(i.valor_liquido / i.quantidade) as preco_medio,
      MAX(n.data_emissao) as ultima_compra,
      SUM(i.quantidade) as quantidade_total_comprada,
      COUNT(DISTINCT n.id) as total_notas
    FROM produtos p
    LEFT JOIN itens_nota i ON p.id = i.produto_id
    LEFT JOIN notas n ON i.nota_id = n.id
    WHERE p.ativo = TRUE
  `,
  
  // Produtos com estoque baixo
  ESTOQUE_BAIXO: `
    SELECT 
      p.id, p.nome, p.codigo, p.fabricante, p.unidade,
      p.estoque_atual, p.estoque_minimo,
      CASE 
        WHEN p.estoque_atual = 0 THEN 'SEM_ESTOQUE'
        WHEN p.estoque_atual <= p.estoque_minimo THEN 'ESTOQUE_BAIXO'
        ELSE 'OK'
      END as status_estoque
    FROM produtos p
    WHERE p.ativo = TRUE 
      AND p.estoque_atual <= p.estoque_minimo
    ORDER BY p.estoque_atual ASC, p.nome
  `
};

// Queries de notas fiscais
const NOTAS_QUERIES = {
  // Buscar todas as notas com fornecedor
  GET_ALL_WITH_FORNECEDOR: `
    SELECT 
      n.id, n.numero, n.serie, n.data_emissao, n.chave_acesso,
      n.valor_total, n.status,
      f.nome as fornecedor_nome, f.cnpj as fornecedor_cnpj,
      COUNT(i.id) as total_itens
    FROM notas n
    JOIN fornecedores f ON n.fornecedor_id = f.id
    LEFT JOIN itens_nota i ON n.id = i.nota_id
    GROUP BY n.id, f.nome, f.cnpj
    ORDER BY n.data_emissao DESC
  `,
  
  // Buscar nota por ID com detalhes completos
  GET_BY_ID_COMPLETE: `
    SELECT 
      n.*,
      f.nome as fornecedor_nome, f.cnpj as fornecedor_cnpj,
      f.nome_fantasia as fornecedor_fantasia,
      f.endereco_completo as fornecedor_endereco
    FROM notas n
    JOIN fornecedores f ON n.fornecedor_id = f.id
    WHERE n.id = $1
  `,
  
  // Últimas notas processadas
  ULTIMAS: `
    SELECT 
      n.numero, n.data_emissao, n.valor_total,
      f.nome as fornecedor,
      COUNT(i.id) as total_itens
    FROM notas n
    JOIN fornecedores f ON n.fornecedor_id = f.id
    LEFT JOIN itens_nota i ON n.id = i.nota_id
    GROUP BY n.id, f.nome
    ORDER BY n.created_at DESC
    LIMIT $1
  `
};

// Queries de fornecedores
const FORNECEDORES_QUERIES = {
  // Buscar fornecedores com estatísticas
  GET_WITH_STATS: `
    SELECT 
      f.id, f.nome, f.cnpj, f.nome_fantasia,
      COUNT(n.id) as total_notas,
      SUM(n.valor_total) as valor_total,
      MAX(n.data_emissao) as ultima_compra,
      AVG(n.valor_total) as ticket_medio
    FROM fornecedores f
    LEFT JOIN notas n ON f.id = n.fornecedor_id
    WHERE f.ativo = TRUE
    GROUP BY f.id, f.nome, f.cnpj, f.nome_fantasia
    ORDER BY valor_total DESC NULLS LAST
  `,
  
  // Fornecedores que vendem um produto específico
  BY_PRODUTO: `
    SELECT DISTINCT
      f.id, f.nome, f.cnpj, f.nome_fantasia,
      COUNT(i.id) as total_vendas,
      SUM(i.quantidade) as quantidade_total,
      AVG(i.valor_liquido / i.quantidade) as preco_medio,
      MIN(i.valor_liquido / i.quantidade) as menor_preco,
      MAX(i.valor_liquido / i.quantidade) as maior_preco,
      MAX(n.data_emissao) as ultima_venda
    FROM fornecedores f
    JOIN notas n ON f.id = n.fornecedor_id
    JOIN itens_nota i ON n.id = i.nota_id
    WHERE i.produto_id = $1 AND f.ativo = TRUE
    GROUP BY f.id, f.nome, f.cnpj, f.nome_fantasia
    ORDER BY menor_preco ASC, ultima_venda DESC
  `
};

// Queries para dashboard
const DASHBOARD_QUERIES = {
  // Resumo geral
  RESUMO: {
    TOTAL_PRODUTOS: 'SELECT COUNT(*) as total FROM produtos WHERE ativo = TRUE',
    TOTAL_FORNECEDORES: 'SELECT COUNT(*) as total FROM fornecedores WHERE ativo = TRUE',
    TOTAL_NOTAS: 'SELECT COUNT(*) as total FROM notas',
    VALOR_TOTAL_COMPRAS: 'SELECT SUM(valor_total) as total FROM notas'
  },
  
  // Top produtos mais comprados
  TOP_PRODUTOS: `
    SELECT 
      p.nome, p.fabricante,
      SUM(i.quantidade) as quantidade_total,
      COUNT(DISTINCT n.id) as total_notas,
      AVG(i.valor_liquido / i.quantidade) as preco_medio
    FROM produtos p
    JOIN itens_nota i ON p.id = i.produto_id
    JOIN notas n ON i.nota_id = n.id
    GROUP BY p.id, p.nome, p.fabricante
    ORDER BY quantidade_total DESC
    LIMIT $1
  `,
  
  // Top fornecedores por valor
  TOP_FORNECEDORES: `
    SELECT 
      f.nome, f.cnpj,
      COUNT(n.id) as total_notas,
      SUM(n.valor_total) as valor_total,
      MAX(n.data_emissao) as ultima_compra
    FROM fornecedores f
    JOIN notas n ON f.id = n.fornecedor_id
    GROUP BY f.id, f.nome, f.cnpj
    ORDER BY valor_total DESC
    LIMIT $1
  `,
  
  // Estatísticas mensais
  ESTATISTICAS_MENSAIS: `
    SELECT 
      TO_CHAR(data_emissao, 'YYYY-MM') as mes,
      COUNT(*) as total_notas,
      SUM(valor_total) as valor_total,
      AVG(valor_total) as valor_medio
    FROM notas
    WHERE data_emissao >= CURRENT_DATE - INTERVAL '$1 months'
    GROUP BY TO_CHAR(data_emissao, 'YYYY-MM')
    ORDER BY mes DESC
  `
};

// Queries de histórico e relatórios
const HISTORICO_QUERIES = {
  // Histórico de preços de um produto
  PRECOS_PRODUTO: `
    SELECT 
      f.nome as fornecedor, f.cnpj,
      n.data_emissao, n.numero as nota,
      i.quantidade, i.valor_unitario, i.valor_liquido, i.desconto,
      (i.valor_liquido / i.quantidade) as preco_unitario_liquido
    FROM itens_nota i
    JOIN notas n ON i.nota_id = n.id
    JOIN fornecedores f ON n.fornecedor_id = f.id
    WHERE i.produto_id = $1 
      AND n.data_emissao >= CURRENT_DATE - INTERVAL '$2 months'
    ORDER BY n.data_emissao DESC, i.valor_liquido ASC
  `,
  
  // Histórico de movimentação de estoque
  MOVIMENTACAO_ESTOQUE: `
    SELECT 
      m.*,
      p.nome as produto_nome,
      p.codigo as produto_codigo
    FROM movimentacao_estoque m
    JOIN produtos p ON m.produto_id = p.id
    WHERE m.produto_id = $1
    ORDER BY m.data_movimentacao DESC
    LIMIT $2
  `
};

module.exports = {
  PRODUTOS: PRODUTOS_QUERIES,
  NOTAS: NOTAS_QUERIES,
  FORNECEDORES: FORNECEDORES_QUERIES,
  DASHBOARD: DASHBOARD_QUERIES,
  HISTORICO: HISTORICO_QUERIES,
  
  // Para compatibilidade
  getProdutos: PRODUTOS_QUERIES.GET_ALL,
  getNotas: NOTAS_QUERIES.GET_ALL_WITH_FORNECEDOR
};
