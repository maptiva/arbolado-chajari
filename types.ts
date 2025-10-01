
import { GeoPoint, Timestamp } from 'firebase/firestore';

export interface Tree {
  id: string;
  speciesName: string;
  estimatedAge: number;
  healthStatus: 'Bueno' | 'Regular' | 'Malo';
  notes: string;
  location: GeoPoint;
  address: string;
  createdBy: string;
  createdAt: Timestamp;
  status: 'verified' | 'unverified';
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
