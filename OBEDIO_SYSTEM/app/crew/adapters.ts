// Adapters za mapiranje između API response i frontend modela

export interface ApiCrewMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  onDuty: boolean;
  currentShift?: {
    startTime: string;
    endTime: string;
    hoursLeft: number;
  } | null;
  assignedSmartwatchUid?: string | null;
  updatedAt: string;
  avatar?: string;
}

export interface CrewMember {
  _id: string;
  name: string;
  position: string;
  team: string;
  department?: string | null;
  status: 'on_duty' | 'off_duty';
  languages: string[];
  responsibilities?: string[];
  responsibility?: string; // Zone of responsibility (text field)
  experience?: string;
  emergency_contact?: {
    name: string;
    phone: string;
  };
  avatar: string | null; // Koristi se za JSON podatke
  avatarUrl?: string | null; // URL slike profila
}

// Adapter za konverziju API response-a u format koji očekuje frontend
export function apiToUiAdapter(apiCrew: ApiCrewMember): CrewMember {
  // Pokušaj dohvatiti dodatne podatke iz avatar polja (ako postoje)
  let languages: string[] = [];
  let responsibility: string = '';
  let emergency_contact = { name: '', phone: '' };
  let avatarUrl: string | null = null;
  
  // Pokušaj parsirati JSON iz avatar polja
  if (apiCrew.avatar) {
    try {
      const additionalData = JSON.parse(apiCrew.avatar);
      // Provjera je li rezultat objekt koji sadrži naše dodatne podatke
      if (additionalData && typeof additionalData === 'object') {
        if (Array.isArray(additionalData.languages)) {
          languages = additionalData.languages;
        }
        if (typeof additionalData.responsibility === 'string') {
          responsibility = additionalData.responsibility;
        }
        if (additionalData.emergency_contact && typeof additionalData.emergency_contact === 'object') {
          emergency_contact = additionalData.emergency_contact;
        }
        // Provjera postoji li avatarUrl u dodatnim podacima
        if (typeof additionalData.avatarUrl === 'string') {
          avatarUrl = additionalData.avatarUrl;
        }
      }
    } catch (error) {
      // Ako se JSON parsing ne uspije, pretpostavljamo da je avatar samo string URL
      console.warn('Avatar field nije u JSON formatu, koristi se kao URL slike:', apiCrew.avatar);
      avatarUrl = apiCrew.avatar; // Koristi vrijednost kao URL ako nije JSON
    }
  }
  
  return {
    _id: apiCrew.id.toString(),
    name: apiCrew.name,
    position: apiCrew.role,
    team: apiCrew.department || "",
    department: apiCrew.department,
    status: apiCrew.onDuty ? 'on_duty' : 'off_duty',
    languages: languages,
    responsibilities: responsibility ? [responsibility] : [],
    responsibility: responsibility,
    experience: "", // Za sada prazan string
    emergency_contact: emergency_contact,
    avatar: apiCrew.avatar, // Zadržavamo originalni avatar (možda sadrži JSON ili URL)
    avatarUrl: avatarUrl || null // Dodajemo novo polje za URL slike i osiguravamo da je string | null
  };
}
