import { NextRequest, NextResponse } from 'next/server'

/**
 * API SIV Search - Recherche véhicule par immatriculation
 * Basée sur https://apiplaqueimmatriculation.com
 * 
 * Endpoint: POST /api/siv/search
 * Body: { registrationNumber: string, country?: string }
 */

interface SivApiResponse {
  data: {
    erreur: string
    immat: string
    pays: string
    marque: string
    modele: string
    date1erCir_us: string
    date1erCir_fr: string
    co2: string
    energie: string
    energieNGC: string
    genreVCG: string
    genreVCGNGC: string
    puisFisc: string
    carrosserieCG: string
    carrosserie: string
    puisFiscReelKW: string
    puisFiscReelCH: string
    collection: string
    date30: string
    vin: string
    variante: string
    version: string
    boite_vitesse: string
    code_boite_vitesse: string
    nr_passagers: string
    nb_portes: string
    type_mine: string
    cnit: string
    couleur: string
    poids: string
    ccm: string
    cylindres: string
    sra_id: string
    sra_group: string
    sra_commercial: string
    numero_serie: string
    ptac: string
    logo_marque: string
    photo_modele: string
    k_type: string
    tecdoc_manuid: string
    tecdoc_modelid: string
    tecdoc_carid: string
    code_moteur: string
    codes_platforme: string
    // Champs additionnels
    provenance: string
    import: string
    pays_origine: string
    premiere_main: string
    date_derniere_ct: string
    resultat_ct: string
    km_ct: string
    prix_neuf: string
    cote_argus: string
    nb_cylindres: string
    transmission: string
    empattement: string
    longueur: string
    largeur: string
    hauteur: string
    coffre: string
    reservoir: string
    norme_euro: string
    critair: string
    consommation_mixte: string
    consommation_urbaine: string
    consommation_extra_urbaine: string
    garantie_constructeur: string
    finition: string
    equipements: string
    options: string
    nb_rapports: string
    couple: string
    acceleration: string
    vitesse_max: string
    ptra: string
    charge_utile: string
    [key: string]: unknown
  }
  'api-version': string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationNumber, country = 'FR' } = body
    
    if (!registrationNumber) {
      return NextResponse.json({
        ok: false,
        error: 'Immatriculation requise'
      }, { status: 400 })
    }
    
    // Nettoyer l'immatriculation (enlever tirets et espaces)
    const cleanPlate = registrationNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    console.log('🔍 [SIV] Recherche:', cleanPlate, 'Pays:', country)
    
    // Récupérer le token API
    const apiToken = process.env.APIPLAQUE_TOKEN
    
    if (!apiToken) {
      console.log('⚠️ [SIV] APIPLAQUE_TOKEN manquante - mode simulation activé')
      
      // Mode simulation : retourner des données mock
      const mockVehicle = generateMockVehicle(cleanPlate)
      
      return NextResponse.json({
        ok: true,
        vehicle: mockVehicle,
        source: 'mock'
      })
    }
    
    // Appel à l'API apiplaqueimmatriculation.com
    const apiUrl = `https://api.apiplaqueimmatriculation.com/plaque?immatriculation=${cleanPlate}&token=${apiToken}&pays=${country}`
    
    console.log('📡 [SIV] Appel API:', apiUrl.replace(apiToken, 'TOKEN_HIDDEN'))
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📡 [SIV] Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [SIV] Error response:', errorText)
      
      // Gérer les erreurs spécifiques
      if (response.status === 404) {
        return NextResponse.json({
          ok: false,
          error: 'Véhicule non trouvé dans la base SIV',
          code: 'VEHICLE_NOT_FOUND'
        }, { status: 404 })
      }
      
      if (response.status === 403) {
        return NextResponse.json({
          ok: false,
          error: 'Crédits API épuisés. Veuillez recharger votre compte.',
          code: 'API_CREDITS_EXHAUSTED'
        }, { status: 403 })
      }
      
      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          error: 'Token API invalide',
          code: 'API_TOKEN_INVALID'
        }, { status: 401 })
      }
      
      return NextResponse.json({
        ok: false,
        error: 'Erreur lors de la consultation du SIV',
        code: 'API_ERROR'
      }, { status: response.status })
    }
    
    const apiData: SivApiResponse = await response.json()
    console.log('📦 [SIV] Data reçue:', JSON.stringify(apiData, null, 2))
    
    // Vérifier si erreur dans la réponse API
    if (apiData.data?.erreur && apiData.data.erreur !== '') {
      console.warn('⚠️ [SIV] Erreur API:', apiData.data.erreur)
      return NextResponse.json({
        ok: false,
        error: apiData.data.erreur,
        code: 'API_DATA_ERROR'
      }, { status: 400 })
    }
    
    // Mapper les données vers notre format
    const vehicle = mapApiDataToVehicle(apiData, cleanPlate, country)
    
    console.log('✅ [SIV] Véhicule mappé avec succès')
    
    return NextResponse.json({
      ok: true,
      vehicle,
      source: 'api'
    })
    
  } catch (error: unknown) {
    console.error('❌ [SIV] Exception:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur lors de la recherche SIV'
    return NextResponse.json({
      ok: false,
      error: errorMessage,
      code: 'SERVER_ERROR'
    }, { status: 500 })
  }
}

