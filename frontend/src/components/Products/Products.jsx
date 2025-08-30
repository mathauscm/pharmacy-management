import React, { useState, useEffect } from 'react';

const Products = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage] = useState(20);

  const fetchProdutos = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/produtos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProdutos(data.data);
        setTotalPages(data.pagination.pages);
        setTotalProducts(data.pagination.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`/api/produtos/${productId}/consulta`);
      const data = await response.json();
      
      if (data.success) {
        setProductDetails(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error);
    }
  };

  useEffect(() => {
    fetchProdutos(1);
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchProdutos(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar se não temos páginas suficientes no final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          «
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ‹
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          ›
        </button>
        <button 
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          »
        </button>
        
        <span className="pagination-info">
          Página {currentPage} de {totalPages} ({totalProducts} produtos)
        </span>
      </div>
    );
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    await fetchProductDetails(product.id);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setProductDetails(null);
  };

  return (
    <div className="products-page">
      <div className="dashboard-header">
        <h1>Produtos</h1>
        <p>Consulta de histórico de compras</p>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Total de Produtos</h3>
            <div className="value">{totalProducts}</div>
          </div>
          <div className="stats-card">
            <h3>Produtos na Página</h3>
            <div className="value">{produtos.length}</div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Lista de Produtos</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="loading">Carregando produtos...</div>
          ) : (
            <div className="products-table">
              {produtos.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Fabricante</th>
                      <th>Última Compra</th>
                      <th>Menor Preço</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => (
                      <tr key={produto.id}>
                        <td>{produto.codigo}</td>
                        <td>{produto.nome}</td>
                        <td>{produto.fabricante || 'N/A'}</td>
                        <td>{produto.ultima_compra ? new Date(produto.ultima_compra).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td>R$ {produto.menor_preco}</td>
                        <td>
                          <button 
                            className="btn-secondary"
                            onClick={() => handleProductClick(produto)}
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
                </div>
              )}
            </div>
          )}
          
          {!loading && renderPagination()}
        </div>
      </div>

      {selectedProduct && productDetails && (
        <div className="modal-overlay" onClick={closeProductDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Consulta de Produto</h2>
              <button className="close-btn" onClick={closeProductDetails}>×</button>
            </div>
            
            <div className="product-details">
              <div className="detail-section">
                <h3>Produto: {productDetails.produto}</h3>
                <p><strong>Código:</strong> {productDetails.codigo}</p>
              </div>

              <div className="detail-section">
                <h4>Laboratórios:</h4>
                <div className="list-items">
                  {productDetails.laboratorios.length > 0 
                    ? productDetails.laboratorios.join(', ')
                    : 'Não informado'
                  }
                </div>
              </div>

              <div className="detail-section">
                <h4>Fornecedores:</h4>
                <div className="list-items">
                  {productDetails.fornecedores.length > 0 
                    ? productDetails.fornecedores.join(', ')
                    : 'Nenhum fornecedor encontrado'
                  }
                </div>
              </div>

              {productDetails.ultimo_preco && (
                <div className="detail-section">
                  <h4>Último Preço:</h4>
                  <p>
                    R$ {productDetails.ultimo_preco.valor} 
                    <span className="supplier"> (Fornecedor: {productDetails.ultimo_preco.fornecedor})</span>
                  </p>
                </div>
              )}

              <div className="detail-section">
                <h4>Melhores Preços:</h4>
                <div className="prices-list">
                  {productDetails.melhores_precos.length > 0 ? (
                    productDetails.melhores_precos.map((item, index) => (
                      <div key={index} className="price-item">
                        R$ {item.preco} - {item.fabricante}
                      </div>
                    ))
                  ) : (
                    <p>Nenhum preço encontrado</p>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Pedido Médio:</h4>
                <p>{productDetails.pedido_medio_mensal} unidades/mês</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;