import { test, expect } from '../fixtures/auth'

test.describe('Workflow statuts intervention', () => {
  test('doit permettre de passer une intervention EN_ATTENTE → EN_COURS → TERMINE', async ({ authenticatedPage: page, helpers }) => {
    // Créer une intervention de test rapidement via l'UI
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    // Supposons qu'il y a déjà une intervention en EN_ATTENTE dans la liste
    // Sinon, en créer une d'abord (code de création ici)
    
    // Cliquer sur la première intervention EN_ATTENTE
    const interventionRow = page.locator('text=En attente').first()
    await interventionRow.click()
    await helpers.waitForPageLoad()
    
    // Vérifier qu'on est sur la page de détail
    await expect(page).toHaveURL(/\/interventions\/[^/]+/)
    
    // Vérifier le badge initial "En attente"
    await expect(page.getByText('En attente')).toBeVisible()
    
    // === PASSAGE EN_COURS ===
    await helpers.clickButton('Changer statut')
    await page.waitForTimeout(300)
    
    // Vérifier que le modal s'ouvre
    await expect(page.getByText('Changer le statut')).toBeVisible()
    
    // Le select devrait avoir "En cours" pré-sélectionné
    const statusSelect = page.locator('select').first()
    await expect(statusSelect).toHaveValue('EN_COURS')
    
    // Ajouter un commentaire
    const commentTextarea = page.locator('textarea[name="statusComment"]')
    await commentTextarea.fill('Début des travaux')
    
    // Confirmer
    await page.locator('button:has-text("Changer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Statut modifié')
    
    // Vérifier que le badge a changé
    await expect(page.getByText('En cours')).toBeVisible()
    
    // Vérifier que l'événement apparaît dans la timeline
    await expect(page.getByText('Intervention démarrée')).toBeVisible()
    await expect(page.getByText('Début des travaux')).toBeVisible()
    
    // === PASSAGE TERMINE ===
    await helpers.clickButton('Changer statut')
    await page.waitForTimeout(300)
    
    // Le select devrait avoir "Terminée" pré-sélectionné
    await expect(statusSelect).toHaveValue('TERMINE')
    
    // Ajouter un commentaire
    await commentTextarea.fill('Travaux terminés avec succès')
    
    // Confirmer
    await page.locator('button:has-text("Changer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Statut modifié')
    
    // Vérifier que le badge a changé
    await expect(page.getByText('Terminée')).toBeVisible()
    
    // Vérifier que le bouton "Changer statut" n'est plus visible (lock)
    await expect(page.getByRole('button', { name: 'Changer statut' })).not.toBeVisible()
    
    // Vérifier qu'on peut maintenant générer une facture
    await expect(page.getByText('Générer facture')).toBeVisible()
  })
  
  test('doit permettre d\'annuler une intervention à tout moment', async ({ authenticatedPage: page, helpers }) => {
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    // Cliquer sur une intervention EN_COURS
    const interventionRow = page.locator('text=En cours').first()
    await interventionRow.click()
    await helpers.waitForPageLoad()
    
    // Changer le statut
    await helpers.clickButton('Changer statut')
    await page.waitForTimeout(300)
    
    // Sélectionner "Annulée"
    const statusSelect = page.locator('select').first()
    await statusSelect.selectOption('ANNULE')
    
    // Ajouter un commentaire obligatoire
    const commentTextarea = page.locator('textarea[name="statusComment"]')
    await commentTextarea.fill('Client a annulé la commande')
    
    // Confirmer
    await page.locator('button:has-text("Changer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Statut modifié')
    
    // Vérifier que le badge a changé
    await expect(page.getByText('Annulée')).toBeVisible()
    
    // Vérifier que le bouton "Changer statut" n'est plus visible (lock)
    await expect(page.getByRole('button', { name: 'Changer statut' })).not.toBeVisible()
  })
  
  test('doit empêcher le changement de statut si intervention terminée', async ({ authenticatedPage: page, helpers }) => {
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    // Cliquer sur une intervention TERMINE
    const interventionRow = page.locator('text=Terminée').first()
    
    // Si pas d'intervention terminée, skip le test
    const count = await interventionRow.count()
    if (count === 0) {
      test.skip()
      return
    }
    
    await interventionRow.click()
    await helpers.waitForPageLoad()
    
    // Vérifier que le bouton "Changer statut" n'existe pas
    await expect(page.getByRole('button', { name: 'Changer statut' })).not.toBeVisible()
    
    // Vérifier qu'on voit bien "Terminée"
    await expect(page.getByText('Terminée')).toBeVisible()
  })
  
  test('doit afficher la timeline complète des changements', async ({ authenticatedPage: page, helpers }) => {
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    // Cliquer sur une intervention
    const interventionRow = page.locator('[data-testid="intervention-row"]').first()
    await interventionRow.click()
    await helpers.waitForPageLoad()
    
    // Vérifier que la section "Historique" existe
    await expect(page.getByText('Historique')).toBeVisible()
    
    // Vérifier qu'il y a au moins un événement "Intervention créée"
    await expect(page.getByText('Intervention créée')).toBeVisible()
    
    // Vérifier que chaque événement a un timestamp
    const timestamps = page.locator('text=/\\d{2}\\/\\d{2}\\/\\d{4} à \\d{2}:\\d{2}/')
    await expect(timestamps.first()).toBeVisible()
  })
})
