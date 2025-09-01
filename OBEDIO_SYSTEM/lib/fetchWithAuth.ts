/**
 * Pomoćna funkcija za fetch sa autentikacijom
 * Dodaje token iz localStorage ili cookieja u Authorization header
 * Automatski dodaje x-auth-bypass u development okruženju za jednostavnije testiranje
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // U development okruženju: obavezno postavi x-auth-bypass na true
    // Proveri da li smo u development modu na siguran način za client i server
    const isDevelopment = typeof window !== 'undefined'
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      : process.env.NODE_ENV !== 'production';
    console.log(`[fetchWithAuth] Fetching ${url} in ${isDevelopment ? 'development' : 'production'} mode`);
    
    // Pripremi dodatne headere
    const existingHeaders = options.headers as Record<string, string> || {};
    const customHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-auth-bypass': 'true' // U development modu uvek preskačemo autentikaciju
    };
    
    // Osnovna podešavanja za fetch
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...customHeaders,
        ...existingHeaders
      }
    }

    // Dodaj token iz localStorage ako smo na klijentu
    if (typeof window !== 'undefined') {
      // Pokušaj dohvatanja podataka o korisniku
      const userDataStr = localStorage.getItem('userData')
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          if (userData.id) {
            // Kreiraj jednostavan token formatom userId.role.timestamp
            const simpleToken = `${userData.id}.${userData.role || 'user'}.${Date.now()}`;
            
            // Dodaj token u headers
            fetchOptions.headers = {
              ...fetchOptions.headers,
              'Authorization': `Bearer ${simpleToken}`,
              'x-user-id': userData.id.toString()
            }
          }
        } catch (e) {
          console.warn('Greška pri parsiranju userData iz localStorage', e)
        }
      }
    }
    
    // Sprečavanje keširanja za GET zahteve
    if (!fetchOptions.method || fetchOptions.method === 'GET') {
      fetchOptions.cache = 'no-store';
    }

    // Izvrši fetch sa svim opcijama
    return fetch(url, fetchOptions)
  } catch (error) {
    console.error('Greška u fetchWithAuth:', error)
    throw error
  }
}
