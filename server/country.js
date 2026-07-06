// Best-effort mapping of a free-text GitHub "location" to a country flag.
// Returns { code, flag } or null.

const COUNTRIES = {
  "united states": "US", usa: "US", "u.s.": "US", america: "US",
  india: "IN", "united kingdom": "GB", uk: "GB", england: "GB",
  scotland: "GB", wales: "GB", australia: "AU", canada: "CA",
  germany: "DE", deutschland: "DE", france: "FR", spain: "ES",
  españa: "ES", italy: "IT", italia: "IT", netherlands: "NL",
  holland: "NL", sweden: "SE", sverige: "SE", norway: "NO",
  denmark: "DK", finland: "FI", suomi: "FI", switzerland: "CH",
  austria: "AT", belgium: "BE", ireland: "IE", portugal: "PT",
  poland: "PL", polska: "PL", czech: "CZ", russia: "RU",
  ukraine: "UA", brazil: "BR", brasil: "BR", argentina: "AR",
  mexico: "MX", méxico: "MX", chile: "CL", colombia: "CO",
  japan: "JP", 日本: "JP", china: "CN", 中国: "CN",
  "south korea": "KR", korea: "KR", taiwan: "TW", singapore: "SG",
  "hong kong": "HK", indonesia: "ID", malaysia: "MY", thailand: "TH",
  vietnam: "VN", philippines: "PH", pakistan: "PK", bangladesh: "BD",
  "sri lanka": "LK", nepal: "NP", "new zealand": "NZ",
  "south africa": "ZA", nigeria: "NG", kenya: "KE", egypt: "EG",
  israel: "IL", turkey: "TR", türkiye: "TR", uae: "AE",
  "united arab emirates": "AE", dubai: "AE", "saudi arabia": "SA",
  greece: "GR", romania: "RO", hungary: "HU", estonia: "EE",
  latvia: "LV", lithuania: "LT", iceland: "IS", croatia: "HR",
  serbia: "RS", bulgaria: "BG", slovakia: "SK", slovenia: "SI",
};

const CITIES = {
  "san francisco": "US", "new york": "US", nyc: "US", seattle: "US",
  austin: "US", boston: "US", chicago: "US", "los angeles": "US",
  "palo alto": "US", "mountain view": "US", portland: "US", denver: "US",
  london: "GB", manchester: "GB", cambridge: "GB", oxford: "GB",
  edinburgh: "GB", berlin: "DE", munich: "DE", münchen: "DE",
  hamburg: "DE", paris: "FR", amsterdam: "NL", stockholm: "SE",
  helsinki: "FI", oslo: "NO", copenhagen: "DK", zurich: "CH",
  zürich: "CH", vienna: "AT", dublin: "IE", lisbon: "PT", madrid: "ES",
  barcelona: "ES", rome: "IT", milan: "IT", prague: "CZ", warsaw: "PL",
  moscow: "RU", kyiv: "UA", toronto: "CA", vancouver: "CA",
  montreal: "CA", sydney: "AU", melbourne: "AU", auckland: "NZ",
  tokyo: "JP", osaka: "JP", beijing: "CN", shanghai: "CN",
  shenzhen: "CN", seoul: "KR", taipei: "TW", bangalore: "IN",
  bengaluru: "IN", mumbai: "IN", delhi: "IN", "new delhi": "IN",
  hyderabad: "IN", chennai: "IN", pune: "IN", kolkata: "IN",
  karachi: "PK", lahore: "PK", dhaka: "BD", colombo: "LK",
  jakarta: "ID", "kuala lumpur": "MY", bangkok: "TH",
  "ho chi minh": "VN", hanoi: "VN", manila: "PH", "tel aviv": "IL",
  istanbul: "TR", "cape town": "ZA", johannesburg: "ZA",
  nairobi: "KE", lagos: "NG", cairo: "EG", "são paulo": "BR",
  "sao paulo": "BR", "rio de janeiro": "BR", "buenos aires": "AR",
  "mexico city": "MX", santiago: "CL", bogotá: "CO", bogota: "CO",
};

function codeToFlag(code) {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export function flagForLocation(location) {
  if (!location) return null;
  const loc = location.toLowerCase();

  for (const [name, code] of Object.entries(COUNTRIES)) {
    if (loc.includes(name)) return { code, flag: codeToFlag(code) };
  }
  for (const [name, code] of Object.entries(CITIES)) {
    if (loc.includes(name)) return { code, flag: codeToFlag(code) };
  }
  return null;
}
