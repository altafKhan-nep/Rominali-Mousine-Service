import { Plane, Briefcase, Gem, PartyPopper, Bus, MoonStar, Heart, School, Car } from 'lucide-react';

export const SERVICES = [
  {
    slug: 'airport',
    name: 'Airport Transfers',
    short: 'Airport',
    icon: Plane,
    tagline: 'BWI · Dulles · Reagan · Private Gates',
    summary:
      'Meticulous, door-to-door luxury transfers to and from BWI, Washington Dulles (IAD) and Reagan National (DCA). Your dedicated chauffeur monitors your flight in real time, adjusts gate pickups automatically and stands ready as you clear the arrival lounge — with complimentary wait time, no delay penalties, and fixed flat rates.',
    features: [
      'Live commercial flight tracking with automatic gate adjustment',
      'Complimentary terminal wait time & meet-and-greet arrivals',
      'No penalty charges for delayed arrivals',
      'Fixed flat rates — no surge pricing',
      'Ramp-side FBO / private aviation coordination',
    ],
  },
  {
    slug: 'corporate',
    name: 'Corporate Executive Travel',
    short: 'Corporate',
    icon: Briefcase,
    tagline: 'Priority scheduling for business professionals',
    summary:
      'Sophisticated corporate black-car solutions for executives, roadshows and high-frequency accounts. Your dedicated chauffeur stands ready exactly when you are — with priority scheduling, executive sedans and SUVs, and streamlined month-end billing through your corporate account portal.',
    features: [
      'Automated corporate billing portals',
      'Priority scheduling & immediate booking flexibility',
      'Executive sedans & luxury black SUVs',
      'High-frequency route pipelines & multi-city event support',
    ],
  },
  {
    slug: 'wedding',
    name: 'Weddings & Special Events',
    short: 'Weddings',
    icon: Gem,
    tagline: 'Wedding staging & gala execution',
    summary:
      'From beautiful wedding staging and champagne-ready arrivals to VIP red-carpet galas and sports hospitality events, we custom-build vehicle deployment flows so hosts and distinguished guests experience seamless, elegant transitions from ceremony to celebration.',
    features: [
      'Custom itineraries for the whole wedding party',
      'Champagne-ready luxury sedans, SUVs & Sprinters',
      'Red-carpet arrivals & VIP protocols',
      'Coordination across venues and timings',
    ],
  },
  {
    slug: 'prom',
    name: 'Prom & Celebrations',
    short: 'Proms',
    icon: PartyPopper,
    tagline: 'Style, safety and peace of mind',
    summary:
      'Celebrate in style with our immaculate luxury sedans and SUVs — perfect for an unforgettable prom night. Our background-checked, professionally trained chauffeurs ensure a safe, smooth ride so families can relax while teens arrive in elegance.',
    features: [
      'Safe, vetted chauffeurs in uniform',
      'On-time pickup and dropoff',
      'Immaculate, late-model vehicles',
      'Flexible group arrangements',
    ],
  },
  {
    slug: 'shuttle',
    name: 'Luxury Group Transportation',
    short: 'Groups',
    icon: Bus,
    tagline: 'Executive Sprinter & team logistics',
    summary:
      'High-capacity team logistics with Mercedes Executive Sprinters and premium SUVs, tailored for corporate offsites, roadshows, family holiday travel and group events. Extended rear-cargo configurations and custom routes keep every group moving on schedule.',
    features: [
      'Mercedes Executive Sprinter capacity',
      'Custom routes and recurring schedules',
      'High-capacity team logistics',
      'Live dispatch and tracking',
    ],
  },
  {
    slug: 'charter',
    name: 'Hourly & As-Directed Charters',
    short: 'Charter',
    icon: Bus,
    tagline: 'Total flexibility on your schedule',
    summary:
      'Retain complete command over a fluid schedule. With our premium hourly service your chauffeur remains on-site and instantly available for back-to-back corporate roadshows, sudden multi-destination updates, or executive meetings around town — unlimited stops, zero wait.',
    features: [
      'Dedicated personal chauffeur on-site',
      'Unlimited stops & multi-destination updates',
      'Route optimization by our coordinators',
      'Hourly block booking for events & roadshows',
    ],
  },
  {
    slug: 'night-out',
    name: 'Night Out',
    short: 'Night Out',
    icon: MoonStar,
    tagline: 'Birthdays, concerts & dinners',
    summary:
      'From birthday dinners to concerts and late-night celebrations, let our designated chauffeur handle the evening. Multi-stop itineraries, punctual pickups and returns, and a clean luxury vehicle ready whenever you are.',
    features: [
      'Designated-chauffeur convenience',
      'Multi-stop evening itineraries',
      'Punctual pickup and return',
      'Courteous, professional drivers',
    ],
  },
  {
    slug: 'funeral',
    name: 'Funeral & Memorial',
    short: 'Funerals',
    icon: Heart,
    tagline: 'Dignified, respectful service',
    summary:
      'Whether you are planning a private service or a large memorial, our team ensures every ride is handled with care. Sensitive, discreet chauffeurs provide dignified, reliable transportation during life’s most difficult moments, with processions coordinated to the last detail.',
    features: [
      'Sensitive, discreet chauffeurs',
      'Processions coordinated with your funeral home',
      'Family and guest transport options',
      'Quiet, dignified service',
    ],
  },
  {
    slug: 'school',
    name: 'School Transportation',
    short: 'Schools',
    icon: School,
    tagline: 'Safe daily routes & field trips',
    summary:
      'Romina Limousine Service provides safe, dependable transportation tailored for private schools. From daily AM and PM routes to field trips and special events, our professional drivers ensure students travel comfortably, securely and on schedule.',
    features: [
      'Daily routes and activity buses',
      'Background-checked, trained drivers',
      'GPS-monitored journeys',
      'Field trips and special events',
    ],
  },
  {
    slug: 'valet',
    name: 'Chauffeur & Valet Services',
    short: 'Valet',
    icon: Car,
    tagline: 'Seamless events, effortless arrival',
    summary:
      'Professional valet and styled-arrival services that elevate your gatherings. Uniformed attendants prioritize efficiency and courtesy, while our dispatch coordinators layer in VIP protocols and multi-vehicle staging for an effortless, sophisticated arrival.',
    features: [
      'Professional, uniformed attendants',
      'Efficient and courteous service',
      'VIP arrival protocols & multi-vehicle staging',
      'Scalable for events of any size',
    ],
  },
];

export const FEATURED_SERVICES = ['airport', 'corporate', 'charter', 'shuttle', 'wedding'];

export const getService = (slug) => SERVICES.find((s) => s.slug === slug);