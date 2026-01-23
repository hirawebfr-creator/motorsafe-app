import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Plus, Save, Trash, Settings, Search } from 'lucide-react'

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-bold text-text mb-2">Design System - MotorSafe</h1>
          <p className="text-muted">Tailwind + shadcn/ui + Design Tokens</p>
        </header>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Buttons</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text">Variants</h3>
            <div className="flex gap-4 flex-wrap">
              <Button>Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text">Sizes</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text">With Icons</h3>
            <div className="flex gap-4 flex-wrap">
              <Button><Plus className="h-4 w-4" /> Ajouter</Button>
              <Button variant="secondary"><Save className="h-4 w-4" /> Sauvegarder</Button>
              <Button variant="destructive"><Trash className="h-4 w-4" /> Supprimer</Button>
              <Button variant="outline"><Settings className="h-4 w-4" /> Paramètres</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text">States</h3>
            <div className="flex gap-4 flex-wrap">
              <Button disabled>Disabled</Button>
              <Button className="opacity-50 cursor-wait">Loading...</Button>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Badges</h2>
          
          <div className="flex gap-4 flex-wrap">
            <Badge>Default (neutral)</Badge>
            <Badge variant="success">Succès</Badge>
            <Badge variant="warning">Attention</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="neutral">Neutre</Badge>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Card Simple</h3>
              <p className="text-muted text-sm">Contenu de la carte avec du texte descriptif.</p>
            </Card>
            
            <Card className="p-6 border-primary/20 bg-primary/5">
              <h3 className="text-lg font-semibold mb-2">Card Accent</h3>
              <p className="text-muted text-sm">Avec une touche de couleur primaire.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Card avec Action</h3>
              <p className="text-muted text-sm mb-4">Description courte.</p>
              <Button size="sm">Action</Button>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Inputs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Input Standard</label>
              <Input placeholder="Entrez du texte..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Avec Icône</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input className="pl-10" placeholder="Rechercher..." />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Disabled</label>
              <Input disabled placeholder="Non modifiable" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Avec Erreur</label>
              <Input className="border-destructive focus:ring-destructive" placeholder="Erreur..." />
              <p className="text-xs text-destructive">Ce champ est requis</p>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Couleurs</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-success"></div>
              <p className="text-sm font-medium">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-warning"></div>
              <p className="text-sm font-medium">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-destructive"></div>
              <p className="text-sm font-medium">Destructive</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-bg border border-border"></div>
              <p className="text-sm font-medium">Background</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-surface border border-border"></div>
              <p className="text-sm font-medium">Surface</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-text"></div>
              <p className="text-sm font-medium">Text</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-muted"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Typography</h2>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Heading 1 - text-4xl font-bold</h1>
            <h2 className="text-3xl font-semibold tracking-tight">Heading 2 - text-3xl font-semibold</h2>
            <h3 className="text-2xl font-semibold">Heading 3 - text-2xl font-semibold</h3>
            <h4 className="text-xl font-semibold">Heading 4 - text-xl font-semibold</h4>
            <h5 className="text-lg font-medium">Heading 5 - text-lg font-medium</h5>
            <p className="text-base">Body - text-base (16px)</p>
            <p className="text-sm text-muted">Small - text-sm text-muted (14px)</p>
            <p className="text-xs text-muted2">Caption - text-xs text-muted2 (12px)</p>
          </div>
        </section>

        {/* Spacing Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">Spacing</h2>
          
          <div className="flex gap-4 items-end">
            <div className="space-y-1">
              <div className="w-8 h-1 bg-primary"></div>
              <p className="text-xs text-muted">4px</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-2 bg-primary"></div>
              <p className="text-xs text-muted">8px</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-4 bg-primary"></div>
              <p className="text-xs text-muted">16px</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-6 bg-primary"></div>
              <p className="text-xs text-muted">24px</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 bg-primary"></div>
              <p className="text-xs text-muted">32px</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-12 bg-primary"></div>
              <p className="text-xs text-muted">48px</p>
            </div>
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-center text-sm text-muted">
          MotorSafe Design System &copy; 2026
        </footer>
      </div>
    </div>
  )
}
