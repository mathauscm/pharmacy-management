import React, { useState, useEffect } from 'react';

const Notes = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fornecedor: '',
    dataInicio: '',
    dataFim: ''
  });

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.fornecedor) params.append('fornecedor', filters.fornecedor);
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
      if (filters.dataFim) params.append('dataFim', filters.dataFim);
      
      const response = await fetch(`/api/notas?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setNotas(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchNotas();
  };

  return (
    <div className="notes-page">
      <div className="dashboard-header">
        <h1>Notas Fiscais</h1>
        <p>Visualize e gerencie as notas fiscais processadas</p>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Total de Notas</h3>
            <div className="value">{notas.length}</div>
          </div>
          <div className="stats-card">
            <h3>Valor Total</h3>
            <div className="value">
              R$ {notas.reduce((sum, nota) => sum + parseFloat(nota.valor_total || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Notas Fiscais</h2>
            <div className="filters">
              <input 
                type="text" 
                placeholder="Buscar fornecedor..." 
                value={filters.fornecedor}
                onChange={(e) => handleFilterChange('fornecedor', e.target.value)}
              />
              <input 
                type="date" 
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              />
              <input 
                type="date" 
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              />
              <button className="btn-secondary" onClick={applyFilters}>Filtrar</button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">Carregando notas fiscais...</div>
          ) : (
            <div className="notes-table">
              {notas.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Série</th>
                      <th>Data Emissão</th>
                      <th>Fornecedor</th>
                      <th>CNPJ</th>
                      <th>Total Itens</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((nota) => (
                      <tr key={nota.id}>
                        <td>{nota.numero}</td>
                        <td>{nota.serie}</td>
                        <td>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</td>
                        <td>{nota.fornecedor_nome}</td>
                        <td>{nota.fornecedor_cnpj}</td>
                        <td>{nota.total_itens}</td>
                        <td>R$ {parseFloat(nota.valor_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  {filters.fornecedor || filters.dataInicio || filters.dataFim 
                    ? 'Nenhuma nota encontrada com os filtros aplicados' 
                    : 'Nenhuma nota fiscal processada ainda'
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;