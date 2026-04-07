import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/suggest-images?q=Aruba+beach+Caribbean&destination=Aruba
 *
 * Estrategia de búsqueda en capas para obtener fotos de viaje relevantes:
 * 1. Query principal: destination + "beach travel" (o el searchQuery completo del AI)
 * 2. Si faltan fotos, segunda búsqueda con destination + "tourism landscape"
 * 3. Sin filtro orientation — landscape se recorta bien con CSS object-cover
 */
// ── Landmark keywords por destino ────────────────────────────────────────────
// Queries específicas con nombres de lugares tal como los etiquetan los fotógrafos
// en Unsplash/Pexels — cuanto más específico el landmark, mejor la foto.
const DESTINATION_BOOST: Record<string, string> = {

  // ── ARGENTINA ──────────────────────────────────────────────────────────────
  'bariloche':             'Lago Nahuel Huapi cerro Catedral Patagonia snow mountains',
  'villa la angostura':    'Patagonia lake forest Victoria Island Argentina',
  'san martin de los andes':'Lago Lacar Patagonia mountains Argentina',
  'ushuaia':               'Tierra del Fuego Beagle Channel end of world Martial glacier',
  'el calafate':           'Perito Moreno glacier Patagonia blue ice Argentina',
  'el chalten':            'Fitz Roy Patagonia trekking granite peaks Argentina',
  'mendoza':               'Andes mountains vineyard wine Aconcagua Argentina',
  'salta':                 'Quebrada Humahuaca colorful hills colonial Argentina northwest',
  'iguazu':                'Cataratas Iguazu waterfalls jungle Argentina Garganta del Diablo',
  'cordoba':               'Sierras Córdoba Argentina colonial city Cabildo',
  'mar del plata':         'Mar del Plata beach Argentina Atlantic coast Casino',
  'mardel plata':          'Mar del Plata beach Argentina Atlantic coast Casino',
  'buenos aires':          'Obelisco Caminito La Boca Puerto Madero Buenos Aires',
  'tigre':                 'Tigre Delta Argentina waterways rowing club',
  'puerto madryn':         'Peninsula Valdes whales Patagonia Argentina',
  'rosario':               'Monumento Bandera Rosario Argentina Paraná river',

  // ── URUGUAY ────────────────────────────────────────────────────────────────
  'punta del este':        'Punta del Este beach peninsula lighthouse La Mano sculpture',
  'montevideo':            'Rambla Montevideo Ciudad Vieja Palacio Salvo mercado del puerto',
  'colonia del sacramento':'Colonia del Sacramento historic quarter cobblestone Uruguay',

  // ── BRASIL ─────────────────────────────────────────────────────────────────
  'rio de janeiro':        'Christ the Redeemer Sugarloaf Mountain Copacabana Ipanema beach',
  'buzios':                'Buzios Brazil peninsula beaches Rua das Pedras',
  'florianopolis':         'Florianopolis Lagoa da Conceição beach Brazil island',
  'sao paulo':             'São Paulo Paulista Avenue Ibirapuera Park Batman Alley',
  'foz do iguacu':         'Iguazu Falls waterfalls Brazil jungle rainbow',
  'salvador':              'Salvador Bahia Pelourinho colonial colorful Brazil',
  'natal':                 'Natal Brazil dunes Genipabu beach northeast',
  'fortaleza':             'Fortaleza beach Ceará Brazil Cumbuco dunes',
  'fernando de noronha':   'Fernando de Noronha beach Brazil turquoise dolphins UNESCO',

  // ── PERÚ ──────────────────────────────────────────────────────────────────
  'machu picchu':          'Machu Picchu citadel Huayna Picchu Inca Trail Sun Gate mist',
  'cusco':                 'Cusco Plaza de Armas Sacsayhuamán Qorikancha Inca Peru',
  'lima':                  'Lima Miraflores coastline Barranco bridge Larco Museum',

  // ── COLOMBIA ──────────────────────────────────────────────────────────────
  'cartagena':             'Cartagena walled city Castillo San Felipe colorful houses Colombia Caribbean',
  'medellin':              'Medellín Comuna 13 cable car Plaza Botero Colombia',
  'bogota':                'Bogotá La Candelaria Monserrate Gold Museum Colombia',
  'santa marta':           'Tayrona National Park Caribbean coast Colombia jungle beach',

  // ── MEXICO ────────────────────────────────────────────────────────────────
  'cancun':                'Cancun Hotel Zone Playa Delfines turquoise Caribbean Mexico',
  'tulum':                 'Tulum ruins Caribbean coast cenote Mexico jungle beach',
  'playa del carmen':      'Playa del Carmen 5th Avenue Caribbean beach Mexico',
  'mexico city':           'Mexico City Zocalo Palacio Bellas Artes Teotihuacan',
  'ciudad de mexico':      'Mexico City Zocalo Palacio Bellas Artes Teotihuacan',
  'guadalajara':           'Guadalajara Jalisco Mexico Cathedral tequila',
  'los cabos':             'Los Cabos Arch El Arco Baja California Mexico desert ocean',
  'puerto vallarta':       'Puerto Vallarta Malecon Pacific Mexico beach',
  'oaxaca':                'Oaxaca colonial Mexico Monte Alban archaeological',

  // ── CARIBE ────────────────────────────────────────────────────────────────
  'punta cana':            'Punta Cana Bávaro Beach palm trees turquoise Caribbean Dominican Republic',
  'aruba':                 'Aruba Eagle Beach California Lighthouse turquoise sea oranjestad',
  'cuba':                  'Havana Malecón Old Havana classic cars Capitolio Cuba',
  'habana':                'Havana Malecón Old Havana classic cars Capitolio Cuba',
  'la habana':             'Havana Malecón Old Havana classic cars Capitolio Cuba',
  'jamaica':               'Jamaica Seven Mile Beach Dunn River Falls Blue Mountains',
  'bahamas':               'Bahamas Atlantis Nassau turquoise water pig beach',
  'puerto rico':           'Old San Juan El Morro Fortress colorful houses Puerto Rico',
  'saint lucia':           'Saint Lucia Pitons volcanic mountains Sugar Beach',
  'barbados':              'Barbados Crane Beach Harrison Cave Bathsheba coast',

  // ── ESTADOS UNIDOS ────────────────────────────────────────────────────────
  'new york':              'New York City Times Square Brooklyn Bridge Manhattan skyline Statue of Liberty',
  'nueva york':            'New York City Times Square Brooklyn Bridge Manhattan skyline Statue of Liberty',
  'los angeles':           'Los Angeles Hollywood Sign Santa Monica Pier Griffith Observatory',
  'las vegas':             'Las Vegas Strip Bellagio Fountains Fremont Street neon night',
  'miami':                 'Miami South Beach Art Deco Wynwood Walls Biscayne Bay',
  'san francisco':         'San Francisco Golden Gate Bridge Lombard Street Alcatraz Painted Ladies',
  'orlando':               'Orlando Walt Disney World Magic Kingdom Castle Universal Studios',
  'chicago':               'Chicago Millennium Park Cloud Gate skyline Navy Pier Riverwalk',
  'washington':            'Washington DC Lincoln Memorial Capitol Building White House',
  'new orleans':           'New Orleans French Quarter Bourbon Street St Louis Cathedral',
  'grand canyon':          'Grand Canyon South Rim Colorado River Horseshoe Bend desert',
  'hawaii':                'Hawaii Waikiki Beach Napali Coast volcanic Maui Hana',
  'alaska':                'Alaska Denali glacier fjord northern lights wilderness',

  // ── EUROPA OCCIDENTAL ─────────────────────────────────────────────────────
  'paris':                 'Eiffel Tower Louvre Arc de Triomphe Montmartre Seine river Paris',
  'roma':                  'Colosseum Roman Forum Trevi Fountain Vatican Sistine Chapel Rome',
  'rome':                  'Colosseum Roman Forum Trevi Fountain Vatican Sistine Chapel',
  'barcelona':             'Sagrada Familia Park Güell La Rambla Gothic Quarter Barceloneta',
  'madrid':                'Madrid Prado Museum Retiro Park Puerta del Sol Royal Palace',
  'sevilla':               'Sevilla Giralda Cathedral Alcázar Flamenco Spain Andalucia',
  'granada':               'Granada Alhambra Generalife Sacromonte Albaicín Spain',
  'valencia':              'Valencia City of Arts Sciences Paella beach Spain Mediterranean',
  'london':                'London Big Ben Tower Bridge London Eye Buckingham Palace Westminster',
  'amsterdam':             'Amsterdam canals Rijksmuseum Dam Square bicycles Anne Frank House',
  'venice':                'Venice Grand Canal Rialto Bridge St Mark Square gondolas Doge Palace',
  'florence':              'Florence Duomo Ponte Vecchio Piazzale Michelangelo Uffizi Tuscany',
  'milan':                 'Milan Duomo Galleria Vittorio Emanuele La Scala Sforza Castle',
  'prague':                'Prague Charles Bridge Prague Castle Old Town Square Astronomical Clock',
  'santorini':             'Santorini Oia blue domes caldera white houses sunset Aegean',
  'athens':                'Athens Acropolis Parthenon Plaka Monastiraki ancient Greece',
  'mykonos':               'Mykonos windmills Little Venice Chora whitewashed Greece Aegean',
  'berlin':                'Berlin Brandenburg Gate Reichstag Berlin Wall East Side Gallery Museum Island',
  'vienna':                'Vienna Schönbrunn Palace Stephansdom Opera House Ringstrasse Austria',
  'budapest':              'Budapest Parliament Buda Castle Chain Bridge Fisherman Bastion Danube',
  'lisbon':                'Lisbon Belém Tower Jerónimos tram 28 Alfama Sintra Portugal',
  'porto':                 'Porto Dom Luis Bridge Ribeira Azulejos wine cellars Douro Portugal',
  'dublin':                'Dublin Temple Bar Trinity College Book of Kells Cliffs of Moher',
  'edinburgh':             'Edinburgh Castle Royal Mile Arthur Seat Scottish Highlands',
  'copenhagen':            'Copenhagen Nyhavn colorful harbor Little Mermaid Tivoli Denmark',
  'stockholm':             'Stockholm Gamla Stan city hall archipelago Vasa Museum Sweden',
  'dubrovnik':             'Dubrovnik old city walls Adriatic Sea Game of Thrones Croatia',
  'split':                 'Split Diocletian Palace Adriatic Croatia Hvar island',
  'moscow':                'Moscow Red Square St Basil Cathedral Kremlin Russia',
  'st petersburg':         'Saint Petersburg Hermitage Nevsky Prospekt canals Peterhof Russia',
  'zurich':                'Zurich Lake Zurich old town Alps Switzerland',
  'interlaken':            'Interlaken Jungfrau Alps Switzerland mountains Eiger paragliding',

  // ── TURQUÍA ────────────────────────────────────────────────────────────────
  'istanbul':              'Istanbul Blue Mosque Hagia Sophia Bosphorus Grand Bazaar Topkapi',
  'capadocia':             'Cappadocia hot air balloons fairy chimneys Göreme cave houses Turkey',
  'cappadocia':            'Cappadocia hot air balloons fairy chimneys Göreme cave houses Turkey',
  'estambul':              'Istanbul Blue Mosque Hagia Sophia Bosphorus Grand Bazaar Topkapi',
  'antalya':               'Antalya Turkey Mediterranean turquoise coast old town harbor',
  'bodrum':                'Bodrum Turkey Aegean coast Castle St Peter yacht harbor',
  'pamukkale':             'Pamukkale travertine terraces Hierapolis thermal pools Turkey white',

  // ── EGIPTO ─────────────────────────────────────────────────────────────────
  'cairo':                 'Cairo Pyramids Giza Sphinx Great Pyramid desert Egypt',
  'el cairo':              'Cairo Pyramids Giza Sphinx Great Pyramid desert Egypt',
  'luxor':                 'Luxor Valley of the Kings Karnak Temple Egypt Nile ancient',
  'aswan':                 'Aswan Abu Simbel Nile felucca Nubian Egypt',
  'sharm el sheikh':       'Sharm el Sheikh Red Sea coral reef Egypt diving resort',
  'hurghada':              'Hurghada Red Sea Egypt beach resort diving snorkeling',
  'alejandria':            'Alexandria Egypt Mediterranean corniche lighthouse ancient',

  // ── MEDIO ORIENTE ─────────────────────────────────────────────────────────
  'dubai':                 'Dubai Burj Khalifa Burj Al Arab Palm Jumeirah desert skyline',
  'abu dhabi':             'Abu Dhabi Sheikh Zayed Grand Mosque skyline Louvre Museum',
  'jerusalem':             'Jerusalem Western Wall Dome of the Rock Old City Holy Land',
  'tel aviv':              'Tel Aviv beach Jaffa Old Port Bauhaus white city Mediterranean',
  'doha':                  'Doha Qatar Museum Islamic Art Pearl-Qatar Corniche skyline',

  // ── ASIA ──────────────────────────────────────────────────────────────────
  'tokio':                 'Tokyo Shibuya crossing Mount Fuji Senso-ji temple Shinjuku skyline',
  'tokyo':                 'Tokyo Shibuya crossing Mount Fuji Senso-ji temple Shinjuku skyline',
  'kyoto':                 'Kyoto Fushimi Inari torii gates Arashiyama bamboo geisha Japan',
  'osaka':                 'Osaka Dotonbori castle street food Japan neon',
  'bangkok':               'Bangkok Wat Phra Kaew Grand Palace Chao Phraya tuk tuk floating market',
  'bali':                  'Bali Tanah Lot Ubud rice terraces Uluwatu temple Indonesia',
  'singapur':              'Singapore Gardens by the Bay Marina Bay Sands skyline Merlion',
  'singapore':             'Singapore Gardens by the Bay Marina Bay Sands skyline Merlion',
  'hong kong':             'Hong Kong skyline Victoria Peak harbor neon street night',
  'shanghai':              'Shanghai Bund skyline Pudong Oriental Pearl Tower China',
  'beijing':               'Beijing Great Wall Forbidden City Tiananmen Temple Heaven China',
  'siem reap':             'Angkor Wat Cambodia temple sunrise jungle UNESCO',
  'kathmandu':             'Kathmandu Nepal Himalayas Boudhanath stupa Everest base camp',
  'maldivas':              'Maldives overwater bungalow turquoise lagoon coral reef white sand',
  'maldives':              'Maldives overwater bungalow turquoise lagoon coral reef white sand',

  // ── AFRICA ────────────────────────────────────────────────────────────────
  'marrakech':             'Marrakech Djemaa el-Fna Majorelle Garden medina souks Morocco',
  'casablanca':            'Casablanca Hassan II Mosque Morocco Atlantic coast',
  'nairobi':               'Nairobi Kenya safari Masai Mara wildlife savanna',
  'ciudad del cabo':       'Cape Town Table Mountain Boulders Beach V&A Waterfront South Africa',
  'cape town':             'Cape Town Table Mountain Boulders Beach penguins Victoria Waterfront',
  'zanzibar':              'Zanzibar Stone Town beach turquoise Indian Ocean spice island',

  // ── OCEANIA ────────────────────────────────────────────────────────────────
  'sydney':                'Sydney Opera House Harbour Bridge Bondi Beach Australia',
  'melbourne':             'Melbourne Federation Square laneways Flinders Street Australia',
  'nueva zelanda':         'New Zealand Milford Sound Hobbiton Queenstown Aoraki Mt Cook fjord',
  'queenstown':            'Queenstown New Zealand Remarkables mountains lake adventure bungee',
}

