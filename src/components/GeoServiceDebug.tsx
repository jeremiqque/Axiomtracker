import { useState, useEffect, useCallback } from 'react';
import { fetchCountries, fetchStates, type Country, type State } from '../lib/geoService';

export default function GeoServiceDebug() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    console.log(message);
  };

  const loadCountries = useCallback(async () => {
    try {
      addLog('Fetching countries...');
      setLoading(true);
      const data = await fetchCountries();
      addLog(`✓ Fetched ${data.length} countries`);
      setCountries(data);
      addLog(`Countries: ${data.map((c) => c.name).join(', ').substring(0, 100)}...`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`✗ Error fetching countries: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    addLog('Component mounted - Loading countries...');
    loadCountries();
  }, [loadCountries]);

  const loadStates = async (countryName: string) => {
    try {
      addLog(`Fetching states for: ${countryName}`);
      setLoading(true);
      setStates([]);
      const data = await fetchStates(countryName);
      addLog(`✓ Fetched ${data.length} states for ${countryName}`);
      setStates(data);
      if (data.length > 0) {
        addLog(`States: ${data.map((s) => s.name).join(', ').substring(0, 100)}...`);
      } else {
        addLog('No states found - this might be expected for some countries');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog(`✗ Error fetching states: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = e.target.value;
    setSelectedCountry(countryName);
    if (countryName) {
      loadStates(countryName);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Geo Service Debug Tool</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Countries & States API</h2>
        <label>
          Select Country:
          <select value={selectedCountry} onChange={handleCountryChange} disabled={loading}>
            <option value="">-- Select a country --</option>
            {countries.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </label>
        {loading && <span> Loading...</span>}
      </div>

      {states.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>States for {selectedCountry}:</h3>
          <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
            {states.map((state) => (
              <li key={state.code}>
                {state.name} ({state.code})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '20px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <h2>Debug Logs:</h2>
        <button onClick={() => setLogs([])}>Clear Logs</button>
        <pre style={{ maxHeight: '300px', overflow: 'auto', backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
}
