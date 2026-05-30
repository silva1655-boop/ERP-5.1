import { useEffect, useState } from 'react';
import { subscribeCollection } from '../services/firestoreService';
import { useAuth } from './useAuth';
import { handleError } from '../utils/errorHandler';

export function useFirestoreCollection(collectionName, options = {}) {
  const { companyId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyId) {
      setData([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = subscribeCollection(companyId, collectionName, items => {
      setData(items);
      setLoading(false);
    }, options);
    return () => unsubscribe();
  }, [companyId, collectionName, JSON.stringify(options)]);

  useEffect(() => () => setError(''), []);

  return { data, loading, error, setError: err => setError(handleError(err)) };
}
