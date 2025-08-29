import { useState, useEffect } from 'react';
export function useApi(endpoint) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(endpoint)
      .then(res => res.json())
      .then(setData);
  }, [endpoint]);
  return data;
}
