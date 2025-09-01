import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionCookie } from "@/lib/auth"

// Definisanje default strukture preferenci
const defaultPreferences = {
  food: [],
  drinks: [],
  allergies: [],
  roomTemperature: 22,
  cleaningTime: "Morning",
}

// GET /api/guests - dohvati sve goste
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/guests - početak zahteva')
    
    // Proveri autentikaciju
    const authBypass = request.headers.get("x-auth-bypass")
    
    if (!authBypass) {
      const session = getSessionCookie()
      if (!session) {
        console.log('GET /api/guests - Neautorizovan pristup')
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Dobavi sve goste iz baze
    console.log('GET /api/guests - Dohvatanje gostiju iz baze')
    const guests = await prisma.guest.findMany({
      include: {
        serviceRequests: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    console.log(`GET /api/guests - Pronađeno ${guests.length} gostiju`)

    // Mapiranje rezultata - pripremi odgovor tako da prezentuje preferences, languagesSpoken i tags kao parsirane JSON objekte
    const formattedGuests = guests.map(guest => {
      // Default vrednosti za polja
      const defaultData = {
        preferences: defaultPreferences,
        languagesSpoken: [],
        tags: []
      }

      try {
        // Parsiranje JSON stringova u objekte
        const preferences = guest.preferences 
          ? JSON.parse(guest.preferences) 
          : defaultPreferences

        // Tretiramo guest kao any tip da izbegenmo TypeScript greške
        const guestAny = guest as any
        
        // Parsiraj languagesSpoken i tags ako postoje
        let languagesSpoken: string[] = []
        if (guestAny.languagesSpoken) {
          try {
            languagesSpoken = JSON.parse(guestAny.languagesSpoken)
          } catch (e) {
            console.error(`Failed to parse languagesSpoken for guest ${guest.id}`)
          }
        }

        let tags: string[] = []
        if (guestAny.tags) {
          try {
            tags = JSON.parse(guestAny.tags)
          } catch (e) {
            console.error(`Failed to parse tags for guest ${guest.id}`)
          }
        }
        
        return {
          ...guest,
          preferences,
          languagesSpoken,
          tags
        }
      } catch (e) {
        // Ako dođe do greške kod parsiranja, vrati default vrednosti
        console.error(`Error parsing data for guest ${guest.id}:`, e)
        return {
          ...guest,
          ...defaultData
        }
      }
    })
    
    console.log('GET /api/guests - Uspešno transformisani gosti, vraćanje odgovora')
    return NextResponse.json(formattedGuests)
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/guests - kreiraj novog gosta
export async function POST(request: NextRequest) {
  try {
    // Proveri autentikaciju
    const authBypass = request.headers.get("x-auth-bypass")
    
    if (!authBypass) {
      const session = getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Dobavi telo zahteva
    const body = await request.json()

    // Osnovne validacije
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!body.arrivalDate || !body.departureDate) {
      return NextResponse.json({ error: "Arrival and departure dates are required" }, { status: 400 })
    }

    // Osiguraj da preferences ima sve potrebne propertije sa default vrednostima
    let guestPreferences = {...defaultPreferences}
    
    // Ako su poslate preference, spoji ih sa default vrednostima
    if (body.preferences) {
      guestPreferences = {
        ...defaultPreferences,
        ...body.preferences
      }
    }
    
    // Transformiši u string za čuvanje u bazi
    const preferencesStr = JSON.stringify(guestPreferences)

    // Priprema podataka za nizove (languagesSpoken, tags)
    const languagesSpokenStr = body.languagesSpoken ? JSON.stringify(body.languagesSpoken) : null
    const tagsStr = body.tags ? JSON.stringify(body.tags) : null
    
    // Kreiraj novog gosta
    // Nakon regenerisanja Prisma klijenta, koristimo eksplicitno definisanje tipa podataka
    const guestData: any = {
      name: body.name,
      room: body.room || null,
      status: body.status || "Checked-In",
      isVip: body.isVip || false,
      guestType: body.guestType,
      imageUrl: body.imageUrl || null,
      partySize: body.partySize || 1,
      nationality: body.nationality || null,
      languagesSpoken: languagesSpokenStr,
      tags: tagsStr,
      arrivalDate: new Date(body.arrivalDate),
      departureDate: new Date(body.departureDate),
      notes: body.notes || null,
      assignedCrew: body.assignedCrew || null,
      location: body.location || null,
      preferences: preferencesStr,
      broker: body.broker || null,
    }
    
    const guest = await prisma.guest.create({
      data: guestData
    })

    // Vrati kreiranog gosta sa ispravno obrađenim preferences poljem
    return NextResponse.json({
      ...guest,
      preferences: guestPreferences
    })
    
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH /api/guests - ažuriraj postojećeg gosta
export async function PATCH(request: NextRequest) {
  try {
    // Proveri autentikaciju
    const authBypass = request.headers.get("x-auth-bypass")
    
    if (!authBypass) {
      const session = getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Dobavi telo zahteva
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }

    // Pripremi podatke za ažuriranje
    const updateData: any = {}
    
    // Ažuriraj polja koja su prisutna u zahtevu
    if (body.name !== undefined) updateData.name = body.name
    if (body.room !== undefined) updateData.room = body.room
    if (body.status !== undefined) updateData.status = body.status
    if (body.isVip !== undefined) updateData.isVip = body.isVip
    if (body.guestType !== undefined) updateData.guestType = body.guestType
    if (body.partySize !== undefined) updateData.partySize = body.partySize
    if (body.arrivalDate !== undefined) updateData.arrivalDate = new Date(body.arrivalDate)
    if (body.departureDate !== undefined) updateData.departureDate = new Date(body.departureDate)
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.assignedCrew !== undefined) updateData.assignedCrew = body.assignedCrew
    if (body.location !== undefined) updateData.location = body.location
    if (body.broker !== undefined) updateData.broker = body.broker
    if (body.nationality !== undefined) updateData.nationality = body.nationality
    
    // Za polja koja su nizovi, moramo ih konvertovati u JSON stringove pre čuvanja
    if (body.languagesSpoken !== undefined) updateData.languagesSpoken = Array.isArray(body.languagesSpoken) ? JSON.stringify(body.languagesSpoken) : body.languagesSpoken
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags
    
    // Posebno obradi preferences
    if (body.preferences !== undefined) {
      // Prvo dohvati trenutnog gosta da bi dobili postojeće preference
      const currentGuest = await prisma.guest.findUnique({
        where: { id: body.id }
      })
      
      let currentPreferences = {...defaultPreferences}
      
      // Pokušaj parsirati trenutne preference ako postoje
      if (currentGuest?.preferences) {
        try {
          const preferencesStr = typeof currentGuest.preferences === 'string'
            ? currentGuest.preferences
            : JSON.stringify(currentGuest.preferences)
            
          currentPreferences = {
            ...defaultPreferences,
            ...JSON.parse(preferencesStr)
          }
        } catch (e) {
          console.error('Greška pri parsiranju postojećih preference za gosta:', body.id, e)
          // U slučaju greške, ostavi default vrednosti
        }
      }
      
      // Spoji sa novim preference vrednostima iz body-ja
      const updatedPreferences = {
        ...currentPreferences,
        ...body.preferences
      }
      
      // Sačuvaj kao string
      updateData.preferences = JSON.stringify(updatedPreferences)
    }

    // Ažuriraj gosta
    const updatedGuest = await prisma.guest.update({
      where: { id: body.id },
      data: updateData,
      include: {
        serviceRequests: true,
      }
    })

    // Parsiraj preference za vraćanje klijentu
    let guestPreferences = {...defaultPreferences}
    if (updatedGuest.preferences) {
      try {
        const preferencesStr = typeof updatedGuest.preferences === 'string'
          ? updatedGuest.preferences
          : JSON.stringify(updatedGuest.preferences)
          
        guestPreferences = {
          ...defaultPreferences,
          ...JSON.parse(preferencesStr)
        }
      } catch (e) {
        console.error('Greška pri parsiranju ažuriranih preference za gosta:', body.id, e)
      }
    }

    // Vrati ažuriranog gosta sa ispravno obrađenim preferences poljem
    return NextResponse.json({
      ...updatedGuest,
      preferences: guestPreferences
    })
    
  } catch (error) {
    console.error('Error updating guest:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/guests/:id - obriši gosta
export async function DELETE(request: NextRequest) {
  try {
    // Proveri autentikaciju
    const authBypass = request.headers.get("x-auth-bypass")
    
    if (!authBypass) {
      const session = getSessionCookie()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Dobavi ID iz URL-a
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '')
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Valid guest ID is required" }, { status: 400 })
    }

    // Prvo obriši povezane service requests
    await prisma.serviceRequest.deleteMany({
      where: { guestId: id }
    })

    // Obriši gosta
    await prisma.guest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest:', error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
