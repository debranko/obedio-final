const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding locations...');

  const locations = [
    // Main Deck
    { name: 'Master Suite', deck: 'Main Deck', type: 'cabin', capacity: 2, description: 'Luxurious master suite with panoramic views' },
    { name: 'VIP Suite 1', deck: 'Main Deck', type: 'cabin', capacity: 2, description: 'Spacious VIP suite with private balcony' },
    { name: 'VIP Suite 2', deck: 'Main Deck', type: 'cabin', capacity: 2, description: 'Elegant VIP suite with ocean views' },
    { name: 'Main Salon', deck: 'Main Deck', type: 'public', capacity: 20, description: 'Grand salon for entertainment and relaxation' },
    { name: 'Dining Room', deck: 'Main Deck', type: 'public', capacity: 12, description: 'Formal dining area with exquisite ambiance' },
    
    // Upper Deck
    { name: 'Guest Cabin 1', deck: 'Upper Deck', type: 'cabin', capacity: 2, description: 'Comfortable guest cabin with twin beds' },
    { name: 'Guest Cabin 2', deck: 'Upper Deck', type: 'cabin', capacity: 2, description: 'Cozy guest cabin with queen bed' },
    { name: 'Guest Cabin 3', deck: 'Upper Deck', type: 'cabin', capacity: 2, description: 'Modern guest cabin with ensuite' },
    { name: 'Sky Lounge', deck: 'Upper Deck', type: 'public', capacity: 15, description: 'Panoramic lounge with bar and entertainment' },
    { name: 'Upper Deck Bar', deck: 'Upper Deck', type: 'service', capacity: 8, description: 'Outdoor bar with stunning views' },
    
    // Sun Deck
    { name: 'Sun Deck Pool', deck: 'Sun Deck', type: 'public', capacity: 10, description: 'Infinity pool with jacuzzi' },
    { name: 'Sun Deck Bar', deck: 'Sun Deck', type: 'service', capacity: 6, description: 'Pool bar for refreshments' },
    { name: 'Gym', deck: 'Sun Deck', type: 'public', capacity: 4, description: 'Fully equipped fitness center' },
    { name: 'Spa', deck: 'Sun Deck', type: 'service', capacity: 2, description: 'Relaxation spa with treatment rooms' },
    
    // Lower Deck
    { name: 'Crew Cabin 1', deck: 'Lower Deck', type: 'crew', capacity: 2, description: 'Crew accommodation' },
    { name: 'Crew Cabin 2', deck: 'Lower Deck', type: 'crew', capacity: 2, description: 'Crew accommodation' },
    { name: 'Crew Cabin 3', deck: 'Lower Deck', type: 'crew', capacity: 2, description: 'Crew accommodation' },
    { name: 'Crew Mess', deck: 'Lower Deck', type: 'crew', capacity: 10, description: 'Crew dining and recreation area' },
    { name: 'Engine Room', deck: 'Lower Deck', type: 'technical', capacity: 4, description: 'Main engine room' },
    { name: 'Storage', deck: 'Lower Deck', type: 'technical', capacity: 2, description: 'General storage area' },
    
    // Bridge Deck
    { name: 'Bridge', deck: 'Bridge Deck', type: 'technical', capacity: 4, description: 'Navigation and control center' },
    { name: 'Captain\'s Cabin', deck: 'Bridge Deck', type: 'crew', capacity: 1, description: 'Captain\'s private quarters' },
    { name: 'Office', deck: 'Bridge Deck', type: 'service', capacity: 2, description: 'Administrative office' },
    
    // Beach Club
    { name: 'Beach Club', deck: 'Beach Deck', type: 'public', capacity: 8, description: 'Water-level beach club with water sports' },
    { name: 'Tender Garage', deck: 'Beach Deck', type: 'technical', capacity: 4, description: 'Storage for tenders and water toys' },
  ];

  for (const location of locations) {
    await prisma.location.create({
      data: location
    });
  }

  console.log(`Created ${locations.length} locations`);

  // Update existing guests with random locations
  const cabins = await prisma.location.findMany({
    where: { type: 'cabin' }
  });

  const guests = await prisma.guest.findMany();
  
  for (const guest of guests) {
    const randomCabin = cabins[Math.floor(Math.random() * cabins.length)];
    await prisma.guest.update({
      where: { id: guest.id },
      data: { locationId: randomCabin.id }
    });
  }

  console.log(`Updated ${guests.length} guests with location assignments`);

  // Update devices with locations
  const devices = await prisma.device.findMany();
  const allLocations = await prisma.location.findMany();

  for (const device of devices) {
    const randomLocation = allLocations[Math.floor(Math.random() * allLocations.length)];
    await prisma.device.update({
      where: { id: device.id },
      data: { 
        locationId: randomLocation.id,
        specificLocation: `${randomLocation.name} - ${device.type === 'button' ? 'Bedside' : 'Wall mounted'}`
      }
    });
  }

  console.log(`Updated ${devices.length} devices with location assignments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });