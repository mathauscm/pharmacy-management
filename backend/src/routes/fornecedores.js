const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pharmacy_db',
  password: process.env.DB_PASSWORD || 'pharmacy_password',
  port: process.env.DB_PORT || 5432,
});

// Listar fornecedores
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    let query = `
      SELECT 
        f.*,
        COUNT(DISTINCT n.id) as total_notas,
        COUNT(DISTINCT i.produto_id) as total_produtos_diferentes,
        SUM(n.valor_total) as valor_total_compras,
        MAX(n.data_emissao) as ultima_compra
      FROM fornecedores f
      LEFT JOIN notas n ON f.id = n.fornecedor_id
      LEFT JOIN itens_nota i ON n.id = i.nota_id
    `;
    
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` WHERE (f.nome ILIKE $${paramCount} OR f.cnpj ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY f.id ORDER BY f.nome LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const countQuery = search 
      ? `SELECT COUNT(*) FROM fornecedores WHERE (nome ILIKE $1 OR cnpj ILIKE $1)`
      : `SELECT COUNT(*) FROM fornecedores`;
    const countParams = search ? [`%${search}%`] : [];

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter fornecedor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        f.*,
        COUNT(DISTINCT n.id) as total_notas,
        COUNT(DISTINCT i.produto_id) as total_produtos_diferentes,
        SUM(n.valor_total) as valor_total_compras,
        AVG(i.valor_unitario) as preco_medio,
        MAX(n.data_emissao) as ultima_compra
      FROM fornecedores f
      LEFT JOIN notas n ON f.id = n.fornecedor_id
      LEFT JOIN itens_nota i ON n.id = i.nota_id
      WHERE f.id = $1
      GROUP BY f.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor não encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter produtos de um fornecedor
router.get('/:id/produtos', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT DISTINCT
        p.*,
        COUNT(i.id) as total_compras,
        SUM(i.quantidade) as quantidade_total,
        AVG(i.valor_unitario) as preco_medio,
        MIN(i.valor_unitario) as menor_preco,
        MAX(i.valor_unitario) as maior_preco,
        MAX(n.data_emissao) as ultima_compra
      FROM produtos p
      INNER JOIN itens_nota i ON p.id = i.produto_id
      INNER JOIN notas n ON i.nota_id = n.id
      WHERE n.fornecedor_id = $1
      GROUP BY p.id
      ORDER BY p.nome
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar produtos do fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;