/**
 * Mapper les données API vers notre format véhicule
 */
function mapApiDataToVehicle(apiData: SivApiResponse, cleanPlate: string, country: string) {
  const d = apiData.data

  return {
    // === CHAMPS OBLIGATOIRES ===
    registrationNumber: d.immat || cleanPlate,
    vin: d.vin || '',
    make: d.marque || '',
    model: d.modele || '',

    // === CHAMPS OPTIONNELS - INFORMATIONS PRINCIPALES ===
    version: d.version || d.sra_commercial || d.variante || '',
    year: d.date1erCir_us ? new Date(d.date1erCir_us).getFullYear() : null,
    firstRegistrationDate: d.date1erCir_us || '',
    firstRegistrationDateFr: d.date1erCir_fr || '',
    color: d.couleur || '',
    fuelType: mapFuelType(d.energieNGC || d.energie),
    fuelTypeRaw: d.energieNGC || d.energie || '',

    // === CHAMPS OPTIONNELS - TECHNIQUE ===
    horsePower: d.puisFiscReelCH || '',
    horsePowerKW: d.puisFiscReelKW || '',
    fiscalPower: d.puisFisc || '',
    co2: d.co2 || '',
    displacement: d.ccm || '',
    cylinders: d.cylindres || d.nb_cylindres || '',
    engineCode: d.code_moteur || '',
    couple: d.couple || '',
    acceleration: d.acceleration || '',
    vitesseMax: d.vitesse_max || '',

    // === CHAMPS OPTIONNELS - CARROSSERIE ===
    bodyType: d.carrosserie || d.carrosserieCG || '',
    doors: d.nb_portes || '',
    seats: d.nr_passagers || '',
    weight: d.poids || '',
    ptac: d.ptac || '',
    ptra: d.ptra || '',
    chargeUtile: d.charge_utile || '',

    // === DIMENSIONS ===
    empattement: d.empattement || '',
    longueur: d.longueur || '',
    largeur: d.largeur || '',
    hauteur: d.hauteur || '',
    coffre: d.coffre || '',
    reservoir: d.reservoir || '',

    // === CHAMPS OPTIONNELS - IDENTIFICATION ===
    genre: d.genreVCGNGC || '',
    genreCode: d.genreVCG || '',
    typeApproval: d.type_mine || '',
    cnit: d.cnit || '',
    serialNumber: d.numero_serie || '',

    // === CHAMPS OPTIONNELS - TRANSMISSION ===
    gearbox: mapGearbox(d.boite_vitesse),
    gearboxCode: d.code_boite_vitesse || '',
    transmission: d.transmission || '',
    nbRapports: d.nb_rapports || '',

    // === CHAMPS OPTIONNELS - SRA / ASSURANCE ===
    sraId: d.sra_id || '',
    sraGroup: d.sra_group || '',
    sraCommercial: d.sra_commercial || '',

    // === CHAMPS OPTIONNELS - TECHNIQUE AVANCÉE ===
    kType: d.k_type || '',
    platformCode: d.codes_platforme || '',
    variant: d.variante || '',
    finition: d.finition || '',

    // === PROVENANCE & HISTORIQUE ===
    provenance: d.provenance || '',
    isImported: d.import === 'oui' || d.import === '1' || d.provenance?.toLowerCase().includes('import'),
    paysOrigine: d.pays_origine || '',
    premierMain: d.premiere_main === 'oui' || d.premiere_main === '1',

    // === CONTRÔLE TECHNIQUE ===
    dateDerniereCT: d.date_derniere_ct || '',
    resultatCT: d.resultat_ct || '',
    kmCT: d.km_ct || '',

    // === VALEUR ===
    prixNeuf: d.prix_neuf || '',
    coteArgus: d.cote_argus || '',

    // === ENVIRONNEMENT ===
    normeEuro: d.norme_euro || '',
    critair: d.critair || '',
    consommationMixte: d.consommation_mixte || '',
    consommationUrbaine: d.consommation_urbaine || '',
    consommationExtraUrbaine: d.consommation_extra_urbaine || '',

    // === EQUIPEMENTS ===
    equipements: d.equipements || '',
    options: d.options || '',
    garantieConstructeur: d.garantie_constructeur || '',

    // === CHAMPS OPTIONNELS - COLLECTION ===
    isCollector: d.collection === 'oui',
    date30: d.date30 || '',

    // === CHAMPS OPTIONNELS - MÉDIA ===
    logoUrl: d.logo_marque || '',
    photoUrl: d.photo_modele || '',

    // === TECDOC ===
    tecdocManuid: d.tecdoc_manuid || '',
    tecdocModelid: d.tecdoc_modelid || '',
    tecdocCarid: d.tecdoc_carid || '',

    // === MÉTADONNÉES ===
    country: d.pays || country,
    apiVersion: apiData['api-version'] || '1.0.0'
  }
}

