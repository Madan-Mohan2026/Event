import type { EventItem } from '../types/event';

export const DUMMY_EVENTS: EventItem[] = [
  {
    id: 'evt-ai-summit-2026',
    slug: 'ai-innovation-summit-2026',
    title: 'AI Innovation Summit 2026',
    shortDescription: 'The definitive global conference on Generative AI, agentic systems, and enterprise intelligence deployment.',
    fullDescription: 'Join over 2,500 industry visionaries, AI researchers, and tech pioneers at the AI Innovation Summit 2026. Explore ground-breaking research in neural architectures, agentic workflows, autonomous robotics, and ethics in AI. Experience live interactive demos, technical keynotes, and deep-dive developer workshops.',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    date: '2026-10-15',
    formattedDate: 'October 15 - 17, 2026',
    time: '09:00 AM - 05:30 PM EST',
    venue: 'Metropolitan Tech Center & Expo Hall',
    address: '450 Innovation Boulevard, Silicon Valley, CA',
    category: 'AI & Tech',
    status: 'upcoming',
    isFeatured: true,
    price: 'Free Online / $149 In-Person',
    capacity: 3000,
    registeredCount: 2180,
    highlights: [
      'Keynotes from top global AI researchers and tech CEOs',
      'Hands-on Agentic AI and Large Model deployment workshops',
      'Startup pitch battle with $250K in non-dilutive seed grants',
      'Interactive Expo Floor featuring 80+ AI hardware and software demos',
      'Dedicated executive networking lounges and B2B matchmaking'
    ],
    contactEmail: 'summit@smartreg.io',
    contactPhone: '+1 (800) 555-0199',
    tags: ['Artificial Intelligence', 'LLMs', 'Neural Networks', 'Agentic Workflows'],
    speakers: [
      {
        id: 'spk-1',
        name: 'Dr. Elena Rostova',
        title: 'Chief Scientist & VP of AI Systems',
        organization: 'Aether Technologies',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        bio: 'Pioneer in multimodal foundation models and autonomous multi-agent reasoning.',
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      },
      {
        id: 'spk-2',
        name: 'Marcus Vance',
        title: 'Director of AI Ethics & Safety',
        organization: 'Global AI Institute',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Leading thinker on safe artificial general intelligence and regulatory frameworks.',
        linkedin: 'https://linkedin.com'
      },
      {
        id: 'spk-3',
        name: 'Devon Wright',
        title: 'Head of Enterprise Compute',
        organization: 'NextGen Silicon',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        bio: 'Specialist in next-gen TPU clusters and low-latency edge inference.',
        twitter: 'https://twitter.com'
      }
    ],
    schedule: [
      {
        id: 'sch-1',
        time: '09:00 AM - 10:00 AM',
        title: 'Registration & Welcome Coffee',
        description: 'Check in via Smart QR kiosks, collect digital delegate badges and networking kits.',
        room: 'Main Atrium'
      },
      {
        id: 'sch-2',
        time: '10:00 AM - 11:30 AM',
        title: 'Opening Keynote: Next Generation Agentic Workflows',
        description: 'How autonomous agents are transforming enterprise operations, creative engineering, and scientific discovery.',
        speakerName: 'Dr. Elena Rostova',
        room: 'Grand Auditorium'
      },
      {
        id: 'sch-3',
        time: '11:45 AM - 01:00 PM',
        title: 'Panel: Aligning AI Safety with Rapid Enterprise Deployment',
        description: 'Strategies for governance, hallucination mitigation, and data privacy compliance.',
        speakerName: 'Marcus Vance & Panelists',
        room: 'Hall B'
      },
      {
        id: 'sch-4',
        time: '02:00 PM - 04:00 PM',
        title: 'Workshop: Fine-Tuning Open Source LLMs for Specialized Domains',
        description: 'Interactive coding lab covering LoRA, QLoRA, and custom tokenizers.',
        speakerName: 'Devon Wright',
        room: 'Tech Lab 1'
      }
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'Who should attend the AI Innovation Summit?',
        answer: 'The summit is designed for CTOs, AI leads, software engineers, product leaders, researchers, and tech founders looking to master enterprise AI deployment.'
      },
      {
        id: 'faq-2',
        question: 'How do I access my digital entry ticket?',
        answer: 'Upon completing registration, a Smart QR ticket pass will be generated instantly. You can save it to your phone or download it for contactless venue entry.'
      },
      {
        id: 'faq-3',
        question: 'Are session recordings provided after the event?',
        answer: 'Yes, all registered attendees receive full video recordings, slide decks, and code repositories within 48 hours of event conclusion.'
      }
    ]
  },
  {
    id: 'evt-startup-meetup',
    slug: 'startup-networking-meetup',
    title: 'Startup Networking Meetup',
    shortDescription: 'Connect with seed investors, founders, accelerators, and tech talent shaping the future startup ecosystem.',
    fullDescription: 'The Startup Networking Meetup brings together early-stage founders, angel investors, venture capitalists, and ecosystem builders. Featuring elevator pitches, founder roundtables, and speed networking sessions designed to unlock funding and strategic partnerships.',
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    date: '2026-08-25',
    formattedDate: 'August 25, 2026',
    time: '04:00 PM - 08:30 PM EST',
    venue: 'Venture Hub Lounge',
    address: '100 Founders Row, Suite 400, Austin, TX',
    category: 'Startup & Innovation',
    status: 'ongoing',
    isFeatured: true,
    price: 'Free Registration',
    capacity: 500,
    registeredCount: 480,
    highlights: [
      'Speed networking format connecting 100+ founders with investors',
      '5-minute pitch feedback sessions from tier-1 VC partners',
      'Co-founder matching wall for tech and business executives',
      'Complimentary evening drinks, appetizers, and music'
    ],
    contactEmail: 'meetup@smartreg.io',
    contactPhone: '+1 (800) 555-0144',
    tags: ['Venture Capital', 'Pitching', 'Networking', 'Angel Investors'],
    speakers: [
      {
        id: 'spk-4',
        name: 'Sarah Chen',
        title: 'Managing Partner',
        organization: 'Apex Seed Ventures',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        bio: 'Investor in over 40 high-growth B2B SaaS and AI startups.'
      },
      {
        id: 'spk-5',
        name: 'Alexander Ross',
        title: 'Serial Founder & Ecosystem Lead',
        organization: 'LaunchPad Global',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        bio: 'Built and scaled 3 venture-backed startups with 2 successful exits.'
      }
    ],
    schedule: [
      {
        id: 'sch-5',
        time: '04:00 PM - 05:00 PM',
        title: 'Doors Open & Open Networking',
        description: 'Check in via Smart QR code and grab name badges with founder/investor color codes.',
        room: 'Rooftop Terrace'
      },
      {
        id: 'sch-6',
        time: '05:00 PM - 06:15 PM',
        title: 'Fireside Chat: From 0 to $10M ARR in 18 Months',
        description: 'Unfiltered lessons on product-market fit, outbound sales, and investor pitch decks.',
        speakerName: 'Sarah Chen & Alexander Ross',
        room: 'Main Stage'
      },
      {
        id: 'sch-7',
        time: '06:30 PM - 08:30 PM',
        title: 'Curated Founder-Investor Speed Dating',
        description: 'Structured 8-minute high-impact networking tables.',
        room: 'Lounge Area'
      }
    ],
    faqs: [
      {
        id: 'faq-4',
        question: 'Is pitch deck submission required prior to attending?',
        answer: 'Pitch deck submission is optional, but recommended if you wish to participate in the VC feedback tables.'
      }
    ]
  },
  {
    id: 'evt-smart-cities',
    slug: 'smart-cities-conference-2026',
    title: 'Smart Cities Conference 2026',
    shortDescription: 'Unlocking intelligent urban infrastructure, IoT mobility, clean grids, and citizen-first governance.',
    fullDescription: 'The Smart Cities Conference gathers urban planners, municipal leaders, IoT innovators, and infrastructure experts. Delve into autonomous transit networks, smart grid energy management, digital twin urban modeling, and public safety tech.',
    bannerUrl: 'https://images.unsplash.com/photo-1477959858617-67f30ac72604?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-10',
    formattedDate: 'November 10 - 12, 2026',
    time: '08:30 AM - 05:00 PM EST',
    venue: 'Civic Innovation Center',
    address: '750 Urban Way, Chicago, IL',
    category: 'Smart Cities',
    status: 'upcoming',
    isFeatured: true,
    price: '$199 Delegate Pass',
    capacity: 1500,
    registeredCount: 920,
    highlights: [
      'Case studies from 20+ pioneering smart cities worldwide',
      'Exhibition of IoT sensors, EV charging networks, and traffic automation',
      'Roundtable discussions on data privacy in municipal sensor networks',
      'VIP Mayor & City Administrator Summit'
    ],
    contactEmail: 'cities@smartreg.io',
    contactPhone: '+1 (800) 555-0188',
    tags: ['Smart Grid', 'Urban IoT', 'Autonomous Mobility', 'Green Infra'],
    speakers: [
      {
        id: 'spk-6',
        name: 'Klaus Meyer',
        title: 'Chief Technology Officer',
        organization: 'Urban Digital Systems',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
        bio: 'Leader in municipal digital twin deployments across Europe and North America.'
      }
    ],
    schedule: [
      {
        id: 'sch-8',
        time: '09:00 AM - 10:30 AM',
        title: 'Keynote: Urban Mobility in the Autonomous Era',
        description: 'Integrating shared autonomous shuttles into existing public transport systems.',
        speakerName: 'Klaus Meyer',
        room: 'Auditorium A'
      }
    ],
    faqs: [
      {
        id: 'faq-5',
        question: 'Can government officials request complimentary access?',
        answer: 'Yes, verified municipal and federal representatives are eligible for free full-access delegate passes.'
      }
    ]
  },
  {
    id: 'evt-women-expo',
    slug: 'women-entrepreneurs-expo',
    title: 'Women Entrepreneurs Expo',
    shortDescription: 'Empowering women founders, leaders, and innovators with capital, mentorship, and growth strategies.',
    fullDescription: 'The Women Entrepreneurs Expo is a premier gathering focused on amplifying female leadership in technology, commerce, health tech, and sustainability. Discover inspirational keynotes, funding pitch sessions, tactical scaling workshops, and mentor office hours.',
    bannerUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    date: '2026-09-08',
    formattedDate: 'September 08 - 09, 2026',
    time: '09:00 AM - 04:30 PM EST',
    venue: 'Empowerment Hall & Center',
    address: '320 Visionary Drive, Boston, MA',
    category: 'Women Entrepreneurs',
    status: 'upcoming',
    isFeatured: false,
    price: 'Free Registration',
    capacity: 2000,
    registeredCount: 1650,
    highlights: [
      '1-on-1 VC office hours with top female investors',
      'Pitch competition featuring $100K pitch awards',
      'Executive leadership panels on fundraising & board dynamics',
      'Interactive product expo hall with 60 female-led brands'
    ],
    contactEmail: 'womenexpo@smartreg.io',
    contactPhone: '+1 (800) 555-0122',
    tags: ['Female Founders', 'Leadership', 'Venture Funding', 'Mentorship'],
    speakers: [
      {
        id: 'spk-7',
        name: 'Aisha Thorne',
        title: 'Founder & Managing Director',
        organization: 'Vanguard Female Fund',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        bio: 'Pioneer advocate for diverse capitalization in tech and healthcare innovation.'
      }
    ],
    schedule: [
      {
        id: 'sch-9',
        time: '10:00 AM - 11:30 AM',
        title: 'Opening Panel: Overcoming Capital Barriers in Tech Venture',
        description: 'Tactical advice on securing institutional Series A and venture debt.',
        speakerName: 'Aisha Thorne & Leaders',
        room: 'Main Hall'
      }
    ],
    faqs: [
      {
        id: 'faq-6',
        question: 'Is the expo open to allies and all genders?',
        answer: 'Absolutely! The expo welcomes everyone passionate about supporting diversity, equity, and entrepreneurship.'
      }
    ]
  },
  {
    id: 'evt-future-tech',
    slug: 'future-technology-summit',
    title: 'Future Technology Summit',
    shortDescription: 'Exploring quantum computing, spatial web, bio-tech synthesis, and next-generation connectivity.',
    fullDescription: 'Step into tomorrow at the Future Technology Summit. Immerse yourself in quantum algorithm breakthroughs, spatial computing experiences, synthetic biology, and 6G network architectures.',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    date: '2026-12-01',
    formattedDate: 'December 01 - 03, 2026',
    time: '09:00 AM - 06:00 PM EST',
    venue: 'Pioneer World Science Center',
    address: '888 Horizon Avenue, Seattle, WA',
    category: 'AI & Tech',
    status: 'upcoming',
    isFeatured: true,
    price: '$249 Pass',
    capacity: 2200,
    registeredCount: 1100,
    highlights: [
      'Live Quantum hardware demonstration',
      'Spatial Web & Mixed Reality immersion dome',
      'Bio-Tech synthetic biology showcase',
      'Developer hackathon with $50K prize pool'
    ],
    contactEmail: 'futuretech@smartreg.io',
    contactPhone: '+1 (800) 555-0177',
    tags: ['Quantum Computing', '6G', 'Spatial Web', 'Synthetic Bio'],
    speakers: [
      {
        id: 'spk-8',
        name: 'Prof. David Liang',
        title: 'Head of Quantum Architectures',
        organization: 'Quantum Core Labs',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        bio: 'Leading researcher in fault-tolerant qubit coherence and quantum error mitigation.'
      }
    ],
    schedule: [
      {
        id: 'sch-10',
        time: '09:30 AM - 11:00 AM',
        title: 'Keynote: Commercializing Quantum Advantage by 2028',
        description: 'Understanding real-world quantum speedups in chemistry, finance, and cryptography.',
        speakerName: 'Prof. David Liang',
        room: 'Dome Cinema'
      }
    ],
    faqs: [
      {
        id: 'faq-7',
        question: 'Are student discounts available?',
        answer: 'Yes! Full-time students receive an 80% discount with valid university ID verification.'
      }
    ]
  },
  {
    id: 'evt-digital-transformation',
    slug: 'digital-transformation-conference',
    title: 'Digital Transformation Conference',
    shortDescription: 'Modernizing legacy architectures, Cloud-native migration, DevOps culture, and Enterprise Agility.',
    fullDescription: 'Discover how global Fortune 500 enterprises navigate digital transformation. Learn strategies for cloud migration, modern microservices architectures, security automation, and data modernization.',
    bannerUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    date: '2026-06-12',
    formattedDate: 'June 12, 2026',
    time: '09:00 AM - 05:00 PM EST',
    venue: 'International Trade & Tech Center',
    address: '500 Commerce Way, New York, NY',
    category: 'Digital Transformation',
    status: 'completed',
    isFeatured: false,
    price: 'Completed Event',
    capacity: 1800,
    registeredCount: 1800,
    highlights: [
      'Detailed case studies on cloud-native migrations',
      'Zero-trust cybersecurity defense paradigms',
      'Data lakehouse architectures and real-time telemetry',
      'On-demand video playback available for all registrants'
    ],
    contactEmail: 'digital@smartreg.io',
    contactPhone: '+1 (800) 555-0133',
    tags: ['Cloud Native', 'DevOps', 'Zero Trust', 'Microservices'],
    speakers: [
      {
        id: 'spk-9',
        name: 'Rachel Adams',
        title: 'Chief Information Officer',
        organization: 'Apex Global Financial',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
        bio: 'Led the digital cloud migration of banking infrastructure supporting 10M active users.'
      }
    ],
    schedule: [
      {
        id: 'sch-11',
        time: '10:00 AM - 11:30 AM',
        title: 'Legacy Modernization Without Downtime',
        description: 'Strangler fig pattern and API gateway strategies in high-compliance financial systems.',
        speakerName: 'Rachel Adams',
        room: 'Grand Ballroom'
      }
    ],
    faqs: [
      {
        id: 'faq-8',
        question: 'Can I access the recorded presentations from this completed event?',
        answer: 'Yes! Registration gives immediate access to the slide archives and HD video recordings.'
      }
    ]
  },
  {
    id: 'evt-green-energy',
    slug: 'green-energy-expo',
    title: 'Green Energy & Sustainability Expo',
    shortDescription: 'Accelerating net-zero transitions, solar innovations, battery technology, and hydrogen mobility.',
    fullDescription: 'The Green Energy Expo highlights high-impact solutions tackling the climate crisis. Featuring solar efficiency advancements, grid-scale energy storage systems, green hydrogen supply chains, and ESG corporate strategies.',
    bannerUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    date: '2026-10-28',
    formattedDate: 'October 28 - 30, 2026',
    time: '09:00 AM - 05:00 PM EST',
    venue: 'EcoWorld Convention Complex',
    address: '100 Sustainability Drive, Denver, CO',
    category: 'Green Energy',
    status: 'upcoming',
    isFeatured: false,
    price: 'Free Online Pass / $99 On-Site',
    capacity: 2500,
    registeredCount: 1420,
    highlights: [
      '120+ clean tech companies exhibiting NextGen solar & wind technology',
      'Hydrogen fuel-cell vehicle test track',
      'ESG carbon reporting & compliance workshops',
      'Green venture funding pitch arena'
    ],
    contactEmail: 'green@smartreg.io',
    contactPhone: '+1 (800) 555-0166',
    tags: ['Solar Energy', 'CleanTech', 'Hydrogen Power', 'Net-Zero'],
    speakers: [
      {
        id: 'spk-10',
        name: 'Dr. Henrik Lindqvist',
        title: 'VP of Clean Grid Innovation',
        organization: 'Nordic Renewable Power',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        bio: 'Pioneer in offshore wind integration and high-voltage DC transmission networks.'
      }
    ],
    schedule: [
      {
        id: 'sch-12',
        time: '09:30 AM - 11:00 AM',
        title: 'Building Resilient 100% Renewable Microgrids',
        description: 'Battery storage management, virtual power plants, and grid balancing.',
        speakerName: 'Dr. Henrik Lindqvist',
        room: 'Green Stage'
      }
    ],
    faqs: [
      {
        id: 'faq-9',
        question: 'Is virtual participation supported?',
        answer: 'Yes, virtual attendees receive full interactive access to live keynotes and virtual booth chats.'
      }
    ]
  },
  {
    id: 'evt-innovation-leadership',
    slug: 'innovation-leadership-forum',
    title: 'Innovation Leadership Forum',
    shortDescription: 'High-level summit for C-suite executives, directors, and strategists steering transformational change.',
    fullDescription: 'An exclusive executive summit focused on culture transformation, agile leadership, disruptive strategy, and AI organizational design. Exchange playbooks with top global leaders facing complex market shifts.',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    date: '2026-05-18',
    formattedDate: 'May 18, 2026',
    time: '08:30 AM - 04:30 PM EST',
    venue: 'Grand Executive Pavilion',
    address: '1 Executive Plaza, Washington, DC',
    category: 'Leadership',
    status: 'completed',
    isFeatured: false,
    price: 'Completed Event',
    capacity: 400,
    registeredCount: 400,
    highlights: [
      'Closed-door Chatham House rule roundtable sessions',
      'Case studies on organizational agility in global enterprises',
      'Exclusive executive networking dinner & awards ceremony'
    ],
    contactEmail: 'leadership@smartreg.io',
    contactPhone: '+1 (800) 555-0111',
    tags: ['Leadership', 'C-Suite', 'Strategy', 'Organizational Culture'],
    speakers: [
      {
        id: 'spk-11',
        name: 'Victoria Sterling',
        title: 'Executive Coach & Author',
        organization: 'Sterling Advisory Group',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        bio: 'Advisor to Fortune 100 CEOs on disruptive strategy and leadership resilience.'
      }
    ],
    schedule: [
      {
        id: 'sch-13',
        time: '09:00 AM - 10:30 AM',
        title: 'Leading Through Disruption: The Mindset of High-Growth Leaders',
        description: 'Cultivating psychological safety and fast execution speed in turbulent markets.',
        speakerName: 'Victoria Sterling',
        room: 'Executive Boardroom'
      }
    ],
    faqs: [
      {
        id: 'faq-10',
        question: 'Will there be future editions of the Leadership Forum?',
        answer: 'Yes, the next executive edition is scheduled for early 2027. Sign up for updates to receive an advance invitation.'
      }
    ]
  }
];

