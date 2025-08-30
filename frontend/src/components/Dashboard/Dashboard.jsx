import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import Loading from '../common/Loading';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/dashboard');
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
          <button 
            className="btn-secondary btn-sm" 
            onClick={fetchDashboardData}
            style={{ marginLeft: '10px' }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { resumo, ultimas_notas, top_produtos, top_fornecedores, estatisticas_mensais } = dashboardData;

  return (
    <div className="dashboard">
      {/* Resumo Geral */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema de farmácia</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <StatsCard
          title="Total de Produtos"
          value={resumo.total_produtos}
          icon="package"
          color="blue"
        />
        <StatsCard
          title="Fornecedores Ativos"
          value={resumo.total_fornecedores}
          icon="suppliers"
          color="green"
        />
        <StatsCard
          title="Notas Processadas"
          value={resumo.total_notas}
          icon="document"
          color="purple"
        />
        <StatsCard
          title="Valor Total Compras"
          value={formatCurrency(resumo.valor_total_compras)}
          icon="money"
          color="orange"
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="dashboard-content">
        {/* Coluna Esquerda */}
        <div className="dashboard-left">
          {/* Últimas Notas */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Últimas Notas Fiscais</h2>
              <a href="/notas" className="view-all-link">Ver todas</a>
            </div>
            
            <div className="recent-notes">
              {ultimas_notas.length === 0 ? (
                <p className="no-data">Nenhuma nota processada ainda</p>
              ) : (
                <div className="notes-list">
                  {ultimas_notas.map((nota, index) => (
                    <div key={index} className="note-item">
                      <div className="note-info">
                        <div className="note-number">
                          Nota #{nota.numero}
                        </div>
                        <div className="note-details">
                          <span className="supplier">{nota.fornecedor}</span>
                          <span className="date">{formatDate(nota.data_emissao)}</span>
                        </div>
                      </div>
                      <div className="note-stats">
                        <div className="note-value">
                          {formatCurrency(nota.valor_total)}
                        </div>
                        <div className="note-items">
                          {nota.total_itens} item(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Produtos */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Produtos Mais Comprados</h2>
              <a href="/produtos" className="view-all-link">Ver todos</a>
            </div>
            
            <div className="top-products">
              {top_produtos.length === 0 ? (
                <p className="no-data">Nenhum produto encontrado</p>
              ) : (
                <div className="products-list">
                  {top_produtos.map((produto, index) => (
                    <div key={index} className="product-item">
                      <div className="product-rank">#{index + 1}</div>
                      <div className="product-info">
                        <div className="product-name">{produto.nome}</div>
                        <div className="product-details">
                          <span className="manufacturer">{produto.fabricante}</span>
                          <span className="quantity">Qtd: {produto.quantidade_total}</span>
                        </div>
                      </div>
                      <div className="product-stats">
                        <div className="avg-price">
                          {formatCurrency(produto.preco_medio)}
                        </div>
                        <div className="notes-count">
                          {produto.total_notas} nota(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="dashboard-right">
          {/* Top Fornecedores */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Principais Fornecedores</h2>
            </div>
            
            <div className="top-suppliers">
              {top_fornecedores.length === 0 ? (
                <p className="no-data">Nenhum fornecedor encontrado</p>
              ) : (
                <div className="suppliers-list">
                  {top_fornecedores.map((fornecedor, index) => (
                    <div key={index} className="supplier-item">
                      <div className="supplier-rank">#{index + 1}</div>
                      <div className="supplier-info">
                        <div className="supplier-name">{fornecedor.nome}</div>
                        <div className="supplier-cnpj">{fornecedor.cnpj}</div>
                        <div className="supplier-stats">
                          <span>{fornecedor.total_notas} nota(s)</span>
                          <span className="last-purchase">
                            Últ: {formatDate(fornecedor.ultima_compra)}
                          </span>
                        </div>
                      </div>
                      <div className="supplier-value">
                        {formatCurrency(fornecedor.valor_total)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas Mensais */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Estatísticas Mensais</h2>
            </div>
            
            <div className="monthly-stats">
              {estatisticas_mensais.length === 0 ? (
                <p className="no-data">Sem dados mensais disponíveis</p>
              ) : (
                <div className="stats-list">
                  {estatisticas_mensais.map((stat, index) => {
                    const [ano, mes] = stat.mes.split('-');
                    const nomesMeses = [
                      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                    ];
                    const mesNome = nomesMeses[parseInt(mes) - 1];
                    
                    return (
                      <div key={index} className="month-stat">
                        <div className="month-name">
                          {mesNome} {ano}
                        </div>
                        <div className="month-data">
                          <div className="stat-row">
                            <span>Notas:</span>
                            <strong>{stat.total_notas}</strong>
                          </div>
                          <div className="stat-row">
                            <span>Valor:</span>
                            <strong>{formatCurrency(stat.valor_total)}</strong>
                          </div>
                          <div className="stat-row">
                            <span>Média:</span>
                            <strong>{formatCurrency(stat.valor_medio)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="dashboard-actions">
        <div className="actions-section">
          <h3>Ações Rápidas</h3>
          <div className="action-buttons">
            <a href="/upload" className="action-btn primary">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Upload XML
            </a>
            <a href="/produtos" className="action-btn secondary">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A3,3 0 0,1 15,5V7H20A1,1 0 0,1 21,8V19A3,3 0 0,1 18,22H6A3,3 0 0,1 3,19V8A1,1 0 0,1 4,7H9V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7H13V5A1,1 0 0,0 12,4Z" />
              </svg>
              Ver Produtos
            </a>
            <a href="/relatorios" className="action-btn secondary">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z" />
              </svg>
              Relatórios
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
