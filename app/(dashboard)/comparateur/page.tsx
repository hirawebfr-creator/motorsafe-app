"use client";

/**
 * COMPARE-01: E85 & Stage Performance Comparator
 * 
 * Beautiful UI with comparison charts and visual graphs.
 * Responsive design matching other SafeMotor pages.
 */

import { useState, useEffect } from "react";
import {
  Search,
  Fuel,
  Zap,
  Euro,
  Car,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Leaf,
  Flame,
  Settings2,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Responsive Hook
// ============================================================================

function useResponsive() {
  const [screen, setScreen] = useState<"mobile" | "tablet" | "desktop">("desktop");
  
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("mobile");
      else if (w < 1024) setScreen("tablet");
      else setScreen("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  
  return { isMobile: screen === "mobile", isTablet: screen === "tablet", screen };
}

// ============================================================================
// Types - Données SIV complètes
// ============================================================================

interface SIVVehicleData {
  plate: string;
  make: string;
  model: string;
  version?: string;
  year?: number;
  fuelType: string;
  // Données techniques SIV
  powerHP: number;        // puissance réelle en ch (puisFiscReelCH)
  powerKW: number;        // puissance en kW (puisFiscReelKW)
  fiscalPower: number;    // puissance fiscale (puisFisc)
  engineCC: number;       // cylindrée en cm³ (ccm)
  cylinders: number;      // nombre de cylindres
  co2: number;            // émissions CO2 g/km
  weight: number;         // poids en kg
  gearbox: string;        // type de boîte
}

interface E85Analysis {
  compatible: boolean;
  reason?: string;
  // Données du véhicule utilisées
  estimatedConsumption: number;     // L/100km estimée
  kmPerYear: number;                // km parcourus/an (personnalisable)
  // Calculs SP95
  currentFuelCostPerYear: number;
  litersPerYear: number;
  // Calculs E85
  e85FuelCostPerYear: number;
  e85LitersPerYear: number;
  e85OverconsumptionPercent: number;
  // Résultats
  savingsPerYear: number;
  conversionCost: number;
  roiMonths: number;
  co2ReductionPercent: number;
  co2SavedKgPerYear: number;
}

interface StageData {
  available: boolean;
  powerGain: number;
  torqueGain: number;
  newPowerHP: number;
  newTorqueNm: number;
  price: number;
  requirements?: string[];
  description: string;
}

interface StageAnalysis {
  isTurbo: boolean;
  turboType?: string;
  stage1: StageData;
  stage2: StageData;
  stage3: StageData;
}

// ============================================================================
// Prix carburants actualisés (janvier 2026)
// ============================================================================

const FUEL_PRICES = { 
  sp95: 1.82, 
  sp98: 1.89, 
  diesel: 1.72, 
  e85: 0.82 
};

// ============================================================================
// Estimation consommation basée sur données SIV
// ============================================================================

function estimateConsumption(vehicle: SIVVehicleData): number {
  /**
   * Formule de consommation estimée basée sur:
   * - Puissance (ch)
   * - Poids (kg) 
   * - Cylindrée (cm³)
   * - Type carburant
   * - CO2 émis (corrélation directe)
   * 
   * Sources: ADEME, données constructeurs, études IFPEN
   */
  
  // Si on a le CO2, on peut estimer précisément la consommation
  // Essence: 1L = ~2.3kg CO2 → CO2(g/km) ÷ 23 = L/100km environ
  // Diesel: 1L = ~2.6kg CO2 → CO2(g/km) ÷ 26 = L/100km environ
  if (vehicle.co2 > 0) {
    const isDiesel = vehicle.fuelType.toUpperCase().includes("DIESEL");
    const co2Factor = isDiesel ? 26.5 : 23.2;
    const consumptionFromCO2 = (vehicle.co2 / co2Factor) * 1.1; // +10% usage réel vs cycle WLTP
    return Math.round(consumptionFromCO2 * 10) / 10;
  }
  
  // Sinon, estimation basée sur puissance/poids/cylindrée
  const isDiesel = vehicle.fuelType.toUpperCase().includes("DIESEL");
  const baseConsumption = isDiesel ? 5.5 : 6.5;
  
  // Facteur puissance: +0.5L par 50ch au-dessus de 100ch
  const powerFactor = Math.max(0, (vehicle.powerHP - 100) / 50) * 0.5;
  
  // Facteur poids: +0.3L par 200kg au-dessus de 1200kg
  const weightFactor = Math.max(0, (vehicle.weight - 1200) / 200) * 0.3;
  
  // Facteur cylindrée: les gros moteurs consomment plus
  const ccFactor = (vehicle.engineCC - 1400) / 1000 * 0.4;
  
  // Boîte auto = +0.3L (moins efficiente sur anciens modèles)
  const gearboxFactor = vehicle.gearbox?.toLowerCase().includes("auto") ? 0.3 : 0;
  
  const estimated = baseConsumption + powerFactor + weightFactor + ccFactor + gearboxFactor;
  
  // Borner entre 4L et 15L/100km
  return Math.round(Math.min(15, Math.max(4, estimated)) * 10) / 10;
}

// ============================================================================
// Estimation couple (torque) basée sur puissance et régime
// ============================================================================

function estimateTorque(vehicle: SIVVehicleData): number {
  /**
   * Couple (Nm) = Puissance (kW) × 9549 / Régime (tr/min)
   * 
   * Régime couple max typique:
   * - Diesel turbo: 1500-2500 tr/min
   * - Essence turbo: 2000-4000 tr/min
   * - Essence atmo: 4000-5500 tr/min
   * 
   * On utilise le rapport ch/L pour estimer si turbo ou atmo
   */
  
  const isDiesel = vehicle.fuelType.toUpperCase().includes("DIESEL");
  const powerPerLiter = vehicle.powerHP / (vehicle.engineCC / 1000);
  
  // Estimation si turbo: >80ch/L essence ou >60ch/L diesel généralement turbo
  const isTurbo = isDiesel ? powerPerLiter > 55 : powerPerLiter > 75;
  
  // Régime typique couple max
  let rpmAtMaxTorque: number;
  if (isDiesel) {
    rpmAtMaxTorque = isTurbo ? 1750 : 2500;
  } else {
    rpmAtMaxTorque = isTurbo ? 2500 : 4500;
  }
  
  // Couple = kW × 9549 / RPM
  const torque = (vehicle.powerKW * 9549) / rpmAtMaxTorque;
  
  return Math.round(torque);
}

// ============================================================================
// Détection turbo basée sur données SIV
// ============================================================================

function detectTurbo(vehicle: SIVVehicleData): { isTurbo: boolean; turboType: string } {
  const version = (vehicle.version || "").toLowerCase();
  const isDiesel = vehicle.fuelType.toUpperCase().includes("DIESEL");
  
  // Mots-clés indicateurs turbo dans la version
  const turboKeywords = [
    'turbo', 'tsi', 'tfsi', 'tdi', 'hdi', 'dci', 'tce', 'cdi', 'bluehdi', 
    'puretech turbo', 'ecoboost', 'jtd', 'crdi', 'cdti', 'mjet', 'gti',
    'rs', 's-line', 'amg', 'm sport', 'type r', 'st', 'vrs', 'cupra',
    'biturbo', 'twin turbo', 'bi-turbo', '16v turbo'
  ];
  
  const hasKeyword = turboKeywords.some(kw => version.includes(kw));
  
  // Ratio puissance/cylindrée
  const powerPerLiter = vehicle.powerHP / (vehicle.engineCC / 1000);
  
  // Diesel moderne = presque tous turbo
  // Essence: >80ch/L = très probablement turbo
  const hasTurboRatio = isDiesel ? powerPerLiter > 50 : powerPerLiter > 75;
  
  const isTurbo: boolean = !!(hasKeyword || hasTurboRatio || (isDiesel && vehicle.year && vehicle.year >= 2000));
  
  // Déterminer le type de turbo
  let turboType: string = "Atmosphérique";
  if (isTurbo) {
    if (version.includes("biturbo") || version.includes("twin") || version.includes("bi-turbo")) {
      turboType = "Bi-turbo";
    } else if (isDiesel) {
      turboType = "Turbo diesel";
    } else {
      turboType = "Turbo essence";
    }
  }
  
  return { isTurbo, turboType };
}

// ============================================================================
// Calcul E85 basé sur données SIV réelles
// ============================================================================

function calculateE85Analysis(vehicle: SIVVehicleData, kmPerYear: number = 15000): E85Analysis {
  const fuelUpper = vehicle.fuelType.toUpperCase();
  const isEssence = fuelUpper.includes("ESSENCE") || fuelUpper === "ES" || fuelUpper.includes("SP");
  
  // Vérification compatibilité
  if (!isEssence) {
    return { 
      compatible: false, 
      reason: vehicle.fuelType.includes("DIESEL") 
        ? "Le E85 est incompatible avec les moteurs diesel" 
        : `Type de carburant non compatible: ${vehicle.fuelType}`,
      estimatedConsumption: 0, kmPerYear: 0, currentFuelCostPerYear: 0, litersPerYear: 0,
      e85FuelCostPerYear: 0, e85LitersPerYear: 0, e85OverconsumptionPercent: 0,
      savingsPerYear: 0, conversionCost: 0, roiMonths: 0, co2ReductionPercent: 0, co2SavedKgPerYear: 0
    };
  }
  
  if (vehicle.year && vehicle.year < 2001) {
    return { 
      compatible: false, 
      reason: `Véhicule de ${vehicle.year}: les véhicules avant 2001 nécessitent des modifications coûteuses (joints, pompe, etc.)`,
      estimatedConsumption: 0, kmPerYear: 0, currentFuelCostPerYear: 0, litersPerYear: 0,
      e85FuelCostPerYear: 0, e85LitersPerYear: 0, e85OverconsumptionPercent: 0,
      savingsPerYear: 0, conversionCost: 0, roiMonths: 0, co2ReductionPercent: 0, co2SavedKgPerYear: 0
    };
  }
  
  // Calcul consommation estimée basée sur CO2/puissance/poids
  const estimatedConsumption = estimateConsumption(vehicle);
  
  // Litres SP95 par an
  const litersPerYear = (kmPerYear / 100) * estimatedConsumption;
  const currentFuelCostPerYear = litersPerYear * FUEL_PRICES.sp95;
  
  // E85: surconsommation entre 20% et 30% selon puissance/injection
  // Véhicules modernes (injection directe): ~20%
  // Véhicules plus anciens (injection indirecte): ~25-30%
  let e85OverconsumptionPercent = 25;
  if (vehicle.year && vehicle.year >= 2015) e85OverconsumptionPercent = 20;
  if (vehicle.year && vehicle.year >= 2020) e85OverconsumptionPercent = 18;
  if (vehicle.powerHP > 200) e85OverconsumptionPercent += 3; // Moteurs puissants légèrement plus
  
  const e85LitersPerYear = litersPerYear * (1 + e85OverconsumptionPercent / 100);
  const e85FuelCostPerYear = e85LitersPerYear * FUEL_PRICES.e85;
  
  const savingsPerYear = currentFuelCostPerYear - e85FuelCostPerYear;
  
  // Coût conversion selon puissance
  let conversionCost: number;
  if (vehicle.powerHP <= 100) conversionCost = 750;
  else if (vehicle.powerHP <= 150) conversionCost = 850;
  else if (vehicle.powerHP <= 200) conversionCost = 950;
  else if (vehicle.powerHP <= 300) conversionCost = 1100;
  else conversionCost = 1350;
  
  // Cylindres multiples = plus cher (plus d'injecteurs à gérer)
  if (vehicle.cylinders >= 6) conversionCost += 200;
  if (vehicle.cylinders >= 8) conversionCost += 300;
  
  const roiMonths = savingsPerYear > 0 ? Math.ceil((conversionCost / savingsPerYear) * 12) : 999;
  
  // Réduction CO2: E85 = 50-70% moins de CO2 fossile
  const co2ReductionPercent = 60;
  const co2SavedKgPerYear = Math.round((vehicle.co2 * kmPerYear / 1000) * (co2ReductionPercent / 100));
  
  return { 
    compatible: true,
    estimatedConsumption,
    kmPerYear,
    currentFuelCostPerYear: Math.round(currentFuelCostPerYear),
    litersPerYear: Math.round(litersPerYear),
    e85FuelCostPerYear: Math.round(e85FuelCostPerYear),
    e85LitersPerYear: Math.round(e85LitersPerYear),
    e85OverconsumptionPercent,
    savingsPerYear: Math.round(savingsPerYear),
    conversionCost,
    roiMonths,
    co2ReductionPercent,
    co2SavedKgPerYear
  };
}

// ============================================================================
// Calcul gains Stage basés sur données SIV réelles
// ============================================================================

function calculateStageAnalysis(vehicle: SIVVehicleData): StageAnalysis {
  const { isTurbo, turboType } = detectTurbo(vehicle);
  const isDiesel = vehicle.fuelType.toUpperCase().includes("DIESEL");
  const basePower = vehicle.powerHP;
  const baseTorque = estimateTorque(vehicle);
  
  // Ratio puissance/cylindrée pour affiner les gains
  const powerPerLiter = basePower / (vehicle.engineCC / 1000);
  
  // Plus le moteur est déjà optimisé, moins de gains potentiels
  const isHighlyTuned = powerPerLiter > 120; // >120ch/L = déjà très poussé
  
  // ================== STAGE 1 ==================
  // Reprogrammation ECU uniquement
  let stage1PowerGainPercent: number;
  let stage1TorqueGainPercent: number;
  
  if (isTurbo) {
    // Turbo: 15-30% selon marge constructeur
    stage1PowerGainPercent = isHighlyTuned ? 12 : (isDiesel ? 25 : 20);
    stage1TorqueGainPercent = isHighlyTuned ? 15 : (isDiesel ? 30 : 25);
  } else {
    // Atmo: 5-12% max
    stage1PowerGainPercent = 8;
    stage1TorqueGainPercent = 10;
  }
  
  const stage1PowerGain = Math.round(basePower * stage1PowerGainPercent / 100);
  const stage1TorqueGain = Math.round(baseTorque * stage1TorqueGainPercent / 100);
  
  // Prix Stage 1 selon complexité
  let stage1Price = isDiesel ? 490 : 590;
  if (basePower > 200) stage1Price += 100;
  if (basePower > 300) stage1Price += 150;
  if (vehicle.cylinders >= 8) stage1Price += 100;
  
  // ================== STAGE 2 ==================
  // ECU + hardware (admission, échappement, intercooler)
  let stage2PowerGainPercent: number;
  let stage2TorqueGainPercent: number;
  
  if (isTurbo) {
    stage2PowerGainPercent = isHighlyTuned ? 25 : (isDiesel ? 40 : 35);
    stage2TorqueGainPercent = isHighlyTuned ? 30 : (isDiesel ? 50 : 40);
  } else {
    stage2PowerGainPercent = 15;
    stage2TorqueGainPercent = 15;
  }
  
  const stage2PowerGain = Math.round(basePower * stage2PowerGainPercent / 100);
  const stage2TorqueGain = Math.round(baseTorque * stage2TorqueGainPercent / 100);
  
  let stage2Price = isDiesel ? 1200 : 1400;
  if (basePower > 200) stage2Price += 300;
  if (basePower > 300) stage2Price += 400;
  
  const stage2Requirements = isTurbo 
    ? ["Admission sport renforcée", "Downpipe sport/décata", "Intercooler majoré", "Ligne échappement sport"]
    : ["Admission sport", "Collecteur sport", "Échappement complet"];
  
  // ================== STAGE 3 ==================
  // Hardware lourd (turbo hybride/renforcé, injecteurs, embrayage...)
  let stage3PowerGainPercent: number;
  let stage3TorqueGainPercent: number;
  
  if (isTurbo && basePower >= 150) {
    stage3PowerGainPercent = isHighlyTuned ? 50 : 70;
    stage3TorqueGainPercent = isHighlyTuned ? 60 : 80;
  } else {
    stage3PowerGainPercent = 25;
    stage3TorqueGainPercent = 25;
  }
  
  const stage3PowerGain = Math.round(basePower * stage3PowerGainPercent / 100);
  const stage3TorqueGain = Math.round(baseTorque * stage3TorqueGainPercent / 100);
  
  let stage3Price = isDiesel ? 3200 : 4000;
  if (basePower > 250) stage3Price += 1000;
  if (basePower > 350) stage3Price += 1500;
  
  const stage3Requirements = [
    "Turbo hybride ou renforcé",
    "Injecteurs haute pression",
    "Pompe essence renforcée",
    "Embrayage renforcé",
    "Intercooler racing",
    "Admission carbone"
  ];
  
  return {
    isTurbo,
    turboType,
    stage1: {
      available: true,
      powerGain: stage1PowerGain,
      torqueGain: stage1TorqueGain,
      newPowerHP: basePower + stage1PowerGain,
      newTorqueNm: baseTorque + stage1TorqueGain,
      price: stage1Price,
      description: "Reprogrammation ECU optimisée"
    },
    stage2: {
      available: isTurbo,
      powerGain: stage2PowerGain,
      torqueGain: stage2TorqueGain,
      newPowerHP: basePower + stage2PowerGain,
      newTorqueNm: baseTorque + stage2TorqueGain,
      price: stage2Price,
      requirements: stage2Requirements,
      description: "ECU + modifications hardware"
    },
    stage3: {
      available: isTurbo && basePower >= 150,
      powerGain: stage3PowerGain,
      torqueGain: stage3TorqueGain,
      newPowerHP: basePower + stage3PowerGain,
      newTorqueNm: baseTorque + stage3TorqueGain,
      price: stage3Price,
      requirements: stage3Requirements,
      description: "Préparation compétition"
    }
  };
}

// ============================================================================
// Comparison Chart Component
// ============================================================================

function ComparisonChart({ 
  before, 
  after, 
  unit, 
  label,
  beforeColor = '#9CA3AF',
  afterColor = '#10B981',
  isMobile,
}: { 
  before: number;
  after: number;
  unit: string;
  label: string;
  beforeColor?: string;
  afterColor?: string;
  isMobile: boolean;
}) {
  const [animatedBefore, setAnimatedBefore] = useState(0);
  const [animatedAfter, setAnimatedAfter] = useState(0);
  const maxValue = Math.max(before, after) * 1.15;
  const gain = after - before;
  const gainPercent = Math.round((gain / before) * 100);
  
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimatedBefore((before / maxValue) * 100), 100);
    const timer2 = setTimeout(() => setAnimatedAfter((after / maxValue) * 100), 300);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [before, after, maxValue]);
  
  return (
    <div style={{ 
      padding: isMobile ? '16px' : '20px',
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 700, 
          color: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '4px 10px',
          borderRadius: '20px',
        }}>
          +{gain} {unit} (+{gainPercent}%)
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Before */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', width: '45px' }}>Avant</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: beforeColor }}>{before} {unit}</span>
          </div>
          <div style={{ height: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${animatedBefore}%`, 
              height: '100%', 
              backgroundColor: beforeColor,
              borderRadius: '8px',
              transition: 'width 0.6s ease-out',
            }} />
          </div>
        </div>
        
        {/* After */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', width: '45px' }}>Après</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: afterColor }}>{after} {unit}</span>
          </div>
          <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${animatedAfter}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${afterColor}, ${afterColor}dd)`,
              borderRadius: '10px',
              transition: 'width 0.8s ease-out',
              boxShadow: `0 0 12px ${afterColor}40`,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Cost Comparison Visual
// ============================================================================

function CostBars({ 
  e85Analysis, 
  isMobile 
}: { 
  e85Analysis: E85Analysis;
  isMobile: boolean;
}) {
  const [sp95Height, setSp95Height] = useState(0);
  const [e85Height, setE85Height] = useState(0);
  const maxCost = e85Analysis.currentFuelCostPerYear;
  
  useEffect(() => {
    const timer1 = setTimeout(() => setSp95Height(100), 100);
    const timer2 = setTimeout(() => setE85Height((e85Analysis.e85FuelCostPerYear / maxCost) * 100), 300);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [e85Analysis, maxCost]);
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'center', 
      gap: isMobile ? '32px' : '60px',
      height: '220px',
      padding: '24px 0',
    }}>
      {/* SP95 Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: isMobile ? '70px' : '90px', 
          height: `${sp95Height * 1.5}px`,
          background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '16px',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
          transition: 'height 0.8s ease-out',
          position: 'relative',
        }}>
          <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: 'white' }}>
            {e85Analysis.currentFuelCostPerYear}€
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>/ an</span>
        </div>
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '4px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: '#FEF3C7',
            padding: '6px 12px',
            borderRadius: '8px',
          }}>
            <Fuel size={16} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>SP95</span>
          </div>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{FUEL_PRICES.sp95}€/L</span>
        </div>
      </div>
      
      {/* E85 Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: isMobile ? '70px' : '90px', 
          height: `${e85Height * 1.5}px`,
          background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '16px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          transition: 'height 0.8s ease-out',
        }}>
          <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: 'white' }}>
            {e85Analysis.e85FuelCostPerYear}€
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>/ an</span>
        </div>
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '4px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: '#D1FAE5',
            padding: '6px 12px',
            borderRadius: '8px',
          }}>
            <Leaf size={16} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>E85</span>
          </div>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{FUEL_PRICES.e85}€/L</span>
        </div>
      </div>
      
      {/* Savings */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: isMobile ? '16px' : '24px',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: '16px',
        border: '2px dashed #10B981',
        minWidth: isMobile ? '100px' : '130px',
      }}>
        <TrendingUp size={28} style={{ color: '#10B981', marginBottom: '8px' }} />
        <span style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>
          -{e85Analysis.savingsPerYear}€
        </span>
        <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>d'économie/an</span>
      </div>
    </div>
  );
}

// ============================================================================
// Stage Card Component
// ============================================================================

function StageCard({
  stage,
  stageNumber,
  basePower,
  baseTorque,
  isMobile,
  color,
  icon: Icon,
}: {
  stage: StageData;
  stageNumber: number;
  basePower: number;
  baseTorque: number;
  isMobile: boolean;
  color: string;
  icon: typeof Zap;
}) {
  if (!stage.available) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#F9FAFB',
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        opacity: 0.6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '52px', 
            height: '52px', 
            borderRadius: '14px', 
            backgroundColor: '#E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={26} style={{ color: '#9CA3AF' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#9CA3AF', margin: 0 }}>
              Stage {stageNumber}
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Non disponible</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
          {stageNumber === 2 ? "Réservé aux véhicules turbo" : "Réservé aux véhicules turbo de plus de 150ch"}
        </p>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      border: `2px solid ${color}25`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${color}40`,
          }}>
            <Icon size={28} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
              Stage {stageNumber}
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              {stageNumber === 1 ? "Reprogrammation ECU" : stageNumber === 2 ? "ECU + Hardware" : "Préparation compétition"}
            </p>
          </div>
        </div>
        <div style={{ 
          textAlign: 'right',
          backgroundColor: `${color}10`,
          padding: '8px 16px',
          borderRadius: '12px',
        }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color }}>
            {stage.price}€
          </span>
        </div>
      </div>
      
      {/* Power Comparison */}
      <ComparisonChart
        before={basePower}
        after={stage.newPowerHP}
        unit="ch"
        label="Puissance"
        beforeColor="#D1D5DB"
        afterColor={color}
        isMobile={isMobile}
      />
      
      <div style={{ height: '16px' }} />
      
      {/* Torque Comparison */}
      <ComparisonChart
        before={baseTorque}
        after={stage.newTorqueNm}
        unit="Nm"
        label="Couple"
        beforeColor="#D1D5DB"
        afterColor={color}
        isMobile={isMobile}
      />
      
      {/* Requirements */}
      {'requirements' in stage && stage.requirements && stage.requirements.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px' }}>Prérequis :</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {stage.requirements.map((req, i) => (
              <span key={i} style={{
                fontSize: '11px',
                padding: '6px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                color: '#4B5563',
                fontWeight: 500,
              }}>
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* CTA */}
      <Link href="/interventions/nouveau" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '24px',
        padding: '16px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: 700,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        boxShadow: `0 4px 12px ${color}40`,
      }}>
        Demander un devis Stage {stageNumber}
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ComparateurPage() {
  const { isMobile, isTablet } = useResponsive();
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<SIVVehicleData | null>(null);
  const [e85Analysis, setE85Analysis] = useState<E85Analysis | null>(null);
  const [stageAnalysis, setStageAnalysis] = useState<StageAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"e85" | "stage">("e85");
  const [kmPerYear, setKmPerYear] = useState(15000);

  const handleSearch = async () => {
    if (!plate.trim()) {
      setError("Entrez une plaque d'immatriculation");
      return;
    }

    setLoading(true);
    setError(null);
    setVehicle(null);
    setE85Analysis(null);
    setStageAnalysis(null);

    try {
      const response = await fetch("/api/siv/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: plate.trim() }),
      });

      const data = await response.json();

      if (data.ok && data.vehicle) {
        // Parser toutes les données SIV disponibles
        const siv = data.vehicle;
        
        // Extraire puissance réelle en ch
        let powerHP = 0;
        if (siv.horsePower) powerHP = parseInt(siv.horsePower);
        else if (siv.puisFiscReelCH) powerHP = parseInt(siv.puisFiscReelCH);
        
        // Extraire puissance en kW
        let powerKW = 0;
        if (siv.horsePowerKW) powerKW = parseInt(siv.horsePowerKW);
        else if (siv.puisFiscReelKW) powerKW = parseInt(siv.puisFiscReelKW);
        else if (powerHP) powerKW = Math.round(powerHP * 0.7355);
        
        // Extraire cylindrée
        let engineCC = 0;
        if (siv.displacement) engineCC = parseInt(siv.displacement);
        else if (siv.ccm) engineCC = parseInt(siv.ccm);
        
        // Si pas de puissance, estimer depuis cylindrée
        if (!powerHP && engineCC) {
          powerHP = Math.round(engineCC / 12); // Estimation grossière
          powerKW = Math.round(powerHP * 0.7355);
        }
        
        // Extraire CO2
        const co2 = siv.co2 ? parseInt(siv.co2) : 0;
        
        // Extraire poids
        let weight = 1300; // Défaut
        if (siv.weight) weight = parseInt(siv.weight);
        
        // Extraire cylindres
        let cylinders = 4; // Défaut
        if (siv.cylinders) cylinders = parseInt(siv.cylinders);
        else if (engineCC < 1200) cylinders = 3;
        else if (engineCC > 2500) cylinders = 6;
        else if (engineCC > 3500) cylinders = 8;
        
        // Extraire année
        let year: number | undefined;
        if (siv.year) year = siv.year;
        else if (siv.firstRegistrationDate) {
          const parsed = new Date(siv.firstRegistrationDate);
          if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
        }
        
        // Extraire puissance fiscale
        let fiscalPower = 0;
        if (siv.fiscalPower) fiscalPower = parseInt(siv.fiscalPower);
        else if (siv.puisFisc) fiscalPower = parseInt(siv.puisFisc);
        
        const v: SIVVehicleData = {
          plate: siv.registrationNumber || plate.toUpperCase(),
          make: siv.make || siv.marque || "Inconnu",
          model: siv.model || siv.modele || "Inconnu",
          version: siv.version || siv.sraCommercial || siv.variante || "",
          year,
          fuelType: siv.fuelType || siv.energieNGC || siv.energie || "ESSENCE",
          powerHP,
          powerKW,
          fiscalPower,
          engineCC,
          cylinders,
          co2,
          weight,
          gearbox: siv.gearbox || "",
        };
        
        console.log("📊 [Comparateur] Données SIV parsées:", v);
        
        setVehicle(v);
        setE85Analysis(calculateE85Analysis(v, kmPerYear));
        setStageAnalysis(calculateStageAnalysis(v));
      } else {
        setError(data.error || "Véhicule non trouvé");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Recalculer E85 quand km/an change
  useEffect(() => {
    if (vehicle) {
      setE85Analysis(calculateE85Analysis(vehicle, kmPerYear));
    }
  }, [kmPerYear, vehicle]);

  return (
    <div style={{ 
      padding: isMobile ? '16px' : isTablet ? '24px' : '32px', 
      maxWidth: '1280px', 
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        marginBottom: '32px',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ 
              fontSize: isMobile ? '26px' : '32px', 
              fontWeight: 800, 
              color: '#111827', 
              margin: 0,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Comparateur E85 & Stage
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Nouveau
            </span>
          </div>
          <p style={{ 
            fontSize: isMobile ? '14px' : '16px', 
            color: '#6B7280', 
            margin: 0,
            maxWidth: '500px',
          }}>
            Analysez les économies E85 et les gains de puissance pour n'importe quel véhicule
          </p>
        </div>
      </div>

      {/* Search Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: isMobile ? '20px' : '28px',
        marginBottom: '28px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Car size={22} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Entrez une plaque (ex: AB-123-CD)"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                width: '100%',
                height: '60px',
                paddingLeft: '52px',
                paddingRight: '20px',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                border: '2px solid #E5E7EB',
                borderRadius: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '0 36px',
              height: '60px',
              fontSize: '16px',
              fontWeight: 700,
              color: 'white',
              background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none',
              borderRadius: '14px',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              minWidth: isMobile ? '100%' : '180px',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.4)',
            }}
          >
            {loading ? <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={22} />}
            {loading ? "Analyse..." : "Analyser"}
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '16px',
            padding: '14px 18px',
            backgroundColor: '#FEF2F2',
            borderRadius: '12px',
            color: '#DC2626',
            border: '1px solid #FECACA',
          }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
          </div>
        )}
      </div>

      {/* Results */}
      {vehicle && (
        <>
          {/* Vehicle Info Card */}
          <div style={{
            borderRadius: '20px',
            padding: isMobile ? '24px' : '32px',
            marginBottom: '28px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              gap: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}>
                  <Car size={36} style={{ color: 'white' }} />
                </div>
                <div>
                  <h2 style={{ 
                    fontSize: isMobile ? '24px' : '28px', 
                    fontWeight: 800, 
                    color: 'white', 
                    margin: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {vehicle.version && <span>{vehicle.version}</span>}
                    {vehicle.year && <span>• {vehicle.year}</span>}
                    <span style={{ 
                      padding: '4px 12px', 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backdropFilter: 'blur(5px)',
                    }}>
                      {vehicle.plate}
                    </span>
                  </p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '24px' : '40px',
                padding: isMobile ? '16px 0 0 0' : '0',
              }}>
                {vehicle.powerHP > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{vehicle.powerHP}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: 500 }}>chevaux</div>
                  </div>
                )}
                {vehicle.engineCC > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{(vehicle.engineCC / 1000).toFixed(1)}L</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: 500 }}>cylindrée</div>
                  </div>
                )}
                {vehicle.co2 > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{vehicle.co2}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: 500 }}>g CO₂/km</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '28px',
            padding: '8px',
            backgroundColor: '#F3F4F6',
            borderRadius: '16px',
          }}>
            <button
              onClick={() => setActiveTab("e85")}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px 24px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === 'e85' ? 'white' : 'transparent',
                color: activeTab === 'e85' ? '#10B981' : '#6B7280',
                boxShadow: activeTab === 'e85' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Leaf size={20} />
              Conversion E85
            </button>
            <button
              onClick={() => setActiveTab("stage")}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px 24px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === 'stage' ? 'white' : 'transparent',
                color: activeTab === 'stage' ? '#F59E0B' : '#6B7280',
                boxShadow: activeTab === 'stage' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Flame size={20} />
              Reprogrammation Stage
            </button>
          </div>

          {/* E85 Tab Content */}
          {activeTab === 'e85' && e85Analysis && (
            <div>
              {e85Analysis.compatible ? (
                <>
                  {/* Compatibility Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '18px 24px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '16px',
                    marginBottom: '28px',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      backgroundColor: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}>
                      <CheckCircle size={26} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <span style={{ fontSize: '17px', fontWeight: 700, color: '#065F46' }}>Compatible E85</span>
                      <p style={{ fontSize: '14px', color: '#6B7280', margin: '2px 0 0 0' }}>
                        Votre {vehicle.make} {vehicle.model} peut être converti au bioéthanol
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                    gap: '16px',
                    marginBottom: '28px',
                  }}>
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '18px', 
                      padding: '24px', 
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}>
                        <Euro size={24} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{e85Analysis.savingsPerYear}€</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>économie / an</div>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '18px', 
                      padding: '24px', 
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      }}>
                        <Clock size={24} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#3B82F6', lineHeight: 1 }}>{e85Analysis.roiMonths}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>mois rentabilisé</div>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '18px', 
                      padding: '24px', 
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      }}>
                        <Settings2 size={24} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{e85Analysis.conversionCost}€</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>coût conversion</div>
                    </div>
                    
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '18px', 
                      padding: '24px', 
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      }}>
                        <Leaf size={24} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#8B5CF6', lineHeight: 1 }}>-{e85Analysis.co2ReductionPercent}%</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>émissions CO2</div>
                    </div>
                  </div>

                  {/* Paramètres personnalisés */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: isMobile ? '24px' : '32px',
                    marginBottom: '28px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '20px' }}>
                      📊 Vos paramètres de conduite
                    </h3>
                    
                    {/* Slider km/an */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>Kilomètres par an</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#6366F1' }}>{kmPerYear.toLocaleString()} km</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="50000"
                        step="1000"
                        value={kmPerYear}
                        onChange={(e) => setKmPerYear(parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${((kmPerYear - 5000) / 45000) * 100}%, #E5E7EB ${((kmPerYear - 5000) / 45000) * 100}%, #E5E7EB 100%)`,
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>5 000</span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>50 000</span>
                      </div>
                    </div>
                    
                    {/* Données techniques du véhicule */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '12px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Conso. estimée</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{e85Analysis.estimatedConsumption} L/100km</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Litres SP95/an</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{e85Analysis.litersPerYear} L</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Litres E85/an</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{e85Analysis.e85LitersPerYear} L</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>Surconso. E85</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#F59E0B' }}>+{e85Analysis.e85OverconsumptionPercent}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Comparison Chart */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: isMobile ? '24px' : '32px',
                    marginBottom: '28px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                      Comparaison des coûts annuels
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                      Basé sur {kmPerYear.toLocaleString()} km/an et {e85Analysis.estimatedConsumption} L/100km (calculé selon votre véhicule)
                    </p>
                    <CostBars e85Analysis={e85Analysis} isMobile={isMobile} />
                    
                    {/* Détail CO2 */}
                    {vehicle.co2 > 0 && (
                      <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <Leaf size={24} style={{ color: '#8B5CF6' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#5B21B6' }}>
                            🌱 Économisez {e85Analysis.co2SavedKgPerYear} kg de CO₂ par an
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            Réduction de {e85Analysis.co2ReductionPercent}% des émissions fossiles grâce au bioéthanol
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    borderRadius: '20px',
                    padding: isMobile ? '24px' : '32px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: '0 0 6px 0' }}>
                        Prêt à convertir votre véhicule ?
                      </h3>
                      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                        Demandez un devis personnalisé dès maintenant
                      </p>
                    </div>
                    <Link href="/interventions/nouveau" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px 32px',
                      backgroundColor: 'white',
                      color: '#059669',
                      borderRadius: '14px',
                      fontSize: '16px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      Demander un devis
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '40px',
                  textAlign: 'center',
                  border: '1px solid #E5E7EB',
                }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <AlertCircle size={36} style={{ color: '#F59E0B' }} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                    Non compatible E85
                  </h3>
                  <p style={{ fontSize: '15px', color: '#6B7280', maxWidth: '400px', margin: '0 auto' }}>
                    {e85Analysis.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stage Tab Content */}
          {activeTab === 'stage' && stageAnalysis && vehicle && (
            <div>
              {/* Turbo Info Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px 24px',
                backgroundColor: stageAnalysis.isTurbo ? 'rgba(245, 158, 11, 0.08)' : 'rgba(107, 114, 128, 0.08)',
                borderRadius: '16px',
                marginBottom: '28px',
                border: `2px solid ${stageAnalysis.isTurbo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: stageAnalysis.isTurbo ? '#F59E0B' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${stageAnalysis.isTurbo ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                }}>
                  <Zap size={26} style={{ color: 'white' }} />
                </div>
                <div>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: stageAnalysis.isTurbo ? '#92400E' : '#374151' }}>
                    {stageAnalysis.turboType || (stageAnalysis.isTurbo ? 'Moteur turbo détecté' : 'Moteur atmosphérique')}
                  </span>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: '2px 0 0 0' }}>
                    {stageAnalysis.isTurbo 
                      ? `Potentiel de gains élevé grâce au turbo • ${vehicle.powerHP} ch → jusqu'à ${stageAnalysis.stage3.available ? stageAnalysis.stage3.newPowerHP : stageAnalysis.stage2.newPowerHP} ch`
                      : `Gains limités sur moteur atmosphérique • ${vehicle.powerHP} ch → ${stageAnalysis.stage1.newPowerHP} ch max réaliste`
                    }
                  </p>
                </div>
              </div>

              {/* Stage Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '24px',
              }}>
                <StageCard
                  stage={stageAnalysis.stage1}
                  stageNumber={1}
                  basePower={vehicle.powerHP}
                  baseTorque={estimateTorque(vehicle)}
                  isMobile={isMobile}
                  color="#3B82F6"
                  icon={Settings2}
                />
                <StageCard
                  stage={stageAnalysis.stage2}
                  stageNumber={2}
                  basePower={vehicle.powerHP}
                  baseTorque={estimateTorque(vehicle)}
                  isMobile={isMobile}
                  color="#F59E0B"
                  icon={Zap}
                />
                <StageCard
                  stage={stageAnalysis.stage3}
                  stageNumber={3}
                  basePower={vehicle.powerHP}
                  baseTorque={estimateTorque(vehicle)}
                  isMobile={isMobile}
                  color="#EF4444"
                  icon={Flame}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!vehicle && !loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '24px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
            }}>
              <Leaf size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
              Conversion E85
            </h3>
            <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.6 }}>
              Économisez jusqu'à 50% sur votre carburant en passant au bioéthanol. Compatible avec la plupart des véhicules essence.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Économies significatives', 'Réduction CO2 de 50%', 'Homologation possible'].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6B7280', marginBottom: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#10B981' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 6px 16px rgba(245, 158, 11, 0.3)',
            }}>
              <Flame size={32} style={{ color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
              Reprogrammation Stage
            </h3>
            <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.6 }}>
              Libérez le potentiel de votre moteur avec une reprogrammation sur mesure. De Stage 1 à Stage 3.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {["Gain de puissance jusqu'à +70%", 'Meilleur couple moteur', 'Réponse accélérateur améliorée'].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#6B7280', marginBottom: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#F59E0B' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
