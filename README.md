# 🏥 Sistema de Gestão de Farmácia

Sistema completo para gestão de farmácia com processamento de notas fiscais XML, controle de estoque e relatórios de preços e fornecedores.

## 📋 Funcionalidades

### Backend (Node.js)
- ✅ **Parser XML de NFe**: Processamento automático de notas fiscais eletrônicas
- ✅ **API REST**: Endpoints para todas as funcionalidades do sistema
- ✅ **Banco de Dados**: PostgreSQL com configuração completa
- ✅ **Controle de Estoque**: Cálculo automático de estoque mínimo e sugestões de compra
- ✅ **Histórico de Preços**: Análise de preços por fornecedor e produto
- ✅ **Dashboard**: Métricas e estatísticas do sistema

### Frontend (React + Vite)
- ✅ **Interface Moderna**: Design responsivo e intuitivo
- ✅ **Upload de XMLs**: Interface drag-and-drop para upload de arquivos
- ✅ **Tabela de Produtos**: Listagem com filtros, ordenação e paginação
- ✅ **Dashboard**: Visão geral com gráficos e estatísticas
- ✅ **Relatórios**: Histórico de preços e análises por fornecedor

## 🏗️ Arquitetura do Projeto

```
pharmacy-management/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── config/         # Configurações (banco, multer)
│   │   ├── controllers/    # Controladores da API
│   │   ├── middleware/     # Middlewares (auth, logs, validação)
│   │   ├── models/         # Schema do banco de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio (parser XML, cálculos)
│   │   └── utils/          # Utilitários e helpers
│   ├── uploads/            # Diretório para arquivos temporários
│   └── logs/               # Logs do sistema
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # Serviços de API
│   │   ├── styles/         # Estilos CSS
│   │   └── utils/          # Utilitários do frontend
├── database/               # Scripts SQL
├── docker-compose.yml      # Configuração Docker para produção
└── docker-compose.dev.yml  # Configuração Docker para desenvolvimento
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Docker (opcional)

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone <repository-url>
cd pharmacy-management
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Backend**
```bash
cd backend
npm install
npm run dev
```
O backend estará disponível em `http://localhost:3000`

4. **Frontend** (em outro terminal)
```bash
cd frontend
npm install
npm run dev
```
O frontend estará disponível em `http://localhost:5173`

### Usando Docker

#### Desenvolvimento
```bash
# Subir todos os serviços em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up --build
```

#### Produção
```bash
# Subir todos os serviços em modo produção
docker-compose up --build -d
```

## 📊 Banco de Dados

### Estrutura das Tabelas

#### Fornecedores
- `id`, `nome`, `cnpj`, `nome_fantasia`
- `endereco_completo`, `ativo`
- `created_at`, `updated_at`

#### Produtos  
- `id`, `nome`, `codigo`, `codigo_barras`
- `fabricante`, `ncm`, `unidade`
- `estoque_atual`, `estoque_minimo`, `ativo`
- `created_at`, `updated_at`

#### Notas
- `id`, `numero`, `serie`, `data_emissao`
- `chave_acesso`, `valor_total`, `fornecedor_id`
- `status`, `created_at`, `updated_at`

#### Itens da Nota
- `id`, `nota_id`, `produto_id`, `item`
- `quantidade`, `valor_unitario`, `valor_total`
- `desconto`, `valor_liquido`
- `created_at`

### Inicialização
O banco PostgreSQL é criado automaticamente na primeira execução usando:
- `backend/src/models/database.sql` - Schema completo das tabelas
- Views e índices otimizados para performance
- Triggers para atualização automática de timestamps

## 🔧 API Endpoints

### Notas Fiscais
- `POST /api/notas/upload` - Upload de arquivos XML
- `GET /api/notas` - Listar notas com filtros
- `GET /api/notas/:id` - Detalhes de uma nota
- `DELETE /api/notas/:id` - Excluir nota
- `PUT /api/notas/:id/reprocess` - Reprocessar XML

### Produtos
- `GET /api/produtos` - Listar produtos com filtros e paginação
- `GET /api/produtos/:id` - Detalhes de um produto
- `GET /api/produtos/:id/historico-precos` - Histórico de preços
- `GET /api/produtos/:id/fornecedores` - Fornecedores do produto

### Dashboard
- `GET /api/dashboard` - Dados gerais do dashboard
- `GET /api/dashboard/estoque-baixo` - Produtos com estoque baixo
- `GET /api/dashboard/metricas` - Métricas de desempenho

### Health Check
- `GET /health` - Status do sistema

## 📁 Processamento de XML

O sistema processa automaticamente arquivos XML de NFe extraindo:

- **Dados do Fornecedor**: Nome, CNPJ, endereço
- **Dados da Nota**: Número, série, data, chave de acesso, valor total
- **Itens**: Produtos, quantidades, valores, descontos

### Formato Suportado
- Arquivos XML de NFe padrão SEFAZ
- Tamanho máximo: 5MB por arquivo
- Múltiplos arquivos simultâneos

## 📈 Funcionalidades Avançadas

### Cálculo de Estoque Mínimo
- Baseado na média de consumo dos últimos 90 dias
- Sugestões automáticas de quantidade para compra
- Alertas de estoque baixo

### Análise de Preços
- Histórico de preços por produto e fornecedor
- Comparação de preços entre fornecedores
- Identificação do fornecedor com melhor preço

### Relatórios
- Dashboard com estatísticas gerais
- Produtos mais comprados
- Principais fornecedores
- Estatísticas mensais

## 🔐 Segurança

- Validação de arquivos XML
- Sanitização de dados de entrada
- Logs detalhados de operações
- Controle de tamanho de upload
- Headers de segurança (Helmet.js)

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **xml2js** - Parser de XML
- **sqlite3/pg** - Bancos de dados
- **multer** - Upload de arquivos
- **joi** - Validação de dados
- **winston** - Sistema de logs
- **helmet** - Segurança

### Frontend
- **React 18** - Biblioteca de interface
- **Vite** - Build tool
- **CSS3** - Estilos
- **Fetch API** - Requisições HTTP

### DevOps
- **Docker** - Containerização
- **PostgreSQL** - Banco de produção
- **Redis** - Cache (opcional)
- **Nginx** - Reverse proxy (opcional)

## 🧪 Comandos Úteis

### Backend
```bash
npm start          # Produção
npm run dev        # Desenvolvimento com nodemon
npm run seed       # Popular dados de teste
npm test           # Executar testes
```

### Frontend
```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
```

### Docker
```bash
# Logs dos containers
docker-compose logs -f

# Parar todos os serviços
docker-compose down

# Rebuild específico
docker-compose build backend

# Executar comandos no container
docker-compose exec backend npm run seed
```

## 📝 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Servidor
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Banco de dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
DB_USER=postgres
DB_PASSWORD=password

# Upload e logs
UPLOAD_MAX_SIZE=50mb
LOG_LEVEL=info

# Outros
JWT_SECRET=sua_chave_secreta
ESTOQUE_MINIMO_PADRAO=10
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🐛 Suporte

Para reportar bugs ou solicitar features:
1. Verifique se já existe uma issue similar
2. Crie uma nova issue com template apropriado
3. Forneça o máximo de detalhes possível

## 🚀 Roadmap

- [ ] Sistema de autenticação e autorização
- [ ] Módulo de vendas e saídas de estoque
- [ ] Relatórios avançados em PDF
- [ ] Integração com sistemas de gestão
- [ ] App mobile
- [ ] Backup automático
- [ ] Notificações por email/SMS
- [ ] Módulo de compras automatizadas