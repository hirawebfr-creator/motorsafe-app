import { test, expect } from '@playwright/test'

// ============================================================================
// TEST: Parcours de connexion
// Ces tests vérifient le parcours utilisateur sur la page login
// ============================================================================

test.describe('Parcours de connexion', () => {
  
  test('doit afficher la page de connexion', async ({ page }) => {
    // Aller sur la page login
    await page.goto('/auth/login')
    
    // Vérifier les éléments clés
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
  })
  
  test('doit se connecter avec les identifiants test', async ({ page }) => {
    // Credentials du seed-test-data
    const testEmail = 'test@motorsafe.fr'
    const testPassword = 'TestPassword123!'
    
    await page.goto('/auth/login')
    
    // Remplir le formulaire avec selectors robustes
    await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail)
    await page.locator('input[type="password"]').fill(testPassword)
    
    // Soumettre
    await page.getByRole('button', { name: 'Se connecter' }).click()
    
    // Attendre la redirection vers dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    // Vérifier qu'on est sur le dashboard
    await expect(page.url()).toContain('/dashboard')
  })
  
  test('doit refuser des identifiants incorrects', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Remplir avec de mauvais identifiants
    await page.locator('input[type="email"], input[name="email"]').first().fill('wrong@email.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    
    await page.getByRole('button', { name: 'Se connecter' }).click()
    
    // Attendre une erreur (soit toast soit message inline)
    // On reste sur la même page
    await page.waitForTimeout(2000)
    await expect(page.url()).toContain('/auth/login')
  })
  
  test('doit afficher le lien mot de passe oublié', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Le lien existe
    const forgotLink = page.getByRole('link', { name: /mot de passe oublié/i })
    await expect(forgotLink).toBeVisible()
    
    // Vérifier l'attribut href
    await expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
  })
  
})
