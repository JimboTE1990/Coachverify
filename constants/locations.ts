// UK Cities for Coach Location Selection
// Grouped by nation, sorted alphabetically within each group

export const ENGLAND_CITIES = [
  'Aldershot',
  'Barnsley',
  'Barnstaple',
  'Basildon',
  'Basingstoke',
  'Bath',
  'Birmingham',
  'Blackburn',
  'Blackpool',
  'Bolton',
  'Bournemouth',
  'Bradford',
  'Brighton',
  'Bristol',
  'Burnley',
  'Cambridge',
  'Canterbury',
  'Carlisle',
  'Chatham',
  'Chelmsford',
  'Cheltenham',
  'Chester',
  'Chesterfield',
  'Chichester',
  'Colchester',
  'Coventry',
  'Crawley',
  'Crewe',
  'Derby',
  'Doncaster',
  'Dudley',
  'Durham',
  'Eastbourne',
  'Exeter',
  'Folkestone',
  'Gateshead',
  'Gloucester',
  'Grimsby',
  'Harrogate',
  'Hastings',
  'Hemel Hempstead',
  'Hereford',
  'High Wycombe',
  'Huddersfield',
  'Hull',
  'Ipswich',
  'Kidderminster',
  'Lancaster',
  'Leeds',
  'Leicester',
  'Lincoln',
  'Liverpool',
  'London',
  'Luton',
  'Macclesfield',
  'Maidstone',
  'Manchester',
  'Mansfield',
  'Middlesbrough',
  'Milton Keynes',
  'Newcastle',
  'Newquay',
  'Northampton',
  'Norwich',
  'Nottingham',
  'Oldham',
  'Oxford',
  'Peterborough',
  'Plymouth',
  'Portsmouth',
  'Preston',
  'Reading',
  'Redditch',
  'Rochdale',
  'Rotherham',
  'Salford',
  'Salisbury',
  'Scarborough',
  'Scunthorpe',
  'Sheffield',
  'Shrewsbury',
  'Slough',
  'Solihull',
  'Southampton',
  'Southend-on-Sea',
  'St Albans',
  'Stevenage',
  'Stockport',
  'Stoke-on-Trent',
  'Sunderland',
  'Swindon',
  'Telford',
  'Torquay',
  'Truro',
  'Wakefield',
  'Walsall',
  'Warrington',
  'Watford',
  'West Bromwich',
  'Wigan',
  'Winchester',
  'Windsor',
  'Woking',
  'Wolverhampton',
  'Worcester',
  'Worthing',
  'York',
] as const;

export const SCOTLAND_CITIES = [
  'Aberdeen',
  'Ayr',
  'Dumfries',
  'Dundee',
  'Edinburgh',
  'Falkirk',
  'Fort William',
  'Glasgow',
  'Inverness',
  'Kilmarnock',
  'Livingston',
  'Perth',
  'St Andrews',
  'Stirling',
] as const;

export const WALES_CITIES = [
  'Aberystwyth',
  'Bangor',
  'Cardiff',
  'Llanelli',
  'Merthyr Tydfil',
  'Newport',
  'Pontypridd',
  'Swansea',
  'Wrexham',
] as const;

export const NORTHERN_IRELAND_CITIES = [
  'Armagh',
  'Ballymena',
  'Belfast',
  'Coleraine',
  'Derry',
  'Lisburn',
  'Newry',
  'Omagh',
] as const;

export const PALESTINE_CITIES = [
  'Bethlehem',
  'Gaza City',
  'Hebron',
  'Jericho',
  'Jenin',
  'Nablus',
  'Ramallah',
  'Tulkarm',
] as const;

// Combined flat array (preserving country grouping order for backward compatibility)
export const UK_CITIES = [
  ...ENGLAND_CITIES,
  ...SCOTLAND_CITIES,
  ...WALES_CITIES,
  ...NORTHERN_IRELAND_CITIES,
  ...PALESTINE_CITIES,
  'Other',
] as const;

export type UKCity = typeof UK_CITIES[number];

// Grouped structure for searchable dropdowns
export const UK_CITIES_GROUPED = [
  { label: 'England', cities: ENGLAND_CITIES },
  { label: 'Scotland', cities: SCOTLAND_CITIES },
  { label: 'Wales', cities: WALES_CITIES },
  { label: 'Northern Ireland', cities: NORTHERN_IRELAND_CITIES },
  { label: 'Palestine', cities: PALESTINE_CITIES },
] as const;

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
