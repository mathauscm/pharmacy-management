-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50),
    codigo_barras VARCHAR(50),
    laboratorio VARCHAR(255),
    principio_ativo VARCHAR(255),
    categoria VARCHAR(100),
    unidade VARCHAR(10) DEFAULT 'UN',
    estoque_atual DECIMAL(10,2) DEFAULT 0,
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(10),
    data_emissao DATE NOT NULL,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fornecedor_id INTEGER NOT NULL,
    valor_produtos DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_desconto DECIMAL(12,2) DEFAULT 0,
    valor_total DECIMAL(12,2) NOT NULL,
    observacoes TEXT,
    arquivo_xml TEXT,
    status VARCHAR(20) DEFAULT 'processada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

-- Tabela de Itens da Nota
CREATE TABLE IF NOT EXISTS itens_nota (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nota_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    desconto_percentual DECIMAL(5,2) DEFAULT 0,
    desconto_valor DECIMAL(10,2) DEFAULT 0,
    valor_liquido DECIMAL(10,2) NOT NULL,
    lote VARCHAR(50),
    data_validade DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de Movimentação de Estoque
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'entrada', 'saida', 'ajuste'
    quantidade DECIMAL(10,2) NOT NULL,
    estoque_anterior DECIMAL(10,2) NOT NULL,
    estoque_atual DECIMAL(10,2) NOT NULL,
    referencia_id INTEGER, -- ID da nota ou venda
    referencia_tipo VARCHAR(20), -- 'nota', 'venda', 'ajuste'
    observacao TEXT,
    usuario VARCHAR(100),
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_laboratorio ON produtos(laboratorio);
CREATE INDEX IF NOT EXISTS idx_notas_numero ON notas(numero);
CREATE INDEX IF NOT EXISTS idx_notas_fornecedor ON notas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_data ON notas(data_emissao);
CREATE INDEX IF NOT EXISTS idx_itens_nota_id ON itens_nota(nota_id);
CREATE INDEX IF NOT EXISTS idx_itens_produto_id ON itens_nota(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacao_produto ON movimentacao_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacao_data ON movimentacao_estoque(data_movimentacao);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_fornecedores_timestamp 
    AFTER UPDATE ON fornecedores
    FOR EACH ROW
BEGIN
    UPDATE fornecedores SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_produtos_timestamp 
    AFTER UPDATE ON produtos
    FOR EACH ROW
BEGIN
    UPDATE produtos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_notas_timestamp 
    AFTER UPDATE ON notas
    FOR EACH ROW
BEGIN
    UPDATE notas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Views úteis para relatórios
CREATE VIEW IF NOT EXISTS view_produtos_estoque AS
SELECT 
    p.id,
    p.nome,
    p.codigo,
    p.laboratorio,
    p.estoque_atual,
    p.estoque_minimo,
    CASE 
        WHEN p.estoque_atual <= p.estoque_minimo THEN 'BAIXO'
        WHEN p.estoque_atual <= (p.estoque_minimo * 1.5) THEN 'ATENCAO'
        ELSE 'OK'
    END as status_estoque,
    (SELECT AVG(valor_liquido/quantidade) 
     FROM itens_nota i 
     JOIN notas n ON i.nota_id = n.id 
     WHERE i.produto_id = p.id 
     AND n.data_emissao >= date('now', '-90 days')
    ) as preco_medio_90dias
FROM produtos p
WHERE p.ativo = 1;

CREATE VIEW IF NOT EXISTS view_historico_precos AS
SELECT 
    p.id as produto_id,
    p.nome as produto_nome,
    p.codigo as produto_codigo,
    f.id as fornecedor_id,
    f.nome as fornecedor_nome,
    n.numero as nota_numero,
    n.data_emissao,
    i.quantidade,
    i.valor_unitario,
    i.desconto_valor,
    i.valor_liquido,
    (i.valor_liquido / i.quantidade) as preco_unitario_liquido
FROM itens_nota i
JOIN notas n ON i.nota_id = n.id
JOIN produtos p ON i.produto_id = p.id
JOIN fornecedores f ON n.fornecedor_id = f.id
WHERE p.ativo = 1 AND f.ativo = 1
ORDER BY n.data_emissao DESC;