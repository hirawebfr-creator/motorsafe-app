import { test as base, Page } from '@playwright/test'
import { TestHelpers } from './test-helpers'

// Mock user pour les tests
export const mockUser = {
  email: 'test@motorsafe.fr',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  garageName: 'Garage Test',
  garageAddress: '123 Rue Test',
  garagePostalCode: '75001',
  garageCity: 'Paris',
  garageSiret: '12345678901234'
}

type TestFixtures = {
  helpers: TestHelpers
  authenticatedPage: Page
}

export const test = base.extend<TestFixtures>({
  helpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page)
    await use(helpers)
  },
  
  authenticatedPage: async ({ page, helpers }, use) => {
    // Se connecter avant chaque test qui nécessite auth
    await page.goto('/auth/login')
    await helpers.fillFormField('Email', mockUser.email)
    await helpers.fillFormField('Mot de passe', mockUser.password)
    await helpers.clickButton('Se connecter')
    await helpers.waitForPageLoad()
    await helpers.expectUrl('/dashboard')
    
    await use(page)
  }
})

export { expect } from '@playwright/test'
