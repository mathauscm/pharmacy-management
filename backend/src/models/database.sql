-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    nome_fantasia VARCHAR(255),
    endereco_completo TEXT,
    email VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    codigo_barras VARCHAR(50),
    fabricante VARCHAR(255),
    ncm VARCHAR(10),
    unidade VARCHAR(10) DEFAULT 'UN',
    estoque_atual DECIMAL(10,2) DEFAULT 0,
    estoque_minimo DECIMAL(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS notas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(10),
    data_emissao DATE NOT NULL,
    chave_acesso VARCHAR(44) UNIQUE,
    valor_total DECIMAL(12,2) NOT NULL,
    fornecedor_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'processada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);

-- Tabela de Itens da Nota
CREATE TABLE IF NOT EXISTS itens_nota (
    id SERIAL PRIMARY KEY,
    nota_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    item INTEGER NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_liquido DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de Movimentação de Estoque
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id SERIAL PRIMARY KEY,
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

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_fornecedores_updated_at 
    BEFORE UPDATE ON fornecedores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at 
    BEFORE UPDATE ON produtos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_updated_at 
    BEFORE UPDATE ON notas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Views úteis para relatórios
CREATE OR REPLACE VIEW view_produtos_estoque AS
SELECT 
    p.id,
    p.nome,
    p.codigo,
    p.fabricante,
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
     AND n.data_emissao >= CURRENT_DATE - INTERVAL '90 days'
    ) as preco_medio_90dias
FROM produtos p
WHERE p.ativo = TRUE;

CREATE OR REPLACE VIEW view_historico_precos AS
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
WHERE p.ativo = TRUE AND f.ativo = TRUE
ORDER BY n.data_emissao DESC;