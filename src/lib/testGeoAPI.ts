/**
 * Test script to diagnose geo API issues
 * Run this in browser console to debug
 */

export async function testGeoAPIs() {
  console.log('=== Testing Geo APIs ===');

  // Test 1: REST Countries API
  console.log('\n1. Testing REST Countries API...');
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    console.log(`REST Countries Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ REST Countries OK. Countries: ${data.length}`);
      console.log('Sample country:', data[0]);
    } else {
      console.error(`✗ REST Countries failed: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ REST Countries error:', error);
  }

  // Test 2: REST Countries - Nigeria specifically
  console.log('\n2. Testing REST Countries for Nigeria...');
  try {
    const response = await fetch('https://restcountries.com/v3.1/name/Nigeria');
    console.log(`Nigeria lookup Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Nigeria found:', {
        name: data[0]?.name?.common,
        code: data[0]?.cca2,
      });
    } else {
      console.error(`✗ Nigeria lookup failed: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Nigeria lookup error:', error);
  }

  // Test 3: Geonames API - Nigeria states
  console.log('\n3. Testing Geonames API for Nigeria states...');
  const GEONAMES_USERNAME = 'adura';
  const NIGERIA_GEONAME_ID = 2318131;
  try {
    const response = await fetch(
      `https://www.geonames.org/childrenJSON?geonameId=${NIGERIA_GEONAME_ID}&username=${GEONAMES_USERNAME}`,
      { method: 'GET', mode: 'cors' }
    );
    console.log(`Geonames Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Geonames OK. States found:', data.geonames?.length || 0);
      if (data.geonames && data.geonames.length > 0) {
        console.log('Sample states:');
        data.geonames.slice(0, 5).forEach((state: any) => {
          console.log(`  - ${state.name} (${state.fcode})`);
        });
      }
    } else {
      console.error(`✗ Geonames failed: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Geonames error:', error);
  }

  // Test 4: Test with US
  console.log('\n4. Testing Geonames API for US states...');
  const US_GEONAME_ID = 6252001;
  try {
    const response = await fetch(
      `https://www.geonames.org/childrenJSON?geonameId=${US_GEONAME_ID}&username=${GEONAMES_USERNAME}`,
      { method: 'GET', mode: 'cors' }
    );
    console.log(`US Geonames Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ US States found:', data.geonames?.length || 0);
      if (data.geonames && data.geonames.length > 0) {
        console.log('Sample US states:');
        data.geonames.slice(0, 5).forEach((state: any) => {
          console.log(`  - ${state.name} (${state.fcode})`);
        });
      }
    } else {
      console.error(`✗ US Geonames failed: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ US Geonames error:', error);
  }

  console.log('\n=== Testing Complete ===');
}

// Make it available globally
(window as any).testGeoAPIs = testGeoAPIs;
