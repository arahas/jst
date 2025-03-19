const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:8000';

export async function fetchPostalCodesData(postalCodes: string[], includeGeometry = true, includeDemographics = true) {
  const params = new URLSearchParams({
    postal_codes: postalCodes.join(','),
    include_geometry: includeGeometry.toString(),
    include_demographics: includeDemographics.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/zip-codes/?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch postal codes data');
  }

  return response.json();
}

export async function fetchAvailableYears() {
  const response = await fetch(`${API_BASE_URL}/years/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch available years');
  }

  return response.json();
}

interface NodeCoverageParams {
  delivery_station: string;
  effective_week?: string;
  program_type?: string;
  geometry?: boolean;
  population?: boolean;
  recursive?: boolean;
}

interface NodeReverseCoverageParams {
  postal_codes: string[];
  effective_week?: string;
  program_type?: string;
  geometry?: boolean;
  population?: boolean;
}

export async function fetchNodeCoverage(params: NodeCoverageParams) {
  const queryParams = new URLSearchParams();
  
  // Add required parameters
  queryParams.append('delivery_station', params.delivery_station);
  
  // Add optional parameters if they exist
  if (params.effective_week) queryParams.append('effective_week', params.effective_week);
  if (params.program_type) queryParams.append('program_type', params.program_type);
  if (params.geometry !== undefined) queryParams.append('geometry', params.geometry.toString());
  if (params.population !== undefined) queryParams.append('population', params.population.toString());
  if (params.recursive !== undefined) queryParams.append('recursive', params.recursive.toString());
  
  try {
    const response = await fetch(`${API_BASE_URL}/node/?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching node coverage:', error);
    throw error;
  }
}

export async function fetchNodeReverseCoverage(params: NodeReverseCoverageParams) {
  const queryParams = new URLSearchParams();
  
  // Add required parameters
  queryParams.append('postal_codes', params.postal_codes.join(','));
  
  // Add optional parameters if they exist
  if (params.effective_week) queryParams.append('effective_week', params.effective_week);
  if (params.program_type) queryParams.append('program_type', params.program_type);
  if (params.geometry !== undefined) queryParams.append('geometry', params.geometry.toString());
  if (params.population !== undefined) queryParams.append('population', params.population.toString());
  
  try {
    const response = await fetch(`${API_BASE_URL}/node-reverse/?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching reverse node coverage:', error);
    throw error;
  }
}

export async function fetchEffectiveWeeks() {
  try {
    const response = await fetch(`${API_BASE_URL}/effective-weeks/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching effective weeks:', error);
    throw error;
  }
} 