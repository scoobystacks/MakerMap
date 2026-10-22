/** Access model for a space. Drives pin color and the primary filter. */
export type AccessType = 'free' | 'paid' | 'restricted';

export type VenueType =
  | 'makerspace'
  | 'library'
  | 'university'
  | 'corporate'
  | 'studio'
  | 'community';

export const EQUIPMENT_CATEGORIES = [
  '3d-printing',
  'laser-cutting',
  'cnc-machining',
  'woodworking',
  'metalworking',
  'welding',
  'electronics',
  'textiles',
  'sewing',
  'embroidery',
  'ceramics',
  'printmaking',
  'jewelry',
  'glass',
  'vinyl-cutting',
  'large-format-printing',
  'photography',
  'av-media',
  'computers',
  'bikes',
  'casting',
  'robotics',
  'prototyping',
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

export interface Space {
  id: string;
  name: string;
  access: AccessType;
  accessSummary: string;
  accessUrl: string | null;
  affiliation: string | null;
  eligibility: string | null;
  venueType: VenueType;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  website: string;
  googleMapsUrl: string | null;
  founded: number | null;
  foundedNote: string | null;
  hours: string | null;
  hoursUrl: string | null;
  equipmentCategories: EquipmentCategory[];
  equipment: string[];
  equipmentUrl: string | null;
  description: string;
  phone: string | null;
  email: string | null;
  sources: string[];
  lastVerified: string;
}

/** A space plus its distance from the current reference point. */
export interface SpaceWithDistance extends Space {
  distanceKm: number | null;
}

export const ACCESS_LABELS: Record<AccessType, string> = {
  free: 'Free & public',
  paid: 'Paid access',
  restricted: 'Members only',
};

export const ACCESS_DESCRIPTIONS: Record<AccessType, string> = {
  free: 'Open to the public at no cost (a library card may be needed).',
  paid: 'Open to anyone for a fee: memberships, day passes, punch cards, or hourly rental.',
  restricted: 'Limited to a university, company, or community group.',
};

export const VENUE_LABELS: Record<VenueType, string> = {
  makerspace: 'Makerspace',
  library: 'Library',
  university: 'University',
  corporate: 'Corporate',
  studio: 'Studio',
  community: 'Community',
};

export const EQUIPMENT_LABELS: Record<EquipmentCategory, string> = {
  '3d-printing': '3D printing',
  'laser-cutting': 'Laser cutting',
  'cnc-machining': 'CNC machining',
  woodworking: 'Woodworking',
  metalworking: 'Metalworking',
  welding: 'Welding',
  electronics: 'Electronics',
  textiles: 'Textiles',
  sewing: 'Sewing',
  embroidery: 'Embroidery',
  ceramics: 'Ceramics',
  printmaking: 'Printmaking',
  jewelry: 'Jewelry',
  glass: 'Glass',
  'vinyl-cutting': 'Vinyl cutting',
  'large-format-printing': 'Large-format printing',
  photography: 'Photography',
  'av-media': 'Audio / video',
  computers: 'Computers',
  bikes: 'Bike repair',
  casting: 'Casting',
  robotics: 'Robotics',
  prototyping: 'Prototyping',
};
