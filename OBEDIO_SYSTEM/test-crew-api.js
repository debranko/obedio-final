// Test script for crew API endpoints
const BASE_URL = 'http://localhost:3000';

async function testCrewAPI() {
  console.log('Testing Crew API endpoints...\n');

  try {
    // Test 1: Get all crew members
    console.log('1. Testing GET /api/crew');
    const response1 = await fetch(`${BASE_URL}/api/crew`, {
      headers: {
        'x-auth-bypass': 'test'
      }
    });
    const data1 = await response1.json();
    console.log('Response status:', response1.status);
    console.log('Crew members count:', data1.crew?.length || 0);
    if (data1.crew && data1.crew.length > 0) {
      console.log('First crew member:', JSON.stringify(data1.crew[0], null, 2));
    }
    console.log('---\n');

    // Test 2: Create a new crew member
    console.log('2. Testing POST /api/crew');
    const newCrewMember = {
      name: 'Test Captain',
      email: 'captain@test.com',
      password: 'test123',
      role: 'Captain',
      department: 'Deck'
    };
    const response2 = await fetch(`${BASE_URL}/api/crew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-bypass': 'test'
      },
      body: JSON.stringify(newCrewMember)
    });
    const data2 = await response2.json();
    console.log('Response status:', response2.status);
    console.log('Created crew member:', JSON.stringify(data2, null, 2));
    const createdId = data2.user?.id;
    console.log('---\n');

    // Test 3: Get specific crew member
    if (createdId) {
      console.log(`3. Testing GET /api/crew/${createdId}`);
      const response3 = await fetch(`${BASE_URL}/api/crew/${createdId}`, {
        headers: {
          'x-auth-bypass': 'test'
        }
      });
      const data3 = await response3.json();
      console.log('Response status:', response3.status);
      console.log('Crew member details:', JSON.stringify(data3.crewMember, null, 2));
      console.log('---\n');
    }

    // Test 4: Test filtering by role
    console.log('4. Testing GET /api/crew?role=Captain');
    const response4 = await fetch(`${BASE_URL}/api/crew?role=Captain`, {
      headers: {
        'x-auth-bypass': 'test'
      }
    });
    const data4 = await response4.json();
    console.log('Response status:', response4.status);
    console.log('Captains found:', data4.crew?.length || 0);
    console.log('---\n');

    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testCrewAPI();