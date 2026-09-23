import { Car, CarFront, Bus } from 'lucide-react';

// Fleet vehicle types shared across booking, tracking, history, and admin.
// Keep ids stable — they are stored on Ride/User and used for driver matching.
export const VEHICLES = [
  { id: 'executive-sedan', label: 'Executive Sedan', desc: 'Up to 4 riders', icon: Car },
  { id: 'economy-sedan', label: 'Luxury Sedan', desc: 'Up to 4 riders', icon: Car },
  { id: 'economy-suv', label: 'Premium SUV', desc: 'Up to 6 riders', icon: CarFront },
  { id: 'premium-suv', label: 'Executive SUV', desc: 'Up to 6 riders', icon: CarFront },
  { id: 'luxury-suv', label: 'Cadillac Escalade ESV', desc: 'Up to 7 riders', icon: CarFront },
  { id: 'van', label: 'Executive Sprinter Van', desc: 'Up to 14 riders', icon: Bus },
  { id: 'mini-coach', label: 'Mini-Coach', desc: 'Up to 32 riders', icon: Bus },
  { id: 'school-bus', label: 'School Bus', desc: 'Up to 48 riders', icon: Bus },
  { id: 'motorcoach', label: 'Motorcoach', desc: 'Up to 56 riders', icon: Bus },
];

export const vehicleLabel = (id) =>
  VEHICLES.find((v) => v.id === id)?.label || (id || '').replace(/-/g, ' ');