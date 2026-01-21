"use client";

import { KpiCard } from '@/components/shared/kpi-card'
import { Wrench, Euro, Users, Car } from 'lucide-react'

export default function TestKpiPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test KpiCard</h1>
      
      {/* Test 1 : Basique - FIX GRID */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <KpiCard
          title="Interventions en cours"
          value={12}
          variation={15.3}
          icon={Wrench}
        />
        
        <KpiCard
          title="CA du mois"
          value="8 450€"
          variation={-2.4}
          icon={Euro}
          sparkline={[10, 15, 12, 20, 18, 25, 30]}
        />
        
        <KpiCard
          title="Clients actifs"
          value={45}
          variation={8.1}
          icon={Users}
        />
        
        <KpiCard
          title="Véhicules suivis"
          value={78}
          icon={Car}
        />
      </div>

      {/* Test 2 : Sans icône - FIX GRID */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <KpiCard title="Total" value="12 345€" variation={5.2} />
        <KpiCard title="Moyenne" value="456€" variation={0} />
        <KpiCard title="Maximum" value="1 234€" variation={-10.5} />
      </div>

      {/* Test 3 : Avec sparkline long - FIX GRID */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        <KpiCard
          title="Évolution 30 jours"
          value="2 345€"
          variation={12.8}
          icon={Euro}
          sparkline={[100, 120, 115, 140, 130, 150, 145, 160, 155, 170, 165, 180, 175, 190, 185, 200]}
        />
        
        <KpiCard
          title="Tendance interventions"
          value={156}
          variation={-5.3}
          icon={Wrench}
          sparkline={[50, 55, 52, 60, 58, 65, 63, 70, 68, 75, 72, 78]}
        />
      </div>
    </div>
  )
}
