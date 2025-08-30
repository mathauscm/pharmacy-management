import React, { useState } from 'react';

const ProductFilter = ({ filters, onFilterChange, onClear }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      fabricante: '',
      orderBy: 'nome',
      orderDirection: 'ASC'
    };
    setLocalFilters(clearedFilters);
    onClear();
  };

  return (
    <div className="product-filter">
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="search">Buscar Produto:</label>
          <input
            id="search"
            type="text"
            placeholder="Nome, código ou código de barras..."
            value={localFilters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fabricante">Fabricante:</label>
          <input
            id="fabricante"
            type="text"
            placeholder="Nome do fabricante..."
            value={localFilters.fabricante || ''}
            onChange={(e) => handleInputChange('fabricante', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-actions">
          <button 
            type="button"
            className="btn-secondary"
            onClick={handleClear}
            title="Limpar filtros"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
