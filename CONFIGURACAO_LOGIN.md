# Configuração do Sistema de Login myFarm

Sistema de autenticação implementado com Google OAuth 2.0, restrito aos emails autorizados.

## ✅ Implementado

### Backend
- ✅ Google OAuth 2.0 com Passport.js
- ✅ Middleware de autenticação JWT
- ✅ Proteção de todas as rotas da API
- ✅ Restrição aos 4 emails autorizados:
  - mathauscarvalho@gmail.com
  - bebe.qc@gmail.com
  - farmaciapopularubj@gmail.com
  - maressacarvalho10@gmail.com

### Frontend
- ✅ Tela de login com logo myFarm
- ✅ Integração com Google OAuth
- ✅ Proteção de todas as rotas
- ✅ Header com informações do usuário
- ✅ Sistema de logout
- ✅ Redirecionamento automático

## 🔧 Configuração Necessária

### 1. Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API" ou "Google Identity API"
4. Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth 2.0"
5. Configure:
   - **Tipo**: Aplicação da Web
   - **URLs de redirecionamento autorizadas**:
     - `http://localhost:3000/api/auth/google/callback` (desenvolvimento)
     - `https://seudominio.com/api/auth/google/callback` (produção)

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp backend/.env.example backend/.env
```

Edite o arquivo `.env`:

```env
# Google OAuth (obrigatório)
GOOGLE_CLIENT_ID=seu_client_id_do_google_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Segurança (recomendado alterar em produção)
JWT_SECRET=myfarm-jwt-secret-super-secreto-aqui
SESSION_SECRET=myfarm-session-secret-super-secreto-aqui

# URLs
FRONTEND_URL=http://localhost:5173
```

### 3. Adicionar Logo myFarm

Coloque a logo em: `frontend/public/assets/logo-myfarm.png`

### 4. Reiniciar Aplicação

```bash
docker-compose restart backend frontend
```

## 🚀 Como Usar

1. Acesse `http://localhost:5173`
2. Será redirecionado para tela de login automaticamente
3. Clique em "Entrar com Google"
4. Autorize com uma das contas permitidas
5. Será redirecionado para o dashboard

## 🔒 Segurança

- **Emails restritos**: Apenas os 4 emails configurados podem acessar
- **JWT Tokens**: Tokens seguros com expiração de 7 dias
- **Sessões seguras**: Configuradas para produção com HTTPS
- **Cookies httpOnly**: Tokens protegidos contra XSS

## 🌍 Deploy em Produção

### 1. Configurar URLs de produção no Google OAuth
### 2. Atualizar variáveis de ambiente:
```env
NODE_ENV=production
CORS_ORIGIN=https://seudominio.com
FRONTEND_URL=https://seudominio.com
GOOGLE_CALLBACK_URL=https://seudominio.com/api/auth/google/callback
```

### 3. Usar HTTPS obrigatório

## 📝 Emails Autorizados

Para alterar os emails autorizados, edite:
- `backend/src/config/passport.js` (linha 7)
- `backend/src/middleware/auth.js` (linha 44)

## 🔍 Testando

1. **Verificar autenticação**: `GET /api/auth/me`
2. **Testar email autorizado**: `GET /api/auth/check-email/email@teste.com`
3. **Logout**: `POST /api/auth/logout`

## ⚠️ Importante

- Configure as credenciais do Google ANTES de usar
- Mantenha os secrets seguros em produção
- A logo precisa estar em `frontend/public/assets/logo-myfarm.png`
- Todos os dados do banco são preservados no deploy