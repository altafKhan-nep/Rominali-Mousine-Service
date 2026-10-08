// Marketing fleet cards (shown on /fleet). Kept in their own data file so the
// admin "Website" content editor can reuse the exact same defaults.
// `id` stays stable as the CMS merge key. Images are public paths / URLs.
export const FLEET = [
  {
    id: 'executive-sedan',
    img: '/images/executive-sedan.jpg',
    name: 'Executive Sedan',
    tag: 'First Class',
    passengers: 'Comfortable seating',
    luggage: 'Ample cargo',
    perks: ['Free Wi-Fi', 'Climate Zone'],
    tagline: 'Mercedes-Benz S-Class standard of comfort',
    features: ['Mercedes-Benz S-Class configuration', 'Climate-controlled zones', 'Complimentary bottled water', 'Professional chauffeur in uniform'],
  },
  {
    id: 'premium-suv',
    img: '/images/premium-suv.jpg',
    name: 'Cadillac Escalade Platinum Luxury ESV',
    tag: 'Platinum Luxury SUV',
    passengers: 'Spacious seating',
    luggage: 'Ample cargo',
    perks: ['Onboard Wi-Fi', 'Refreshments'],
    tagline: 'The pinnacle of chauffeur-driven comfort',
    features: ['Platinum luxury ESV configuration', 'Spacious for corporate luggage', 'Climate controlled with water', 'Elite safety standards', 'Perfect for executive & diplomatic missions'],
  },
  {
    id: 'van',
    img: '/images/van.jpg',
    name: 'Mercedes Executive Sprinter',
    tag: 'Group Travel',
    passengers: 'Group seating',
    luggage: 'Generous cargo',
    perks: ['USB Outlets', 'Media System'],
    tagline: 'High-occupancy executive group travel',
    features: ['High-occupancy seating with luggage capacity', 'USB outlets throughout', 'Onboard media system', 'Extended rear cargo configuration', 'Professional chauffeur in uniform'],
  },
];