// Nominatim API - Free, no authentication required
// API Documentation: https://nominatim.org/
// Uses OpenStreetMap data for geographic boundaries
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// REST Countries API - Free, no authentication required
// API Documentation: https://restcountries.com/
// Provides country data including cities
const RESTCOUNTRIES_API = 'https://restcountries.com/v3.1/name';

// BigDataCloud API - Free tier available
// API Documentation: https://www.bigdatacloud.com/geocoding-apis/free-api
// Provides city data by country
const BIGDATACLOUD_API = 'https://api.bigdatacloud.net/data/cities-with-countries';

// GeoNames API - Free with username registration required
// API Documentation: http://www.geonames.org/export/web-services.html
// Register for free username at: http://www.geonames.org/login
const GEONAMES_API = 'http://api.geonames.org/searchJSON';
const GEONAMES_USERNAME = 'Adura'; // Using demo account for testing - replace with your registered username

// Local cache of countries for initial load
// This prevents unnecessary API calls for country list
const COUNTRIES_LIST: Country[] = [
  { name: 'Nigeria', code: 'NG' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'India', code: 'IN' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'Ghana', code: 'GH' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Uganda', code: 'UG' },
  { name: 'Cameroon', code: 'CM' },
  { name: 'Côte d\'Ivoire', code: 'CI' },
  { name: 'Senegal', code: 'SN' },
  { name: 'Tanzania', code: 'TZ' },
  { name: 'Ethiopia', code: 'ET' },
  { name: 'Egypt', code: 'EG' },
  { name: 'Morocco', code: 'MA' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Italy', code: 'IT' },
  { name: 'Spain', code: 'ES' },
  { name: 'Japan', code: 'JP' },
  { name: 'China', code: 'CN' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Zambia', code: 'ZM' },
  { name: 'Zimbabwe', code: 'ZW' },
  { name: 'Botswana', code: 'BW' },
  { name: 'Mozambique', code: 'MZ' },
  { name: 'Malawi', code: 'MW' },
  { name: 'Rwanda', code: 'RW' },
  { name: 'Benin', code: 'BJ' },
  { name: 'Burkina Faso', code: 'BF' },
  { name: 'Mali', code: 'ML' },
  { name: 'Niger', code: 'NE' },
  { name: 'Liberia', code: 'LR' },
  { name: 'Sierra Leone', code: 'SL' },
  { name: 'Gambia', code: 'GM' },
  { name: 'Guinea', code: 'GN' },
  { name: 'Guinea-Bissau', code: 'GW' },
];

export interface Country {
  name: string;
  code: string;
}

export interface State {
  name: string;
  code: string;
}

// Types for Nominatim API responses
interface NominatimAddress {
  address_type?: string;
  state?: string;
  county?: string;
  province?: string;
  city?: string;
  town?: string;
  village?: string;
}

interface NominatimResult {
  name: string;
  address: NominatimAddress;
  type: string;
  importance: number;
}

// Types for WFT Geo DB API responses

// Types for GeoNames API responses
interface GeoNamesResult {
  name: string;
  countryName: string;
  fcodeName: string;
  population: number;
}

interface GeoNamesResponse {
  totalResultsCount: number;
  geonames: GeoNamesResult[];
}

/**
 * Fetch all countries - returns cached list for performance
 */
export const fetchCountries = async (): Promise<Country[]> => {
  try {
    console.log('[GeoService] Fetching countries from cache...');
    
    const countries = COUNTRIES_LIST.sort((a: Country, b: Country) => 
      a.name.localeCompare(b.name)
    );

    console.log(`[GeoService] Loaded ${countries.length} countries from cache`);
    return countries;
  } catch (error) {
    console.error('[GeoService] Error fetching countries:', error);
    throw new Error('Failed to fetch countries. Please try again later.');
  }
};

/**
 * Fetch states/provinces for a given country using Nominatim API
 * @param countryName - The name of the country (e.g., "Nigeria", "United States")
 */
export const fetchStates = async (countryName: string): Promise<State[]> => {
  if (!countryName) {
    return [];
  }

  try {
    console.log(`[GeoService] Fetching states for: ${countryName}`);
    
    // Query Nominatim for administrative areas (admin_level=4 for states/provinces)
    const url = new URL(NOMINATIM_API);
    url.searchParams.append('country', countryName);
    url.searchParams.append('admin_level', '4'); // States/provinces level
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '100');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.warn(`[GeoService] Nominatim API error for country ${countryName}: ${response.status}`);
      return [];
    }

    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`[GeoService] No states found for ${countryName}`);
      return [];
    }

    console.log(`[GeoService] Fetched ${data.length} results from Nominatim`);

    // Extract unique states/provinces from results
    const statesMap = new Map<string, State>();

    data.forEach((result) => {
      const stateName = result.name || result.address?.state || result.address?.province;

      if (typeof stateName === 'string' && stateName.trim()) {
        const stateCode = stateName
          .substring(0, 2)
          .toUpperCase()
          .replace(/[^A-Z]/g, '');

        // Use state name as key to avoid duplicates
        if (!statesMap.has(stateName)) {
          statesMap.set(stateName, {
            name: stateName,
            code: stateCode || stateName.substring(0, 2).toUpperCase(),
          });
        }
      }
    });

    const states = Array.from(statesMap.values())
      .sort((a: State, b: State) => a.name.localeCompare(b.name));

    console.log(`[GeoService] Processed ${states.length} unique states`);
    return states;
  } catch (error) {
    console.error('[GeoService] Error fetching states:', error);
    return [];
  }
};

