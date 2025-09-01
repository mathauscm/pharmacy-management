import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const Suppliers = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const api = useApi();

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const data = await api.get(`/fornecedores?${params}`);
      
      if (data.success) {
        setFornecedores(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, [searchTerm]);

  return (
    <div className="suppliers-page">
      <div className="dashboard-header">
        <h1>Fornecedores</h1>
        <p>Gerencie informações dos fornecedores</p>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Total de Fornecedores</h3>
            <div className="value">{fornecedores.length}</div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Lista de Fornecedores</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="loading">Carregando fornecedores...</div>
          ) : (
            <div className="suppliers-table">
              {fornecedores.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>CNPJ</th>
                      <th>Nome</th>
                      <th>Nome Fantasia</th>
                      <th>Total Notas</th>
                      <th>Valor Total</th>
                      <th>Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedores.map((fornecedor) => (
                      <tr key={fornecedor.id}>
                        <td>{fornecedor.cnpj}</td>
                        <td>{fornecedor.nome}</td>
                        <td>{fornecedor.nome_fantasia || 'N/A'}</td>
                        <td>{fornecedor.total_notas}</td>
                        <td>R$ {fornecedor.valor_total_compras ? parseFloat(fornecedor.valor_total_compras).toFixed(2) : '0.00'}</td>
                        <td>{fornecedor.ultima_compra ? new Date(fornecedor.ultima_compra).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado ainda'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;