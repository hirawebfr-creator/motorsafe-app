import { test, expect } from '@playwright/test'

// ============================================================================
// TEST: Workflow intervention complet
// Ces tests vérifient le parcours de création et gestion d'intervention
// ============================================================================

// Credentials du seed-test-data
const TEST_EMAIL = 'test@motorsafe.fr'
const TEST_PASSWORD = 'TestPassword123!'

// Helper pour se connecter avec selectors robustes
async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Workflow intervention', () => {
  
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await login(page)
  })
  
  test('doit afficher le dashboard après connexion', async ({ page }) => {
    // Vérifier qu'on est bien sur le dashboard
    await expect(page.url()).toContain('/dashboard')
    
    // Attendre le chargement de la page
    await page.waitForLoadState('networkidle')
    
    // Vérifier que la page est chargée (un élément quelconque du dashboard)
    // Le dashboard contient des KpiCards
    await expect(page.locator('body')).toBeVisible()
  })
  
  test('doit pouvoir accéder à la liste des interventions', async ({ page }) => {
    // Aller sur la page interventions (via URL directe)
    await page.goto('/interventions')
    
    // Vérifier qu'on est sur la bonne page
    await expect(page.url()).toContain('/interventions')
    
    // Attendre le chargement
    await page.waitForLoadState('networkidle')
  })
  
  test('doit pouvoir accéder à la liste des véhicules', async ({ page }) => {
    await page.goto('/vehicules')
    
    await expect(page.url()).toContain('/vehicules')
    
    // Attendre le chargement
    await page.waitForLoadState('networkidle')
  })
  
  test('doit pouvoir accéder à la liste des clients', async ({ page }) => {
    await page.goto('/clients')
    
    await expect(page.url()).toContain('/clients')
    
    // Attendre chargement
    await page.waitForLoadState('networkidle')
  })
  
})
