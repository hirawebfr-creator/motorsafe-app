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
    puisFiscReelKW: string
    puisFiscReelCH: string
    collection: string
    date30: string
    vin: string
    variante: string
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
    k_type: string
    tecdoc_manuid: string
    tecdoc_modelid: string
    tecdoc_carid: string
    code_moteur: string
    codes_platforme: string
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
    const apiToken = process.env.APTPLAQUE_TOKEN
    
    if (!apiToken) {
      console.log('⚠️ [SIV] APTPLAQUE_TOKEN manquante - mode simulation activé')
      
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
  return {
    // === CHAMPS OBLIGATOIRES ===
    registrationNumber: apiData.data.immat || cleanPlate,
    vin: apiData.data.vin || '',
    make: apiData.data.marque || '',
    model: apiData.data.modele || '',
    
    // === CHAMPS OPTIONNELS - INFORMATIONS PRINCIPALES ===
    version: apiData.data.sra_commercial || apiData.data.variante || '',
    year: apiData.data.date1erCir_us ? new Date(apiData.data.date1erCir_us).getFullYear() : null,
    firstRegistrationDate: apiData.data.date1erCir_us || '',
    color: apiData.data.couleur || '',
    fuelType: mapFuelType(apiData.data.energieNGC || apiData.data.energie),
    
    // === CHAMPS OPTIONNELS - TECHNIQUE ===
    horsePower: apiData.data.puisFiscReelCH || '',
    horsePowerKW: apiData.data.puisFiscReelKW || '',
    fiscalPower: apiData.data.puisFisc || '',
    co2: apiData.data.co2 || '',
    displacement: apiData.data.ccm || '',
    cylinders: apiData.data.cylindres || '',
    
    // === CHAMPS OPTIONNELS - CARROSSERIE ===
    bodyType: apiData.data.carrosserieCG || '',
    doors: apiData.data.nb_portes || '',
    seats: apiData.data.nr_passagers || '',
    weight: apiData.data.poids || '',
    ptac: apiData.data.ptac || '',
    
    // === CHAMPS OPTIONNELS - IDENTIFICATION ===
    genre: apiData.data.genreVCGNGC || '',
    genreCode: apiData.data.genreVCG || '',
    typeApproval: apiData.data.type_mine || '',
    cnit: apiData.data.cnit || '',
    serialNumber: apiData.data.numero_serie || '',
    
    // === CHAMPS OPTIONNELS - TRANSMISSION ===
    gearbox: mapGearbox(apiData.data.boite_vitesse),
    gearboxCode: apiData.data.code_boite_vitesse || '',
    
    // === CHAMPS OPTIONNELS - SRA / ASSURANCE ===
    sraId: apiData.data.sra_id || '',
    sraGroup: apiData.data.sra_group || '',
    sraCommercial: apiData.data.sra_commercial || '',
    
    // === CHAMPS OPTIONNELS - TECHNIQUE AVANCÉE ===
    kType: apiData.data.k_type || '',
    engineCode: apiData.data.code_moteur || '',
    platformCode: apiData.data.codes_platforme || '',
    variant: apiData.data.variante || '',
    
    // === CHAMPS OPTIONNELS - COLLECTION ===
    isCollector: apiData.data.collection === 'oui',
    
    // === CHAMPS OPTIONNELS - MÉDIA ===
    logoUrl: apiData.data.logo_marque || '',
    
    // === MÉTADONNÉES ===
    country: apiData.data.pays || country,
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
  
  return {
    registrationNumber: formattedPlate,
    vin: vin,
    make: make,
    model: model,
    version: `${model} ${gearbox === 'Automatique' ? 'Auto' : ''} ${fuelType === 'DIESEL' ? 'BlueHDi' : fuelType === 'ESSENCE' ? 'PureTech' : ''}`.trim(),
    year: year,
    firstRegistrationDate: `${year}-${String((absHash % 12) + 1).padStart(2, '0')}-15`,
    color: color,
    fuelType: fuelType,
    horsePower: `${horsePower}`,
    horsePowerKW: `${Math.round(horsePower * 0.7355)}`,
    fiscalPower: `${Math.ceil(horsePower / 20)}`,
    co2: `${co2}`,
    displacement: `${displacement}`,
    cylinders: displacement > 1500 ? '4' : '3',
    bodyType: bodyType,
    doors: '5',
    seats: '5',
    weight: `${1200 + (absHash % 600)}`,
    ptac: `${1800 + (absHash % 400)}`,
    gearbox: gearbox,
    gearboxCode: gearbox === 'Automatique' ? 'A' : 'M',
    sraId: `${100000 + (absHash % 900000)}`,
    sraGroup: `${10 + (absHash % 40)}`,
    sraCommercial: `${make} ${model} ${year}`,
    genre: 'VP',
    genreCode: 'VP',
    typeApproval: `e2*2007/46*${absHash % 10000}`,
    cnit: `M10${make.substring(0, 3).toUpperCase()}VP`,
    serialNumber: vin.substring(vin.length - 8),
    kType: `${10000 + (absHash % 90000)}`,
    engineCode: `${make.substring(0, 1)}${displacement}${fuelType.substring(0, 1)}`,
    platformCode: `${make.substring(0, 3).toUpperCase()}${year % 100}`,
    variant: model,
    isCollector: year < 1990,
    logoUrl: `https://logo.clearbit.com/${make.toLowerCase()}.com`,
    country: 'FR',
    apiVersion: 'mock-1.0.0'
  }
}
