import React from 'react';

const Reports = ({ type }) => {
  const getTitle = () => {
    switch(type) {
      case 'compras': return 'Histórico de Compras';
      default: return 'Relatórios';
    }
  };

  const getDescription = () => {
    switch(type) {
      case 'compras': return 'Analise o histórico de compras e preços dos fornecedores';
      default: return 'Relatórios do sistema';
    }
  };

  return (
    <div className="reports-page">
      <div className="dashboard-header">
        <h1>{getTitle()}</h1>
        <p>{getDescription()}</p>
      </div>

      <div className="page-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Filtros</h2>
          </div>
          <div className="filters-row">
            <input type="date" placeholder="Data inicial" />
            <input type="date" placeholder="Data final" />
            <select>
              <option>Todos os fornecedores</option>
            </select>
            <button className="btn-primary">Gerar Relatório</button>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Resultados</h2>
          </div>
          <div className="no-data">
            Configure os filtros e clique em "Gerar Relatório"
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;