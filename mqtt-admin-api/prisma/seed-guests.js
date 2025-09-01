// Script za dodavanje testnih gostiju u bazu

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting to seed guests data...')

  // Prvo ćemo obrisati postojeće guest i serviceRequest podatke
  await prisma.serviceRequest.deleteMany();
  await prisma.guest.deleteMany();
  
  // Definišemo preference kao JSON objekte koji će biti serijalizovani
  const alexPreferences = {
    food: ["Italian", "Vegan options"],
    drinks: ["Sparkling Water", "Red Wine"],
    roomTemperature: 21,
    cleaningTime: "Afternoon",
    dndActive: true,
    dndLocations: ["Master Cabin"]
  };

  const victoriaPreferences = {
    food: ["Continental Breakfast", "Seafood"],
    drinks: ["Green Tea", "White Wine"],
    roomTemperature: 23,
    cleaningTime: "Morning",
    dndActive: false,
    dndLocations: []
  };

  const michaelPreferences = {
    food: ["American", "Kid-friendly options"],
    drinks: ["Still Water", "Juice"],
    roomTemperature: 22,
    cleaningTime: "Afternoon",
    dndActive: false,
    dndLocations: []
  };

  const elizabethPreferences = {
    food: ["French", "Vegetarian options"],
    drinks: ["Sparkling Water", "Champagne"],
    roomTemperature: 21,
    cleaningTime: "Morning",
    dndActive: false,
    dndLocations: []
  };

  const johnPreferences = {
    food: ["Mediterranean", "Gluten-free options"],
    drinks: ["Coffee", "Whiskey"],
    roomTemperature: 20,
    cleaningTime: "Evening",
    dndActive: true,
    dndLocations: ["Master Suite", "Upper Deck"]
  };

  // Kreiramo goste
  const alex = await prisma.guest.create({
    data: {
      name: "Alexander Thompson",
      room: "Master Cabin",
      status: "Checked-In",
      isVip: true,
      guestType: "Owner",
      partySize: 2,
      arrivalDate: new Date("2023-04-10"),
      departureDate: new Date("2023-04-20"),
      notes: "Prefers Champagne upon arrival. Allergic to shellfish. Favorite flower: Orchids.",
      assignedCrew: "Emma Wilson",
      location: "Deck 1 - Port Side",
      preferences: JSON.stringify(alexPreferences),
      broker: null
    }
  });

  const victoria = await prisma.guest.create({
    data: {
      name: "Victoria Reynolds",
      room: "VIP Suite 1",
      status: "Checked-In",
      isVip: true,
      guestType: "Guest",
      partySize: 1,
      arrivalDate: new Date("2023-04-08"),
      departureDate: new Date("2023-04-18"),
      notes: "Early riser, requests breakfast at 7 AM.",
      assignedCrew: "James Miller",
      location: "Deck 2 - Forward",
      preferences: JSON.stringify(victoriaPreferences),
      broker: null
    }
  });

  const michael = await prisma.guest.create({
    data: {
      name: "Michael Richardson",
      room: "Guest Cabin 1",
      status: "Checked-In",
      isVip: false,
      guestType: "Family",
      partySize: 3,
      arrivalDate: new Date("2023-04-12"),
      departureDate: new Date("2023-04-17"),
      notes: "",
      assignedCrew: "Sophia Clark",
      location: "Deck 1 - Starboard Side",
      preferences: JSON.stringify(michaelPreferences),
      broker: null
    }
  });

  const elizabeth = await prisma.guest.create({
    data: {
      name: "Elizabeth Harrington",
      room: null,
      status: "Checked-In",
      isVip: false,
      guestType: "Guest",
      partySize: 1,
      arrivalDate: new Date("2023-04-14"),
      departureDate: new Date("2023-04-19"),
      notes: "Prefers an extra blanket in the room. Interested in local excursions.",
      assignedCrew: null,
      location: null,
      preferences: JSON.stringify(elizabethPreferences),
      broker: null
    }
  });

  // Budući gost
  const john = await prisma.guest.create({
    data: {
      name: "John Blackwood",
      room: "Master Suite",
      status: "Checked-In",
      isVip: true,
      guestType: "Charter",
      partySize: 2,
      arrivalDate: new Date(new Date().setDate(new Date().getDate() + 10)), // Dolazak za 10 dana
      departureDate: new Date(new Date().setDate(new Date().getDate() + 20)), // Odlazak za 20 dana
      notes: "Celebrating anniversary. Prepare special welcome package.",
      assignedCrew: null,
      location: null,
      preferences: JSON.stringify(johnPreferences),
      broker: "Elite Yacht Charters"
    }
  });

  // Kreiramo zahteve za servis
  await prisma.serviceRequest.create({
    data: {
      type: "Beverage Request",
      room: "Master Cabin",
      status: "completed",
      timestamp: new Date("2023-04-10T14:30:00Z"),
      description: "Champagne for two",
      guestId: alex.id
    }
  });

  await prisma.serviceRequest.create({
    data: {
      type: "Room Service",
      room: "Master Cabin",
      status: "completed",
      timestamp: new Date("2023-04-11T09:15:00Z"),
      description: "Fresh towels",
      guestId: alex.id
    }
  });

  await prisma.serviceRequest.create({
    data: {
      type: "Technical Support",
      room: "Master Cabin",
      status: "completed",
      timestamp: new Date("2023-04-12T16:45:00Z"),
      description: "TV remote not working",
      guestId: alex.id
    }
  });

  await prisma.serviceRequest.create({
    data: {
      type: "Breakfast Request",
      room: "VIP Suite 1",
      status: "completed",
      timestamp: new Date("2023-04-09T07:00:00Z"),
      description: "Continental breakfast",
      guestId: victoria.id
    }
  });

  await prisma.serviceRequest.create({
    data: {
      type: "Technical Support",
      room: "Guest Cabin 1",
      status: "pending",
      timestamp: new Date(),
      description: "Air conditioning not working properly",
      guestId: michael.id
    }
  });

  console.log('Guests seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
