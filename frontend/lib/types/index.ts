export interface PostalCodeInput {
  tag: string;
  postalCodes: string;
}

export interface PostalCodeFormData {
  inputs: PostalCodeInput[];
}

export interface DemographicData {
  year: number;
  population: number;
}

export interface GeoJsonFeature {
  type: string;
  geometry?: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    postal_code: string;
    delivery_station: string;
    program_type: string;
    effective_week: string;
    plan_identifier: string;
    dw_update_datetime: string;
    is_main_station?: boolean;
    lat?: number;
    long?: number;
    demographics?: DemographicData[];
  };
}

export interface TagGroup {
  tag: string;
  features: GeoJsonFeature[];
  postalCodes: string[];
  isStation?: boolean;
  stationName?: string;
  programType?: string;
}

export interface ProcessedMapData {
  geoJson: {
    type: string;
    features: GeoJsonFeature[];
    metadata?: {
      delivery_station: string;
      effective_week: string;
      program_type: string;
      recursive: boolean;
      total_postal_codes: number;
      total_delivery_stations: number;
      delivery_stations: string[];
    };
  };
  tagGroups: TagGroup[];
}

export interface PostalCodeFeature {
  type: 'Feature';
  properties: {
    postal_code: string;
    lat: number;
    long: number;
    demographics?: DemographicData[];
  };
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  } | {
    type: 'MultiPolygon';
    coordinates: [number, number][][][];
  };
}

export interface PostalCodeResponse {
  type: 'FeatureCollection';
  features: PostalCodeFeature[];
}

export interface TaggedPostalCodes {
  tag: string;
  features: PostalCodeFeature[];
  color: string;
} 