import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Loading from '../common/Loading';
import ProductFilter from './ProductFilter';
import { usePagination } from '../../hooks/usePagination';
import { useApi } from '../../hooks/useApi';

const ProductTable = ({ onProductSelect }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    fabricante: '',
    orderBy: 'nome',
    orderDirection: 'ASC'
  });

  const {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    setTotalItems
  } = usePagination();

  const api = useApi();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      });
      
      const response = await api.get(`/produtos?${queryParams}`);
      
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalItems(response.data.pagination.total);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    goToPage(1); // Voltar à primeira página ao filtrar
  };

  const handleSort = (field) => {
    const newDirection = filters.orderBy === field && filters.orderDirection === 'ASC' 
      ? 'DESC' 
      : 'ASC';
    
    setFilters(prev => ({
      ...prev,
      orderBy: field,
      orderDirection: newDirection
    }));
  };

  const getSortIcon = (field) => {
    if (filters.orderBy !== field) {
      return (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18,21L14,17H17V7H14L18,3L22,7H19V17H22M2,19V17H12V19M2,13V11H9V13M2,7V5H6V7H2Z" />
        </svg>
      );
    }
    
    return filters.orderDirection === 'ASC' ? (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18,21L14,17H17V3H19V17H22M2,19V17H12V19M2,13V11H9V13M2,7V5H6V7H2Z" />
      </svg>
    ) : (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18,3L22,7H19V21H17V7H14M2,17H12V19H2M9,11V13H2V11M6,5V7H2V5H6Z" />
      </svg>
    );
  };

  const getEstoqueStatus = (produto) => {
    if (produto.estoque_atual <= 0) return 'sem-estoque';
    if (produto.estoque_atual <= produto.estoque_minimo) return 'estoque-baixo';
    if (produto.estoque_atual <= produto.estoque_minimo * 1.5) return 'estoque-atencao';
    return 'estoque-ok';
  };

  const getEstoqueStatusText = (status) => {
    switch (status) {
      case 'sem-estoque': return 'Sem Estoque';
      case 'estoque-baixo': return 'Estoque Baixo';
      case 'estoque-atencao': return 'Atenção';
      case 'estoque-ok': return 'OK';
      default: return '-';
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="product-table">
      {/* Filtros */}
      <ProductFilter 
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={() => handleFilterChange({ search: '', fabricante: '' })}
      />

      {error && (
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
          <button 
            className="btn-secondary btn-sm" 
            onClick={fetchProducts}
            style={{ marginLeft: '10px' }}
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th 
                className="sortable" 
                onClick={() => handleSort('nome')}
              >
                Nome do Produto {getSortIcon('nome')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('fabricante')}
              >
                Fabricante {getSortIcon('fabricante')}
              </th>
              <th>Código</th>
              <th 
                className="sortable" 
                onClick={() => handleSort('menor_preco')}
              >
                Menor Preço {getSortIcon('menor_preco')}
              </th>
              <th>Preço Médio</th>
              <th>Estoque Atual</th>
              <th>Estoque Mínimo</th>
              <th>Sugestão Compra</th>
              <th 
                className="sortable" 
                onClick={() => handleSort('ultima_compra')}
              >
                Última Compra {getSortIcon('ultima_compra')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              products.map(product => {
                const estoqueStatus = getEstoqueStatus(product);
                return (
                  <tr 
                    key={product.id} 
                    className={`product-row ${estoqueStatus}`}
                  >
                    <td className="product-name">
                      <div>
                        <strong>{product.nome}</strong>
                        {product.codigo_barras && (
                          <small>EAN: {product.codigo_barras}</small>
                        )}
                      </div>
                    </td>
                    <td>{product.fabricante || '-'}</td>
                    <td>
                      <code>{product.codigo || '-'}</code>
                    </td>
                    <td className="price">
                      {product.menor_preco 
                        ? formatCurrency(product.menor_preco) 
                        : '-'
                      }
                    </td>
                    <td className="price">
                      {product.preco_medio 
                        ? formatCurrency(product.preco_medio) 
                        : '-'
                      }
                    </td>
                    <td className="stock">
                      <span className={`stock-badge ${estoqueStatus}`}>
                        {product.estoque_atual || 0} {product.unidade}
                      </span>
                    </td>
                    <td className="stock-min">
                      {product.estoque_minimo || 0} {product.unidade}
                    </td>
                    <td className="suggestion">
                      {product.quantidade_sugerida > 0 ? (
                        <span className="suggestion-badge">
                          {product.quantidade_sugerida} {product.unidade}
                        </span>
                      ) : (
                        <span className="no-suggestion">-</span>
                      )}
                    </td>
                    <td className="last-purchase">
                      {product.ultima_compra 
                        ? formatDate(product.ultima_compra) 
                        : 'Nunca'
                      }
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => onProductSelect && onProductSelect(product)}
                        title="Ver detalhes"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} produtos
          </div>
          
          <div className="pagination-controls">
            <button 
              className="btn-secondary btn-sm"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`btn-page ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="btn-secondary btn-sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
