// UK Cities for Coach Location Selection
export const UK_CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Glasgow',
  'Edinburgh',
  'Liverpool',
  'Bristol',
  'Sheffield',
  'Newcastle',
  'Nottingham',
  'Leicester',
  'Southampton',
  'Cardiff',
  'Belfast',
  'Brighton',
  'Cambridge',
  'Oxford',
  'York',
  'Bath',
  'Norwich',
  'Exeter',
  'Plymouth',
  'Aberdeen',
  'Dundee',
  'Inverness',
  'Stirling',
  'Perth',
  'Swansea',
  'Newport',
  'Coventry',
  'Reading',
  'Derby',
  'Portsmouth',
  'Bournemouth',
  'Milton Keynes',
  'Swindon',
  'Northampton',
  'Luton',
  'Wolverhampton',
  'Stoke-on-Trent',
  'Preston',
  'Hull',
  'Bradford',
  'Wakefield',
  'Huddersfield',
  'Doncaster',
  'Bolton',
  'Salford',
  'Blackpool',
  'Other', // Custom location entry
] as const;

export type UKCity = typeof UK_CITIES[number];

// Location Radius Options (for in-person coaching)
export const LOCATION_RADIUS_OPTIONS = [
  { value: '5', label: 'Within 5 miles' },
  { value: '10', label: 'Within 10 miles' },
  { value: '25', label: 'Within 25 miles' },
  { value: '50', label: 'Within 50 miles' },
  { value: 'nationwide', label: 'Nationwide (UK)' },
  { value: 'international', label: 'International' },
] as const;

export type LocationRadius = typeof LOCATION_RADIUS_OPTIONS[number]['value'];

// Helper function to format location display
export function formatLocation(city: string, radius?: string): string {
  if (!radius) return city;

  const radiusOption = LOCATION_RADIUS_OPTIONS.find(opt => opt.value === radius);
  const radiusLabel = radiusOption ? radiusOption.label.toLowerCase() : radius;

  return `${city} (${radiusLabel})`;
}

// Helper to check if location is valid UK city
export function isValidUKCity(city: string): boolean {
  return UK_CITIES.includes(city as UKCity);
}