function getEnhancedQuery(q: string, destination: string): string {
  const destLower = destination.toLowerCase().trim()
  // Buscar coincidencia exacta o parcial en el mapa
  for (const [key, boost] of Object.entries(DESTINATION_BOOST)) {
    if (destLower.includes(key) || key.includes(destLower)) {
      return boost
    }
  }
  // Sin coincidencia: usar query del AI si tiene varios términos, sino agregar travel
  const words = q.trim().split(/\s+/)
  return words.length >= 2 ? q : `${destination} travel destination landscape`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''           // searchQuery del AI, ej: "Aruba beach Caribbean"
  const destination = searchParams.get('destination') || q  // ej: "Aruba"

  if (!destination) {
    return NextResponse.json({ error: 'Falta el parámetro q' }, { status: 400 })
  }

  // ── Construir query principal ────────────────────────────────────────────────
  const primaryQuery = getEnhancedQuery(q, destination)

  // Query de respaldo si los resultados son insuficientes
  const fallbackQuery = `${destination} tourism landmark`

  // ── Buscar en paralelo en Pexels y Unsplash ──────────────────────────────────
  const [pexelsPrimary, unsplashPrimary] = await Promise.allSettled([
    fetchPexels(primaryQuery, 10),
    fetchUnsplash(primaryQuery, 10),
  ])

  let images = [
    ...(pexelsPrimary.status === 'fulfilled' ? pexelsPrimary.value : []),
    ...(unsplashPrimary.status === 'fulfilled' ? unsplashPrimary.value : []),
  ]

  // Si hay menos de 8 fotos, intentar una segunda búsqueda con fallback
  if (images.length < 8) {
    const [pexelsFallback, unsplashFallback] = await Promise.allSettled([
      fetchPexels(fallbackQuery, 6),
      fetchUnsplash(fallbackQuery, 6),
    ])
    const fallback = [
      ...(pexelsFallback.status === 'fulfilled' ? pexelsFallback.value : []),
      ...(unsplashFallback.status === 'fulfilled' ? unsplashFallback.value : []),
    ]
    // Agregar sin duplicar IDs
    const existingIds = new Set(images.map(i => i.id))
    images = [...images, ...fallback.filter(i => !existingIds.has(i.id))]
  }

  if (images.length === 0) {
    return NextResponse.json({ error: 'No se encontraron imágenes' }, { status: 500 })
  }

  // Limitar a 20
  return NextResponse.json({ images: images.slice(0, 20) })
}

async function fetchPexels(query: string, perPage = 10) {
  // SIN orientation=portrait → evita fotos cerradas (flores, retratos)
  // El recorte 3:4 lo maneja CSS con object-cover
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&size=medium`
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY! } })
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return (data.photos || []).map((p: any) => ({
    id: `pexels-${p.id}`,
    url: p.src.large2x || p.src.large,
    thumbnail: p.src.large,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    source: 'Pexels',
  }))
}

async function fetchUnsplash(query: string, perPage = 10) {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  // squarish recorta bien, landscape da más paisajes
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  return (data.results || []).map((p: any) => ({
    id: `unsplash-${p.id}`,
    url: p.urls.full,
    thumbnail: p.urls.regular,
    photographer: p.user.name,
    photographerUrl: p.user.links.html,
    source: 'Unsplash',
  }))
}
