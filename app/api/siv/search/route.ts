import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationNumber } = body
    
    if (!registrationNumber) {
      return NextResponse.json({
        ok: false,
        error: 'Immatriculation requise'
      }, { status: 400 })
    }
    
    // Nettoyer l'immatriculation
    const cleanRegistration = registrationNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    
    console.log('🔍 Recherche SIV API pour:', cleanRegistration)
    
    // Vérifier la clé API
    const apiKey = process.env.SIV_API_KEY
    
    if (!apiKey) {
      console.log('⚠️ SIV_API_KEY manquante - mode simulation activé')
      
      // Mode simulation : retourner des données mock
      const mockVehicle = generateMockVehicle(registrationNumber)
      
      return NextResponse.json({
        ok: true,
        vehicle: mockVehicle,
        source: 'mock'
      })
    }
    
    // Appel à l'API réelle (apiplaqueimmatriculation.com ou autre)
    const apiUrl = `https://apiplaqueimmatriculation.com/api/v1/vehicule/${cleanRegistration}`
    
    console.log('📡 Appel API:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📡 API Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      
      if (response.status === 404) {
        return NextResponse.json({
          ok: false,
          error: 'Véhicule non trouvé dans le SIV'
        }, { status: 404 })
      }
      
      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          error: 'Clé API invalide'
        }, { status: 401 })
      }
      
      return NextResponse.json({
        ok: false,
        error: 'Erreur lors de la recherche SIV'
      }, { status: response.status })
    }
    
    const data = await response.json()
    console.log('📦 API Data:', data)
    
    // Transformer les données API en format MotorSafe
    const vehicle = {
      registrationNumber: data.immatriculation || registrationNumber,
      vin: data.vin || '',
      make: data.marque || '',
      model: data.modele || '',
      version: data.version || '',
      year: data.annee ? parseInt(data.annee) : null,
      firstRegistrationDate: data.date_premiere_immatriculation || '',
      color: data.couleur || '',
      fuelType: mapFuelType(data.energie)
    }
    
    console.log('✅ Véhicule transformé:', vehicle)
    
    return NextResponse.json({
      ok: true,
      vehicle,
      source: 'api'
    })
    
  } catch (error) {
    console.error('❌ SIV Search Error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Erreur serveur lors de la recherche SIV'
    }, { status: 500 })
  }
}

function mapFuelType(energie?: string): string {
  if (!energie) return 'ESSENCE'
  
  const energieLower = energie.toLowerCase()
  
  if (energieLower.includes('diesel') || energieLower.includes('gazole')) {
    return 'DIESEL'
  }
  if (energieLower.includes('electrique') || energieLower.includes('électrique')) {
    return 'ELECTRIC'
  }
  if (energieLower.includes('hybride')) {
    return 'HYBRID'
  }
  if (energieLower.includes('gpl')) {
    return 'GPL'
  }
  
  return 'ESSENCE'
}

function generateMockVehicle(registrationNumber: string) {
  // Générer des données simulées réalistes basées sur l'immatriculation
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
  
  // Utiliser l'immatriculation comme seed pour générer des données cohérentes
  const hash = registrationNumber.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const make = makes[Math.abs(hash) % makes.length]
  const modelList = models[make] || ['Standard']
  const model = modelList[Math.abs(hash >> 4) % modelList.length]
  const color = colors[Math.abs(hash >> 8) % colors.length]
  const fuelType = fuelTypes[Math.abs(hash >> 12) % fuelTypes.length]
  const year = 2018 + (Math.abs(hash >> 16) % 7) // 2018-2024
  
  // Générer un VIN fictif mais valide en format
  const vinChars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let vin = 'VF1'
  for (let i = 0; i < 14; i++) {
    vin += vinChars[Math.abs((hash + i * 17) % vinChars.length)]
  }
  
  // Formater l'immatriculation
  let formattedReg = registrationNumber.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (formattedReg.length === 7) {
    formattedReg = formattedReg.slice(0, 2) + '-' + formattedReg.slice(2, 5) + '-' + formattedReg.slice(5)
  }
  
  return {
    registrationNumber: formattedReg,
    vin: vin,
    make: make,
    model: model,
    version: 'Active',
    year: year,
    firstRegistrationDate: `${year}-${String((Math.abs(hash) % 12) + 1).padStart(2, '0')}-15`,
    color: color,
    fuelType: fuelType
  }
}
