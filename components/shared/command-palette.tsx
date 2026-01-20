"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Car,
  Wrench,
  FileText,
  Receipt,
  Settings,
  Plus,
  Search,
  Calendar,
  Home,
  HelpCircle,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

// Quick actions
const quickActions = [
  {
    label: "Nouveau client",
    icon: Users,
    href: "/clients/nouveau",
    shortcut: "C",
  },
  {
    label: "Nouvelle intervention",
    icon: Wrench,
    href: "/interventions/nouveau",
    shortcut: "I",
  },
  {
    label: "Nouveau véhicule",
    icon: Car,
    href: "/vehicules/nouveau",
    shortcut: "V",
  },
  {
    label: "Nouveau devis",
    icon: FileText,
    href: "/devis/nouveau",
    shortcut: "D",
  },
];

// Navigation items
const navItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Clients", icon: Users, href: "/clients" },
  { label: "Véhicules", icon: Car, href: "/vehicules" },
  { label: "Interventions", icon: Wrench, href: "/interventions" },
  { label: "Devis", icon: FileText, href: "/devis" },
  { label: "Factures", icon: Receipt, href: "/factures" },
  { label: "Planning", icon: Calendar, href: "/planning" },
  { label: "Paramètres", icon: Settings, href: "/parametres" },
  { label: "Aide", icon: HelpCircle, href: "/aide" },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const router = useRouter();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher ou exécuter une action..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-center">
            <Search className="h-10 w-10 text-[var(--ms-text-muted)] mb-3" />
            <p className="text-sm text-[var(--ms-text-secondary)]">
              Aucun résultat trouvé.
            </p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Actions rapides">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={action.label}
              onSelect={() => handleSelect(action.href)}
            >
              <Plus className="mr-2 h-4 w-4 text-[var(--ms-primary)]" />
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
              <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Hook for triggering command palette from anywhere
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  
  const trigger = React.useCallback(() => {
    setOpen(true);
  }, []);

  return { open, setOpen, trigger };
}
