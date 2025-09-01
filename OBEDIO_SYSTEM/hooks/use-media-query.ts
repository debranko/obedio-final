import { useState, useEffect } from 'react'

/**
 * Hook za praćenje media query-ja
 * 
 * @param query Media query string, npr. "(min-width: 768px)"
 * @returns Boolean koji označava da li trenutni ekran odgovara query-ju
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Inicijalno postavljanje vrednosti
    setMatches(media.matches)
    
    // Listener za promene veličine ekrana
    const listener = () => {
      setMatches(media.matches)
    }
    
    // Dodaj event listener
    media.addEventListener('change', listener)
    
    // Cleanup kada se komponenta unmountuje
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}
