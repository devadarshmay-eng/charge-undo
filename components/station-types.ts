export type StationStatus = "available" | "occupied" | "broken" | "missing" | "other" | "unconfirmed" | "disputed";

export type Station = {
  id: string;
  source: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: string;
  operator?: string;
  connectorType?: string;
  coverPhotoUrl?: string;
  ratingAverage?: number;
  status?: StationStatus;
  latestReportId?: string;
  statusUpdatedAt?: string;
};
