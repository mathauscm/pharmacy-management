import { useState, useMemo } from 'react';

/**
 * Hook para gerenciar paginação de dados
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);

  // Cálculos derivados
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage);
  }, [totalItems, itemsPerPage]);

  const offset = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Funções de navegação
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const changeItemsPerPage = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Voltar para primeira página
  };

  const reset = () => {
    setCurrentPage(1);
    setTotalItems(0);
  };

  return {
    // Estado
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    offset,
    
    // Flags
    hasNextPage,
    hasPrevPage,
    
    // Ações
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    setTotalItems,
    reset
  };
}

/**
 * Hook para paginação local (para arrays de dados)
 */
export function useLocalPagination(items = [], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(items.length / pageSize);
  }, [items.length, pageSize]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Reset quando items mudar
  useState(() => {
    setCurrentPage(1);
  }, [items]);

  return {
    currentData: paginatedData,
    currentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage
  };
}
