import { Country, State, City } from 'country-state-city';

export interface CountryOption {
  name: string;
  code: string;
}

export interface StateOption {
  name: string;
  code: string;
}

export interface CityOption {
  name: string;
  code: string;
}

// Keep old export names so existing imports don't break
export type { CountryOption as Country, StateOption as State, CityOption as City };

export const fetchCountries = async (): Promise<CountryOption[]> => {
  return Country.getAllCountries()
    .map(c => ({ name: c.name, code: c.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchStates = async (countryName: string): Promise<StateOption[]> => {
  if (!countryName) return [];

  // Find the country ISO code from the name
  const country = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (!country) return [];

  return State.getStatesOfCountry(country.isoCode)
    .map(s => ({ name: s.name, code: s.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchCities = async (countryName: string): Promise<CityOption[]> => {
  if (!countryName) return [];

  const country = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (!country) return [];

  return City.getCitiesOfCountry(country.isoCode)
    ?.map(c => ({ name: c.name, code: c.name.substring(0, 3).toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name)) ?? [];
};

export const fetchCitiesByState = async (countryName: string, stateName: string): Promise<CityOption[]> => {
  if (!countryName || !stateName) return [];

  const country = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (!country) return fetchCities(countryName);

  const state = State.getStatesOfCountry(country.isoCode).find(
    s => s.name.toLowerCase() === stateName.toLowerCase()
  );
  if (!state) return fetchCities(countryName);

  const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
  if (!cities || cities.length === 0) return fetchCities(countryName);

  return cities
    .map(c => ({ name: c.name, code: c.name.substring(0, 3).toUpperCase() }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getCountryCode = async (countryName: string): Promise<string | null> => {
  const country = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  return country?.isoCode ?? null;
};