/**
 * Mapper les types de carburant de l'API vers notre format
 */
function mapFuelType(energie?: string): string {
  if (!energie) return 'ESSENCE'
  
  const lower = energie.toLowerCase()
  
  if (lower.includes('diesel') || lower.includes('gazole')) return 'DIESEL'
  if (lower.includes('electrique') || lower.includes('electric') || lower.includes('électrique')) return 'ELECTRIC'
  if (lower.includes('hybride') || lower.includes('hybrid')) {
    if (lower.includes('rechargeable')) return 'HYBRID_RECHARGEABLE'
    return 'HYBRID'
  }
  if (lower.includes('gpl') || lower.includes('g.p.l')) return 'GPL'
  if (lower.includes('bioethanol') || lower.includes('ethanol') || lower.includes('flexfuel')) return 'BIOETHANOL'
  if (lower.includes('gaz naturel') || lower.includes('gnv')) return 'GNV'
  
  return 'ESSENCE'
}

/**
 * Mapper les codes boîte de vitesse
 */
function mapGearbox(code?: string): string {
  if (!code) return ''
  
  const gearboxMap: Record<string, string> = {
    'A': 'Automatique',
    'M': 'Manuelle',
    'S': 'Séquentielle',
    'V': 'Variable continue (CVT)',
    'X': 'Manuelle robotisée'
  }
  
  return gearboxMap[code.toUpperCase()] || code
}

/**
 * Générer des données mock pour les tests (quand pas de token API)
 */
