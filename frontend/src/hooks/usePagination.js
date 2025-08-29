import { useState } from 'react';
export function usePagination(items, pageSize) {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(items.length / pageSize);
  const currentData = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return { currentData, currentPage, maxPage, setCurrentPage };
}
