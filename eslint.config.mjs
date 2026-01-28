import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // MotorSafe: lint uniquement la surface UI.
    "app/api/**",
    "prisma/**",
    "scripts/**",
    "lib/**",
    "types/**",
    "docs/**",
  ]),

  {
    rules: {
      // Trop agressif pour nos patterns (loading/error) et pénalise des useEffect légitimes.
      "react-hooks/set-state-in-effect": "off",
      // Désactivé: le français utilise naturellement des apostrophes, les navigateurs modernes les gèrent bien
      "react/no-unescaped-entities": "off",
      // Désactivé: trop strict pour du code legacy, on préfère un typage progressif
      "@typescript-eslint/no-explicit-any": "warn",
      // Désactivé: règles React Compiler trop strictes pour le code existant
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;
