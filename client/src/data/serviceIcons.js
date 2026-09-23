import {
  Plane,
  Briefcase,
  Gem,
  PartyPopper,
  Bus,
  MoonStar,
  Heart,
  School,
  Car,
  CarFront,
  Ship,
  Wine,
  Cake,
  Music,
  Users,
  Clock,
  Star,
  Zap,
  ShieldCheck,
  Gift,
  GraduationCap,
} from 'lucide-react';

// Services are stored in CMS as plain JSON, so their icon must travel as a
// string key instead of a component reference. This maps those keys back to
// lucide components (used by Services, ServiceDetail, Navbar and Footer after
// the CMS merge). Defaults keep their compiled component and are untouched.
export const SERVICE_ICON_MAP = {
  plane: Plane,
  airport: Plane,
  flight: Plane,
  briefcase: Briefcase,
  corporate: Briefcase,
  work: Briefcase,
  gem: Gem,
  wedding: Gem,
  diamond: Gem,
  party: PartyPopper,
  prom: PartyPopper,
  celebrations: PartyPopper,
  bus: Bus,
  'mini-coach': Bus,
  shuttle: Bus,
  charter: Bus,
  group: Users,
  groups: Users,
  moon: MoonStar,
  'night-out': MoonStar,
  night: MoonStar,
  heart: Heart,
  funeral: Heart,
  school: School,
  education: GraduationCap,
  sedan: Car,
  car: Car,
  valet: Car,
  suv: CarFront,
  'car-front': CarFront,
  ship: Ship,
  yacht: Ship,
  wine: Wine,
  toast: Wine,
  cake: Cake,
  celebration: Cake,
  music: Music,
  concert: Music,
  clock: Clock,
  hourly: Clock,
  star: Star,
  vip: Star,
  zap: Zap,
  express: Zap,
  shield: ShieldCheck,
  safety: ShieldCheck,
  gift: Gift,
  special: Gift,
};

export const SERVICE_ICON_OPTIONS = [
  { key: 'airport', label: 'Airport / Flight', icon: Plane },
  { key: 'corporate', label: 'Corporate / Briefcase', icon: Briefcase },
  { key: 'wedding', label: 'Wedding / Gem', icon: Gem },
  { key: 'prom', label: 'Prom / Party', icon: PartyPopper },
  { key: 'group', label: 'Group / Shuttle', icon: Bus },
  { key: 'shuttle', label: 'Shuttle / Bus', icon: Bus },
  { key: 'charter', label: 'Charter / Hourly', icon: Clock },
  { key: 'night-out', label: 'Night Out / Moon', icon: MoonStar },
  { key: 'funeral', label: 'Funeral / Heart', icon: Heart },
  { key: 'school', label: 'School / Education', icon: School },
  { key: 'valet', label: 'Valet / Car', icon: Car },
  { key: 'suv', label: 'SUV / Luxury', icon: CarFront },
  { key: 'wine', label: 'VIP / Champagne', icon: Wine },
];

// Resolves the icon component for a service after the CMS merge. Defaults carry
// a live component (`typeof icon === 'function'`); CMS-added services pass an
// iconKey / slug string that we map, falling back to a neutral sedan icon.
export function resolveServiceIcon(service) {
  if (typeof service?.icon === 'function') return service.icon;
  const key = String(service?.iconKey || service?.icon || service?.slug || '').toLowerCase();
  return SERVICE_ICON_MAP[key] || CarFront;
}