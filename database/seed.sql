-- Sistema de Gestão Farmacêutica - Dados de Exemplo
-- Dados iniciais para teste do sistema

-- Inserir fornecedores exemplo
INSERT INTO fornecedores (nome, cnpj, nome_fantasia, endereco_completo, ativo) VALUES
('DIFARMA DISTRIBUIDORA DE MEDICAMENTOS LTDA', '09.070.060/0001-55', 'DIFARMA FARMACEUTICA', 'RUA HAROLDO TORRES 1305, PRESIDENTE KENNEDY, FORTALEZA-CE', TRUE),
('FORTES DISTRIBUIDORA LTDA', '03.606.595/0001-11', 'FORTES DISTRIBUIDORA', 'Endereço exemplo', TRUE),
('SC DISTRIBUICAO LTDA', '12.345.678/0001-90', 'SC DISTRIBUICAO', 'Endereço exemplo', TRUE)
ON CONFLICT (cnpj) DO NOTHING;

-- Exemplo de produto (será criado automaticamente via XML na prática)
INSERT INTO produtos (nome, codigo, codigo_barras, fabricante, ncm, unidade, ativo) VALUES
('CIPROFLOXACINO 500MG C/14CPR (G) (PHARL)', '7496', '7898216360185', 'PHARL', '30042099', 'UN', TRUE),
('DIPIRONA GTS-ABERALGINA 500MG/ML 20ML (AIREL)', '6225', '7894164000463', 'AIREL', '30039099', 'UN', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- Estes dados são apenas para demonstração
-- Na prática, o sistema será alimentado via upload de XMLs de notas fiscais
