import { useEffect, useState } from 'react'

/**
 * useDebounce - Retarde la mise à jour d'une valeur
 * 
 * Utile pour les recherches et filtres pour éviter
 * de faire trop de requêtes API pendant la frappe.
 * 
 * @param value - La valeur à debounce
 * @param delay - Le délai en ms (défaut: 300ms)
 * @returns La valeur debouncée
 * 
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * 
 * useEffect(() => {
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

export default useDebounce