export const PLATFORM_STATS = [
  { label: 'Events Managed', value: '150+' },
  { label: 'Registered Delegates', value: '50,000+' },
  { label: 'QR Check-in Speed', value: '< 2 Secs' },
  { label: 'System Uptime', value: '99.99%' },
];

export const PLATFORM_FEATURES = [
  {
    iconName: 'UserCheck',
    title: 'Easy Online Registration',
    description: 'Frictionless, intuitive registration flows designed for maximum conversion across desktop and mobile devices.'
  },
  {
    iconName: 'ShieldCheck',
    title: 'Secure Registration Process',
    description: 'Bank-grade encryption, privacy compliance, and tamper-proof ticket token generation for all attendee data.'
  },
  {
    iconName: 'QrCode',
    title: 'QR-Based Entry',
    description: 'Instant contactless check-in with dynamic scannable QR passes generated upon registration completion.'
  },
  {
    iconName: 'Zap',
    title: 'Real-Time Updates',
    description: 'Automated SMS, email, and live status updates for schedule modifications, venue changes, and speaker alerts.'
  },
  {
    iconName: 'LayoutDashboard',
    title: 'Digital Event Management',
    description: 'Centralized control room for organizers to monitor capacity, track check-ins, and publish live event agenda tracks.'
  },
  {
    iconName: 'Clock',
    title: 'Fast Check-in Experience',
    description: 'Zero queue delays at event venues with rapid kiosk scanning and automated badge printing compatibility.'
  }
];
