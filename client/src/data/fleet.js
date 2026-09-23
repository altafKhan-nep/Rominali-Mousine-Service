// Marketing fleet cards (shown on /fleet). Kept in their own data file so the
// admin "Website" content editor can reuse the exact same defaults.
// `id` stays stable as the CMS merge key. Images are public paths / URLs.
export const FLEET = [
  {
    id: 'executive-sedan',
    img: '/images/executive-sedan.jpg',
    name: 'Executive Sedan',
    tag: 'First Class',
    passengers: '3 Passengers',
    luggage: '3 Luggages',
    perks: ['Free Wi-Fi', 'Climate Zone'],
    tagline: 'Mercedes-Benz S-Class standard of comfort',
    features: ['Mercedes-Benz S-Class configuration', 'Climate-controlled zones', 'Complimentary bottled water', 'Professional chauffeur in uniform'],
  },
  {
    id: 'premium-suv',
    img: '/images/premium-suv.jpg',
    name: 'Cadillac Escalade Platinum Luxury ESV',
    tag: 'Platinum Luxury SUV',
    passengers: '6 Passengers',
    luggage: '6 Luggages',
    perks: ['Onboard Wi-Fi', 'Refreshments'],
    tagline: 'The pinnacle of chauffeur-driven comfort',
    features: ['Platinum luxury ESV, 1–6 passengers', 'Spacious for corporate luggage', 'Climate controlled with water', 'Elite safety standards', 'Perfect for executive & diplomatic missions'],
  },
  {
    id: 'van',
    img: '/images/van.jpg',
    name: 'Mercedes Executive Sprinter',
    tag: 'Group Travel',
    passengers: '14 Passengers',
    luggage: '14 Luggages',
    perks: ['USB Outlets', 'Media System'],
    tagline: 'High-occupancy executive group travel',
    features: ['Seats up to 14 with luggage capacity', 'USB outlets throughout', 'Onboard media system', 'Extended rear cargo configuration', 'Professional chauffeur in uniform'],
  },
];