function generateMockVehicle(registrationNumber: string) {
  const makes = ['Peugeot', 'Renault', 'Citroën', 'Volkswagen', 'BMW', 'Audi', 'Mercedes', 'Toyota']
  const models: Record<string, string[]> = {
    'Peugeot': ['208', '308', '3008', '5008', '2008'],
    'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Scenic'],
    'Citroën': ['C3', 'C4', 'C5 Aircross', 'Berlingo'],
    'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Roc'],
    'BMW': ['Serie 1', 'Serie 3', 'X1', 'X3'],
    'Audi': ['A1', 'A3', 'A4', 'Q3', 'Q5'],
    'Mercedes': ['Classe A', 'Classe C', 'GLA', 'GLC'],
    'Toyota': ['Yaris', 'Corolla', 'C-HR', 'RAV4']
  }
  const colors = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Argent']
  const fuelTypes = ['ESSENCE', 'DIESEL', 'HYBRID', 'ELECTRIC']
  const gearboxes = ['Manuelle', 'Automatique']
  const bodyTypes = ['Berline', 'SUV', 'Citadine', 'Break', 'Coupé']
  
  const hash = registrationNumber.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const absHash = Math.abs(hash)
  const make = makes[absHash % makes.length]
  const modelList = models[make] || ['Model']
  const model = modelList[absHash % modelList.length]
  const year = 2015 + (absHash % 11)
  const color = colors[absHash % colors.length]
  const fuelType = fuelTypes[absHash % fuelTypes.length]
  const gearbox = gearboxes[absHash % gearboxes.length]
  const bodyType = bodyTypes[absHash % bodyTypes.length]
  const horsePower = 90 + (absHash % 200)
  const co2 = 100 + (absHash % 100)
  const displacement = 1000 + (absHash % 2000)
  
  let formattedPlate = registrationNumber
  if (registrationNumber.length === 7) {
    formattedPlate = `${registrationNumber.slice(0, 2)}-${registrationNumber.slice(2, 5)}-${registrationNumber.slice(5, 7)}`
  }
  
  const vinChars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let vin = 'VF1'
  for (let i = 0; i < 14; i++) {
    vin += vinChars[(absHash + i * 7) % vinChars.length]
  }
  
  const isImported = absHash % 10 === 0 // 10% chance d'être importé
  const paysOrigineList = ['Allemagne', 'Belgique', 'Espagne', 'Italie', 'Pays-Bas', '']
  const normeEuroList = ['Euro 6d', 'Euro 6c', 'Euro 6b', 'Euro 5', 'Euro 4']
  const critairList = ['1', '2', '3', 'Crit\'Air 1', 'Crit\'Air 2']

  return {
    registrationNumber: formattedPlate,
    vin: vin,
    make: make,
    model: model,
    version: `${model} ${gearbox === 'Automatique' ? 'Auto' : ''} ${fuelType === 'DIESEL' ? 'BlueHDi' : fuelType === 'ESSENCE' ? 'PureTech' : ''}`.trim(),
    year: year,
    firstRegistrationDate: `${year}-${String((absHash % 12) + 1).padStart(2, '0')}-15`,
    firstRegistrationDateFr: `15/${String((absHash % 12) + 1).padStart(2, '0')}/${year}`,
    color: color,
    fuelType: fuelType,
    fuelTypeRaw: fuelType === 'DIESEL' ? 'Gazole' : fuelType === 'ESSENCE' ? 'Essence' : fuelType,
    horsePower: `${horsePower}`,
    horsePowerKW: `${Math.round(horsePower * 0.7355)}`,
    fiscalPower: `${Math.ceil(horsePower / 20)}`,
    co2: `${co2}`,
    displacement: `${displacement}`,
    cylinders: displacement > 1500 ? '4' : '3',
    engineCode: `${make.substring(0, 1)}${displacement}${fuelType.substring(0, 1)}`,
    couple: `${200 + (absHash % 200)} Nm`,
    acceleration: `${7 + (absHash % 8)}.${absHash % 10} s`,
    vitesseMax: `${180 + (absHash % 70)} km/h`,
    bodyType: bodyType,
    doors: '5',
    seats: '5',
    weight: `${1200 + (absHash % 600)}`,
    ptac: `${1800 + (absHash % 400)}`,
    ptra: `${2500 + (absHash % 500)}`,
    chargeUtile: `${400 + (absHash % 300)}`,
    // Dimensions
    empattement: `${2500 + (absHash % 300)} mm`,
    longueur: `${4000 + (absHash % 800)} mm`,
    largeur: `${1700 + (absHash % 200)} mm`,
    hauteur: `${1400 + (absHash % 300)} mm`,
    coffre: `${300 + (absHash % 200)} L`,
    reservoir: `${45 + (absHash % 25)} L`,
    // Transmission
    gearbox: gearbox,
    gearboxCode: gearbox === 'Automatique' ? 'A' : 'M',
    transmission: gearbox === 'Automatique' ? 'Automatique 8 rapports' : 'Manuelle 6 rapports',
    nbRapports: gearbox === 'Automatique' ? '8' : '6',
    // Identification
    sraId: `${100000 + (absHash % 900000)}`,
    sraGroup: `${10 + (absHash % 40)}`,
    sraCommercial: `${make} ${model} ${year}`,
    genre: 'VP',
    genreCode: 'VP',
    typeApproval: `e2*2007/46*${absHash % 10000}`,
    cnit: `M10${make.substring(0, 3).toUpperCase()}VP`,
    serialNumber: vin.substring(vin.length - 8),
    kType: `${10000 + (absHash % 90000)}`,
    platformCode: `${make.substring(0, 3).toUpperCase()}${year % 100}`,
    variant: model,
    finition: ['Active', 'Allure', 'GT Line', 'Intens', 'Business'][absHash % 5],
    // Provenance & Historique
    provenance: isImported ? 'Import' : 'France',
    isImported: isImported,
    paysOrigine: isImported ? paysOrigineList[absHash % paysOrigineList.length] : 'France',
    premierMain: absHash % 3 === 0,
    // Contrôle technique
    dateDerniereCT: year < 2024 ? `${2023 - (absHash % 2)}-${String((absHash % 12) + 1).padStart(2, '0')}-${String((absHash % 28) + 1).padStart(2, '0')}` : '',
    resultatCT: year < 2024 ? (absHash % 5 === 0 ? 'Défavorable' : 'Favorable') : '',
    kmCT: year < 2024 ? `${50000 + (absHash % 100000)}` : '',
    // Valeur
    prixNeuf: `${15000 + (absHash % 35000)}`,
    coteArgus: `${Math.round((15000 + (absHash % 35000)) * (0.3 + (year - 2015) * 0.05))}`,
    // Environnement
    normeEuro: normeEuroList[Math.min(year - 2015, 4)],
    critair: critairList[fuelType === 'ELECTRIC' ? 0 : fuelType === 'HYBRID' ? 1 : absHash % 3 + 1],
    consommationMixte: fuelType === 'ELECTRIC' ? '' : `${4 + (absHash % 5)}.${absHash % 10} L/100km`,
    consommationUrbaine: fuelType === 'ELECTRIC' ? '' : `${5 + (absHash % 6)}.${absHash % 10} L/100km`,
    consommationExtraUrbaine: fuelType === 'ELECTRIC' ? '' : `${3 + (absHash % 4)}.${absHash % 10} L/100km`,
    // Equipements
    equipements: 'Climatisation, Bluetooth, Régulateur de vitesse, Aide au stationnement',
    options: 'Pack City, Toit panoramique, Navigation',
    garantieConstructeur: year > 2022 ? 'En cours' : 'Expirée',
    // Collection
    isCollector: year < 1990,
    date30: year < 1990 ? `${year + 30}-01-01` : '',
    // Média
    logoUrl: `https://logo.clearbit.com/${make.toLowerCase()}.com`,
    photoUrl: '',
    // TecDoc
    tecdocManuid: `${absHash % 1000}`,
    tecdocModelid: `${absHash % 10000}`,
    tecdocCarid: `${absHash % 100000}`,
    // Métadonnées
    country: 'FR',
    apiVersion: 'mock-1.0.0'
  }
}
