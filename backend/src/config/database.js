const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const { logger } = require('../middleware/logger');

let db = null;

// Configurações do PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pharmacy_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * Inicializar conexão com banco de dados PostgreSQL
 */
async function initializeDatabase() {
  try {
    await initializePostgreSQL();
    logger.info('Banco de dados PostgreSQL conectado com sucesso');
    await createTables();
    
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Inicializar PostgreSQL
 */
async function initializePostgreSQL() {
  db = new Pool(dbConfig);
  
  // Testar conexão
  const client = await db.connect();
  await client.query('SELECT NOW()');
  client.release();
  
  logger.info('PostgreSQL pool criado com sucesso');
}

/**
 * Criar tabelas do banco
 */
async function createTables() {
  const sqlPath = path.join(__dirname, '../models/database.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Dividir comandos SQL
  const statements = sqlContent
    .split(';')
    .filter(stmt => stmt.trim().length > 0);

  for (const statement of statements) {
    try {
      await runQuery(statement.trim());
    } catch (error) {
      if (!error.message.includes('already exists')) {
        logger.error('Erro ao executar statement:', statement);
        throw error;
      }
    }
  }

  logger.info('Tabelas criadas/verificadas com sucesso');
}

/**
 * Executar query no banco PostgreSQL
 * Converte automaticamente sintaxe ? para $1, $2, etc.
 */
function runQuery(sql, params = [], connection = null) {
  const client = connection || db;
  
  return new Promise((resolve, reject) => {
    // Converter sintaxe ? para $1, $2, etc. para PostgreSQL
    let convertedQuery = sql;
    let paramIndex = 1;
    
    // Substituir cada ? por $1, $2, $3, etc.
    convertedQuery = convertedQuery.replace(/\?/g, () => `$${paramIndex++}`);
    
    client.query(convertedQuery, params)
      .then(result => {
        if (sql.trim().toLowerCase().startsWith('select')) {
          resolve(result.rows);
        } else {
          resolve({
            id: result.rows[0]?.id,
            lastID: result.rows[0]?.id,
            rowCount: result.rowCount,
            changes: result.rowCount
          });
        }
      })
      .catch(reject);
  });
}

/**
 * Executar query com retorno de múltiplas linhas
 */
function getAllQuery(sql, params = []) {
  return runQuery(sql, params);
}

/**
 * Executar query com retorno de uma linha
 */
async function getQuery(sql, params = []) {
  const rows = await runQuery(sql, params);
  return rows[0] || null;
}

/**
 * Iniciar transação PostgreSQL
 */
async function beginTransaction() {
  const client = await db.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * Confirmar transação PostgreSQL
 */
async function commitTransaction(client) {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * Cancelar transação PostgreSQL
 */
async function rollbackTransaction(client) {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * Fechar conexão com PostgreSQL
 */
function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.end(() => {
        logger.info('PostgreSQL pool fechado com sucesso');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  runQuery,
  getAllQuery,
  getQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  closeDatabase,
  getDatabase: () => db
};