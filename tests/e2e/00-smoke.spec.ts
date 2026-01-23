import { test, expect } from '@playwright/test'

test.describe('Smoke tests - Pages principales', () => {
  test('Page login accessible', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)
    // Vérifie qu'il y a un formulaire
    await expect(page.locator('form')).toBeVisible()
  })
  
  test('Page inscription pro accessible', async ({ page }) => {
    await page.goto('/pro/inscription')
    await expect(page).toHaveURL(/\/pro\/inscription/)
  })
  
  test('Dashboard nécessite auth', async ({ page }) => {
    await page.goto('/dashboard')
    // Devrait rediriger vers login
    await expect(page).toHaveURL(/\/auth\/login/)
  })
  
  test('Page véhicules nécessite auth', async ({ page }) => {
    await page.goto('/vehicules')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
  
  test('Page clients nécessite auth', async ({ page }) => {
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
