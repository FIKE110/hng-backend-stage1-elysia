export interface GenderizeResponse {
  name: string;
  gender: string | null;
  probability: number | null;
  count: number | null;
}

export interface AgifyResponse {
  name: string;
  age: number | null;
  count: number | null;
}

export interface NationalizeResponse {
  name: string;
  country: { country_id: string; probability: number }[] | null;
}

export async function fetchGenderize(name: string): Promise<GenderizeResponse> {
  const response = await fetch(`https://api.genderize.io?name=${name}`);
  if (!response.ok) {
    throw new Error('Genderize API request failed');
  }
  return response.json();
}

export async function fetchAgify(name: string): Promise<AgifyResponse> {
  const response = await fetch(`https://api.agify.io?name=${name}`);
  if (!response.ok) {
    throw new Error('Agify API request failed');
  }
  return response.json();
}

export async function fetchNationalize(name: string): Promise<NationalizeResponse> {
  const response = await fetch(`https://api.nationalize.io?name=${name}`);
  if (!response.ok) {
    throw new Error('Nationalize API request failed');
  }
  return response.json();
}

export function classifyAgeGroup(age: number | null): string | null {
  if (age === null) return null;
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
}

export interface ProcessedProfile {
  name: string;
  gender: string | null;
  gender_probability: number | null;
  sample_size: number | null;
  age: number | null;
  age_group: string | null;
  country_id: string | null;
  country_probability: number | null;
}

export async function fetchAndProcessProfile(name: string): Promise<ProcessedProfile> {
  const [genderize, agify, nationalize] = await Promise.all([
    fetchGenderize(name),
    fetchAgify(name),
    fetchNationalize(name),
  ]);

  if (genderize.gender === null || genderize.count === 0) {
    throw { service: 'Genderize', message: 'Genderize returned an invalid response' };
  }
  if (agify.age === null) {
    throw { service: 'Agify', message: 'Agify returned an invalid response' };
  }
  if (!nationalize.country || nationalize.country.length === 0) {
    throw { service: 'Nationalize', message: 'Nationalize returned an invalid response' };
  }

  const topCountry = nationalize.country.reduce((prev, curr) =>
    curr.probability > prev.probability ? curr : prev
  );

  return {
    name,
    gender: genderize.gender,
    gender_probability: genderize.probability,
    sample_size: genderize.count,
    age: agify.age,
    age_group: classifyAgeGroup(agify.age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
  };
}