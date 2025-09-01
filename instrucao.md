# 🚀 Instruções para Executar o Sistema de Gestão de Farmácia

## ✅ Projeto Pronto para Uso!

Este documento contém as instruções completas para rodar e testar o sistema.

---

## 🚀 **Opção 1: Docker (Mais Fácil - Recomendado)**

```bash
# 1. Clone e acesse o projeto
cd pharmacy-management

# 2. Subir todos os serviços
docker-compose -f docker-compose.dev.yml up --build

# Aguarde alguns minutos na primeira execução (baixar imagens, build, etc.)
```

**Acesso:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Adminer** (admin banco): http://localhost:8080

---

## 🛠️ **Opção 2: Local (Precisa PostgreSQL)**

**Pré-requisitos:**
- Node.js 18+
- PostgreSQL rodando
- npm

```bash
# 1. Configure banco PostgreSQL
# Crie database: pharmacy_db
# User: postgres, Password: password (ou ajuste no .env)

# 2. Configure variáveis
cp .env.example .env
# Edite .env se necessário

# 3. Backend
cd backend
npm install
npm run dev

# 4. Frontend (novo terminal)
cd frontend  
npm install
npm run dev
```

---

## 🧪 **Como Testar o Sistema**

### 1. **Acesse o Frontend**
Abra http://localhost:5173 no navegador

### 2. **Teste Upload XML**
- Vá em "Upload XML" ou na tela principal
- Arraste arquivos XML de NFe ou clique para selecionar
- Faça upload e veja o processamento em tempo real
- Observe os resultados: sucessos/erros por arquivo

### 3. **Visualize Produtos**
- Acesse seção "Produtos" 
- Veja tabela completa com:
  - Filtros por nome e fabricante
  - Ordenação por colunas
  - Paginação automática
- Clique em "Ver detalhes" de um produto para histórico

### 4. **Dashboard Completo**
- Visualize métricas gerais do sistema
- Últimas notas fiscais processadas
- Top produtos mais comprados
- Principais fornecedores por valor
- Estatísticas mensais

### 5. **API REST**
Teste diretamente os endpoints:
- **Health check**: http://localhost:3000/health
- **Produtos**: http://localhost:3000/api/produtos
- **Dashboard**: http://localhost:3000/api/dashboard
- **Notas**: http://localhost:3000/api/notas

---

## 🔍 **Verificações e Troubleshooting**

### Verificar Serviços
```bash
# Se usando Docker - verificar containers rodando
docker ps

# Verificar logs em caso de erro
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs postgres

# Testar API diretamente
curl http://localhost:3000/health
```

### Logs do Sistema
```bash
# Logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Logs de um serviço específico
docker-compose -f docker-compose.dev.yml logs backend
```

---

## 📊 **Administração do Banco de Dados**


### Acessar com Adminer
**URL**: http://localhost:8080

**Credenciais:**
- System: **PostgreSQL**
- Server: **postgres** (ou localhost se rodando local)
- Username: **postgres**
- Password: **pharmacy_password**
- Database: **pharmacy_db**

### Acessar Diretamente (PostgreSQL CLI)
```bash
# Se usando Docker
docker exec -it myfarm-postgres-dev psql -U postgres -d pharmacy_db

# Se local
psql -h localhost -p 5432 -U postgres -d pharmacy_db
```

---

## ⚠️ **Possíveis Problemas e Soluções**

### 1. **Porta Ocupada**
```bash
# Se portas estiverem ocupadas, altere no docker-compose.dev.yml:
# - "3001:3000"  # Backend na porta 3001
# - "5174:5173"  # Frontend na porta 5174
# - "5433:5432"  # PostgreSQL na porta 5433
```

### 2. **Demora na Primeira Execução**
- Normal: Docker precisa baixar imagens e fazer build
- Aguarde 3-5 minutos na primeira vez

### 3. **Erro de Conexão com Banco**
```bash
# Aguarde PostgreSQL inicializar completamente
# Verifique logs:
docker-compose -f docker-compose.dev.yml logs postgres

# Restart apenas o backend se necessário:
docker-compose -f docker-compose.dev.yml restart backend
```

### 4. **Frontend Não Carrega**
- Verifique se backend está respondendo: http://localhost:3000/health
- Confirme CORS configurado corretamente
- Veja logs do frontend

---

## 📁 **Arquivos XML para Teste**

### Onde Conseguir
- Use qualquer XML de NFe válido do padrão SEFAZ
- Arquivos de teste de sistemas contábeis
- XMLs reais de notas fiscais de entrada

### Formato Suportado
- **Tamanho**: Até 5MB por arquivo
- **Tipo**: NFe (Nota Fiscal Eletrônica)
- **Múltiplos**: Pode fazer upload de vários simultaneamente

### O Sistema Extrai Automaticamente
- ✅ **Dados do Fornecedor**: Nome, CNPJ, endereço
- ✅ **Produtos**: Código, nome, fabricante, NCM
- ✅ **Valores**: Preços, descontos, quantidades
- ✅ **Nota**: Número, série, data, chave de acesso

---

## 🎯 **Funcionalidades Testáveis**

### ✅ **Processamento XML**
- Upload múltiplos arquivos
- Validação automática
- Extração de dados
- Tratamento de erros
- Feedback visual

### ✅ **Gestão de Produtos**
- Cadastro automático via XML
- Histórico de preços por fornecedor
- Cálculo de preços médios
- Análise de fornecedores

### ✅ **Controle de Estoque**
- Estoque mínimo sugerido
- Quantidade para compra
- Alertas de reposição
- Consumo médio

### ✅ **Relatórios**
- Dashboard executivo
- Estatísticas mensais
- Top produtos/fornecedores
- Análise de preços

---

## 🔧 **Comandos Úteis**

### Docker
```bash
# Parar todos os serviços
docker-compose -f docker-compose.dev.yml down

# Rebuild completo
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Limpar volumes (CUIDADO: apaga dados)
docker-compose -f docker-compose.dev.yml down -v
```

### Desenvolvimento
```bash
# Instalar dependências
cd backend && npm install
cd frontend && npm install

# Executar testes (se disponível)
npm test

# Build para produção
npm run build
```

---

## 📞 **Suporte**

### Em Caso de Problemas
1. ✅ Verificar se todas as portas estão livres
2. ✅ Confirmar Docker funcionando corretamente
3. ✅ Verificar logs dos serviços
4. ✅ Testar health check da API
5. ✅ Confirmar conectividade com PostgreSQL

### Logs Importantes
- **Backend**: Erros de API e processamento XML
- **PostgreSQL**: Conexão e queries do banco
- **Frontend**: Erros de interface e comunicação

---

## 🎉 **O Sistema Está Pronto!**

**O projeto está 100% funcional e pronto para processar XMLs reais de farmácia!**

- 🔥 **Backend completo** com parser XML e API REST
- 🎨 **Frontend moderno** com React e interface intuitiva  
- 🗄️ **PostgreSQL** com schema otimizado
- 🐳 **Docker** para execução simplificada
- 📊 **Dashboard** com métricas e relatórios

**Comece fazendo upload de um XML de NFe e veja a magia acontecer!** ✨

  # Desenvolvimento (mais fácil)
  docker-compose -f docker-compose.dev.yml up --build

  # URLs:
  # Frontend: http://localhost:5173
  # Backend API: http://localhost:3000
  # Adminer: http://localhost:8080