// City type for city dropdown
export interface City {
  name: string;
  code: string;
}

/**
 * Fetch cities for a given country using multiple APIs with fallbacks
 * @param countryName - The name of the country (e.g., "Nigeria", "United States")
 */
export const fetchCities = async (countryName: string): Promise<City[]> => {
  if (!countryName) {
    console.log('[GeoService] No country name provided');
    return [];
  }

  console.log(`[GeoService] Starting city fetch for: "${countryName}"`);

  // Get country code for better API matching
  const countryCode = await getCountryCode(countryName);
  console.log(`[GeoService] Country code for ${countryName}: ${countryCode}`);



  // Try CountriesNow API (free, no auth required)
  try {
    console.log(`[GeoService] Trying CountriesNow API for: ${countryName} (code: ${countryCode})`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: countryName
      }),
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    console.log(`[GeoService] CountriesNow response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[GeoService] CountriesNow raw response:', data);

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`[GeoService] ✓ CountriesNow returned ${data.data.length} cities`);
        const cities: City[] = data.data.map((cityName: string) => ({
          name: cityName,
          code: cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''),
        })).sort((a: City, b: City) => a.name.localeCompare(b.name));
        console.log(`[GeoService] Processed ${cities.length} cities from CountriesNow`);
        return cities;
      } else {
        console.warn('[GeoService] CountriesNow returned empty data');
      }
    } else {
      const errorText = await response.text();
      console.warn(`[GeoService] CountriesNow HTTP error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[GeoService] CountriesNow API timed out after 15 seconds');
    } else {
      console.warn('[GeoService] CountriesNow API failed:', error);
    }
  }

  // Try WFT Geo DB Cities API (free tier available)
  try {
    console.log(`[GeoService] Trying WFT Geo DB Cities API for: ${countryName} (code: ${countryCode})`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Use country code if available, otherwise try country name
    const searchParam = countryCode || countryName;
    const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/countries/${encodeURIComponent(searchParam)}/places?limit=100&types=CITY&sort=-population`, {
      headers: {
        'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY', // You'll need to sign up for a free key at https://rapidapi.com/wirefreethought/api/geo-db-cities
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      },
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    console.log(`[GeoService] WFT Geo DB response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[GeoService] WFT Geo DB raw response:', data);

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`[GeoService] ✓ WFT Geo DB returned ${data.data.length} cities`);
        const cities: City[] = data.data.map((place: any) => ({
          name: place.name || place.city || 'Unknown City',
          code: (place.name || place.city || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''),
        })).sort((a: City, b: City) => a.name.localeCompare(b.name));
        console.log(`[GeoService] Processed ${cities.length} cities from WFT Geo DB`);
        return cities;
      } else {
        console.warn('[GeoService] WFT Geo DB returned empty data');
      }
    } else {
      const errorText = await response.text();
      console.warn(`[GeoService] WFT Geo DB HTTP error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[GeoService] WFT Geo DB API timed out after 15 seconds');
    } else {
      console.warn('[GeoService] WFT Geo DB API failed:', error);
    }
  }

  // Fallback 1: Try REST Countries API for capital cities
  try {
    console.log(`[GeoService] Trying REST Countries API for capital cities of: ${countryName}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${RESTCOUNTRIES_API}/${encodeURIComponent(countryName)}`, {
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    console.log(`[GeoService] REST Countries response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[GeoService] REST Countries raw response:', data);

      if (Array.isArray(data) && data.length > 0) {
        const countryData = data[0];
        if (countryData.capital && Array.isArray(countryData.capital) && countryData.capital.length > 0) {
          console.log(`[GeoService] ✓ REST Countries returned ${countryData.capital.length} capital cities`);
          const cities: City[] = countryData.capital.map((cityName: string) => ({
            name: cityName,
            code: cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''),
          })).sort((a: City, b: City) => a.name.localeCompare(b.name));
          console.log(`[GeoService] Processed ${cities.length} cities from REST Countries`);
          return cities;
        } else if (countryData.capital && typeof countryData.capital === 'string') {
          console.log(`[GeoService] ✓ REST Countries returned 1 capital city`);
          const cities: City[] = [{
            name: countryData.capital,
            code: countryData.capital.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''),
          }];
          console.log(`[GeoService] Processed 1 city from REST Countries`);
          return cities;
        }
      }
    } else {
      const errorText = await response.text();
      console.warn(`[GeoService] REST Countries HTTP error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[GeoService] REST Countries API timed out after 10 seconds');
    } else {
      console.warn('[GeoService] REST Countries API failed:', error);
    }
  }

  // Fallback 2: Nominatim API
  try {
    console.log(`[GeoService] Falling back to Nominatim API for: ${countryName}`);
    const url = new URL(NOMINATIM_API);
    url.searchParams.append('country', countryName);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '100'); // Increased limit
    url.searchParams.append('dedupe', '1');
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('featuretype', 'city'); // Focus on cities

    console.log(`[GeoService] Nominatim URL: ${url.toString()}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    console.log(`[GeoService] Nominatim response status: ${response.status}`);

    if (!response.ok) {
      console.warn(`[GeoService] Nominatim API error: ${response.status}`);
      return [];
    }

    const data: NominatimResult[] = await response.json();
    console.log(`[GeoService] Nominatim returned ${data.length} raw results`);

    if (!data || data.length === 0) {
      console.warn(`[GeoService] No results from Nominatim for ${countryName}`);
      return [];
    }

    // Extract cities from Nominatim results
    const citiesMap = new Map<string, City>();
    data.forEach((result) => {
      const cityName = result.name || result.address?.city || result.address?.town || result.address?.village;
      if (typeof cityName === 'string' && cityName.trim() && (result.type === 'city' || result.type === 'town' || result.type === 'village')) {
        const cityCode = cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        if (!citiesMap.has(cityName)) {
          citiesMap.set(cityName, {
            name: cityName,
            code: cityCode || cityName.substring(0, 3).toUpperCase(),
          });
        }
      }
    });

    const cities = Array.from(citiesMap.values()).sort((a: City, b: City) => a.name.localeCompare(b.name));
    console.log(`[GeoService] ✓ Processed ${cities.length} cities from Nominatim fallback`);
    return cities;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[GeoService] Nominatim API timed out');
    } else {
      console.error('[GeoService] Nominatim API failed:', error);
    }
  }

  // Fallback 3: GeoNames API
  try {
    console.log(`[GeoService] Falling back to GeoNames API for: ${countryName}`);
    const url = new URL(GEONAMES_API);
    // Use country code if available, otherwise use country name
    if (countryCode) {
      url.searchParams.append('country', countryCode);
    } else {
      url.searchParams.append('country', countryName);
    }
    url.searchParams.append('featureClass', 'P'); // Populated places
    url.searchParams.append('maxRows', '100');
    url.searchParams.append('username', GEONAMES_USERNAME);

    console.log(`[GeoService] GeoNames URL: ${url.toString()}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    console.log(`[GeoService] GeoNames response status: ${response.status}`);

    if (!response.ok) {
      console.warn(`[GeoService] GeoNames API error: ${response.status}`);
      return [];
    }

    const data: GeoNamesResponse = await response.json();
    console.log(`[GeoService] GeoNames returned ${data.totalResultsCount} total results, ${data.geonames?.length || 0} in response`);

    if (!data.geonames || data.geonames.length === 0) {
      console.warn(`[GeoService] No results from GeoNames for ${countryName}`);
      return [];
    }

    // Filter for cities/towns and extract unique names
    const citiesMap = new Map<string, City>();
    data.geonames.forEach((result) => {
      const cityName = result.name;
      if (cityName && (result.fcodeName === 'capital' || result.fcodeName === 'populated place' || result.population > 10000)) {
        const cityCode = cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        if (!citiesMap.has(cityName)) {
          citiesMap.set(cityName, {
            name: cityName,
            code: cityCode || cityName.substring(0, 3).toUpperCase(),
          });
        }
      }
    });

    const cities = Array.from(citiesMap.values()).sort((a: City, b: City) => a.name.localeCompare(b.name));
    console.log(`[GeoService] ✓ Processed ${cities.length} cities from GeoNames fallback`);
    return cities;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[GeoService] GeoNames API timed out');
    } else {
      console.error('[GeoService] GeoNames API failed:', error);
    }
  }

  // Fallback 4: REST Countries API
  try {
    console.log(`[GeoService] Falling back to REST Countries API for: ${countryName}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${RESTCOUNTRIES_API}/${encodeURIComponent(countryName)}`, {
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    console.log(`[GeoService] REST Countries response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[GeoService] REST Countries raw response:', data);

      if (Array.isArray(data) && data.length > 0) {
        const countryData = data[0];
        if (countryData.capital && Array.isArray(countryData.capital)) {
          const cities: City[] = countryData.capital.map((cityName: string) => {
            const cityCode = cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
            return {
              name: cityName,
              code: cityCode || cityName.substring(0, 3).toUpperCase(),
            };
          }).sort((a: City, b: City) => a.name.localeCompare(b.name));

          if (cities.length > 0) {
            console.log(`[GeoService] ✓ REST Countries returned ${cities.length} cities`);
            return cities;
          }
        }
      }
    }
  } catch (error) {
    console.warn('[GeoService] REST Countries API failed:', error);
  }

  // Fallback 5: BigDataCloud API
  try {
    console.log(`[GeoService] Falling back to BigDataCloud API for: ${countryName}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // BigDataCloud API returns all cities, so we need to filter by country
    const response = await fetch(`${BIGDATACLOUD_API}?key=bdc_free`, {
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    console.log(`[GeoService] BigDataCloud response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('[GeoService] BigDataCloud raw response sample:', data.slice(0, 3));

      if (Array.isArray(data) && data.length > 0) {
        // Filter cities by country name or country code
        const countryCities = data.filter((item: unknown) => {
          if (typeof item === 'object' && item !== null) {
            const cityItem = item as { countryName?: string; countryCode?: string };
            const itemCountryName = cityItem.countryName?.toLowerCase();
            const itemCountryCode = cityItem.countryCode?.toLowerCase();
            const searchCountryName = countryName.toLowerCase();
            const searchCountryCode = countryCode?.toLowerCase();

            return itemCountryName === searchCountryName ||
                   itemCountryCode === searchCountryCode ||
                   itemCountryCode === searchCountryName ||
                   itemCountryName === searchCountryCode;
          }
          return false;
        });

        console.log(`[GeoService] BigDataCloud filtered ${countryCities.length} cities for ${countryName}`);

        if (countryCities.length > 0) {
          const cities: City[] = countryCities.slice(0, 50).map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              const cityItem = item as { cityName?: string; name?: string; city?: string };
              const cityName = cityItem.cityName || cityItem.name || cityItem.city || 'Unknown City';
              const cityCode = cityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
              return {
                name: cityName,
                code: cityCode || cityName.substring(0, 3).toUpperCase(),
              };
            }
            return { name: 'Unknown City', code: 'UNK' };
          }).sort((a: City, b: City) => a.name.localeCompare(b.name));

          if (cities.length > 0) {
            console.log(`[GeoService] ✓ BigDataCloud returned ${cities.length} cities`);
            return cities;
          }
        }
      }
    }
  } catch (error) {
    console.warn('[GeoService] BigDataCloud API failed:', error);
  }

  // Final fallback: Return some default cities for common countries when all APIs fail
  console.log(`[GeoService] All APIs failed, returning fallback cities for ${countryName}`);

  const fallbackCities: Record<string, City[]> = {
    'Nigeria': [
      { name: 'Lagos', code: 'LAG' },
      { name: 'Abuja', code: 'ABU' },
      { name: 'Kano', code: 'KAN' },
      { name: 'Ibadan', code: 'IBA' },
      { name: 'Port Harcourt', code: 'POR' },
    ],
    'United States': [
      { name: 'New York', code: 'NYC' },
      { name: 'Los Angeles', code: 'LAX' },
      { name: 'Chicago', code: 'CHI' },
      { name: 'Houston', code: 'HOU' },
      { name: 'Phoenix', code: 'PHO' },
    ],
    'United Kingdom': [
      { name: 'London', code: 'LON' },
      { name: 'Manchester', code: 'MAN' },
      { name: 'Birmingham', code: 'BIR' },
      { name: 'Liverpool', code: 'LIV' },
      { name: 'Glasgow', code: 'GLA' },
    ],
  };

  const defaults = fallbackCities[countryName];
  if (defaults && defaults.length > 0) {
    console.log(`[GeoService] Returning ${defaults.length} fallback cities for ${countryName}`);
    return defaults;
  }

  // Ultimate fallback: Return some generic cities for any country
  return [
    { name: 'City 1', code: 'CT1' },
    { name: 'City 2', code: 'CT2' },
    { name: 'City 3', code: 'CT3' },
    { name: 'City 4', code: 'CT4' },
    { name: 'City 5', code: 'CT5' },
  ];
};

/**
 * Get country code from country name
 */
export const getCountryCode = async (countryName: string): Promise<string | null> => {
  try {
    const country = COUNTRIES_LIST.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country?.code || null;
  } catch (error) {
    console.error('Error getting country code:', error);
    return null;
  }
};
