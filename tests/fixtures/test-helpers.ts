import { Page, expect } from '@playwright/test'

export class TestHelpers {
  constructor(public page: Page) {}
  
  // Helper : Attendre le chargement complet
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForLoadState('domcontentloaded')
  }
  
  // Helper : Remplir un FormField
  async fillFormField(label: string, value: string) {
    const input = this.page.getByLabel(label)
    await input.fill(value)
  }
  
  // Helper : Vérifier toast success
  async expectSuccessToast(message: string) {
    const toast = this.page.locator('[role="status"]', { hasText: message })
    await expect(toast).toBeVisible({ timeout: 5000 })
  }
  
  // Helper : Vérifier toast error
  async expectErrorToast(message: string) {
    const toast = this.page.locator('[role="status"]', { hasText: message })
    await expect(toast).toBeVisible({ timeout: 5000 })
  }
  
  // Helper : Click sur bouton avec loading
  async clickButton(text: string) {
    const button = this.page.getByRole('button', { name: text })
    await button.click()
    // Attendre que le loading disparaisse
    await expect(button).not.toHaveAttribute('disabled', { timeout: 10000 })
  }
  
  // Helper : Vérifier navigation
  async expectUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path))
  }
  
  // Helper : Attendre un élément visible
  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' })
  }
  
  // Helper : Vérifier que le texte est présent
  async expectText(text: string) {
    await expect(this.page.getByText(text)).toBeVisible()
  }
  
  // Helper : Sélectionner une option dans un Select
  async selectOption(label: string, value: string) {
    const select = this.page.getByLabel(label)
    await select.selectOption(value)
  }
  
  // Helper : Cliquer sur un lien
  async clickLink(text: string) {
    await this.page.getByRole('link', { name: text }).click()
  }
  
  // Helper : Attendre la fin d'une requête API
  async waitForApi(urlPattern: string | RegExp) {
    await this.page.waitForResponse(response => 
      response.url().match(urlPattern) !== null && response.status() === 200
    )
  }
}
