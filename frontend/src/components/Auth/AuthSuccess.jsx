import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthSuccess = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Salvar token no localStorage
      localStorage.setItem('authToken', token);
      
      // Decodificar informações do usuário do token (JWT)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userData = {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          photo: payload.photo
        };
        
        onLogin(userData);
        // Recarregar a página para garantir que a autenticação seja reconhecida
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Erro ao processar token:', error);
        navigate('/login?error=invalid_token');
      }
    } else {
      navigate('/login?error=no_token');
    }
  }, [searchParams, onLogin, navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="loading">
          Processando login...
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;