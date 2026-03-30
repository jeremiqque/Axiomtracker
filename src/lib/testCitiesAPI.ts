/**
 * Test script to diagnose city API issues
 * Run this in browser console to debug
 */

import { fetchCities, type City } from './geoService';

export async function testCitiesAPIs() {
  console.log('=== Testing Cities APIs ===');

  const testCountries = ['Nigeria', 'United States', 'United Kingdom'];

  for (const country of testCountries) {
    console.log(`\n--- Testing ${country} ---`);

    try {
      console.log(`Fetching cities for ${country}...`);
      const startTime = Date.now();
      const cities = await fetchCities(country);
      const endTime = Date.now();

      console.log(`✓ Success! Fetched ${cities.length} cities in ${endTime - startTime}ms`);
      if (cities.length > 0) {
        console.log('Sample cities:', cities.slice(0, 5).map((c: City) => c.name));
      } else {
        console.log('⚠ No cities returned');
      }
    } catch (error) {
      console.error(`✗ Error fetching cities for ${country}:`, error);
    }
  }

  console.log('\n=== Testing Complete ===');
}

// Make it available globally
declare global {
  interface Window {
    testCitiesAPIs: typeof testCitiesAPIs;
  }
}
window.testCitiesAPIs = testCitiesAPIs;
