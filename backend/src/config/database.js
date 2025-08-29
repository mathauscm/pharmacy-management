const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const logger = require('../middleware/logger');

let db = null;

// Configurações do banco
const dbConfig = {
  type: process.env.DB_TYPE || 'sqlite',
  sqlite: {
    path: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite')
  },
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pharmacy',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

/**
 * Inicializar conexão com banco de dados
 */
async function initializeDatabase() {
  try {
    if (dbConfig.type === 'sqlite') {
      await initializeSQLite();
    } else if (dbConfig.type === 'postgres') {
      await initializePostgreSQL();
    } else {
      throw new Error(`Tipo de banco não suportado: ${dbConfig.type}`);
    }

    logger.info(`Banco de dados ${dbConfig.type} conectado com sucesso`);
    await createTables();
    
  } catch (error) {
    logger.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Inicializar SQLite
 */
function initializeSQLite() {
  return new Promise((resolve, reject) => {
    const dbPath = dbConfig.sqlite.path;
    const dbDir = path.dirname(dbPath);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        logger.info(`SQLite database conectado: ${dbPath}`);
        resolve();
      }
    });

    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
  });
}

/**
 * Inicializar PostgreSQL
 */
async function initializePostgreSQL() {
  db = new Pool(dbConfig.postgres);
  
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
 * Executar query no banco
 */
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbConfig.type === 'sqlite') {
      if (sql.trim().toLowerCase().startsWith('select')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            insertId: this.lastID, 
            changes: this.changes 
          });
        });
      }
    } else if (dbConfig.type === 'postgres') {
      db.query(sql, params)
        .then(result => {
          if (sql.trim().toLowerCase().startsWith('select')) {
            resolve(result.rows);
          } else {
            resolve({
              insertId: result.rows[0]?.id,
              changes: result.rowCount
            });
          }
        })
        .catch(reject);
    }
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
 * Iniciar transação
 */
function beginTransaction() {
  return new Promise((resolve, reject) => {
    if (dbConfig.type === 'sqlite') {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      // Para PostgreSQL, precisaria implementar pool de transações
      resolve();
    }
  });
}

/**
 * Confirmar transação
 */
function commitTransaction() {
  return new Promise((resolve, reject) => {
    if (dbConfig.type === 'sqlite') {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Cancelar transação
 */
function rollbackTransaction() {
  return new Promise((resolve, reject) => {
    if (dbConfig.type === 'sqlite') {
      db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Fechar conexão com banco
 */
function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      if (dbConfig.type === 'sqlite') {
        db.close((err) => {
          if (err) logger.error('Erro ao fechar SQLite:', err);
          else logger.info('SQLite fechado com sucesso');
          resolve();
        });
      } else if (dbConfig.type === 'postgres') {
        db.end(() => {
          logger.info('PostgreSQL pool fechado com sucesso');
          resolve();
        });
      }
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