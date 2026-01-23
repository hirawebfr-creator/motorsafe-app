import { test, expect } from '../fixtures/auth'

test.describe('Parcours création intervention complète', () => {
  test('doit créer un client, un véhicule, et une intervention', async ({ authenticatedPage: page, helpers }) => {
    // === ÉTAPE 1 : CRÉER UN CLIENT ===
    await page.goto('/clients')
    await helpers.waitForPageLoad()
    
    // Click "Nouveau client"
    await helpers.clickButton('Nouveau client')
    await page.waitForTimeout(300) // Attendre ouverture modal
    
    // Remplir le formulaire client
    await helpers.fillFormField('Prénom', 'Marie')
    await helpers.fillFormField('Nom', 'Martin')
    await helpers.fillFormField('Email', 'marie.martin.test@example.com')
    await helpers.fillFormField('Téléphone', '0698765432')
    await helpers.fillFormField('Adresse', '45 Avenue Test')
    await helpers.fillFormField('Code postal', '69002')
    await helpers.fillFormField('Ville', 'Lyon')
    
    // Sauvegarder
    await page.locator('button:has-text("Enregistrer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Client créé')
    
    // Vérifier que le client apparaît dans la liste
    await expect(page.getByText('Marie Martin')).toBeVisible()
    
    // === ÉTAPE 2 : CRÉER UN VÉHICULE ===
    await page.goto('/vehicules')
    await helpers.waitForPageLoad()
    
    // Click "Nouveau véhicule"
    await helpers.clickButton('Nouveau véhicule')
    await page.waitForTimeout(300)
    
    // Remplir le formulaire véhicule
    const clientSelect = page.locator('select').first()
    await clientSelect.selectOption({ label: 'Marie Martin' })
    
    await helpers.fillFormField('Immatriculation', 'AB-123-CD')
    await helpers.fillFormField('VIN', '1HGBH41JXMN109186')
    await helpers.fillFormField('Marque', 'Peugeot')
    await helpers.fillFormField('Modèle', '208')
    await helpers.fillFormField('Version', 'Active')
    await helpers.fillFormField('Année', '2020')
    
    const fuelSelect = page.locator('select[name="fuelType"]')
    await fuelSelect.selectOption('ESSENCE')
    
    await helpers.fillFormField('Kilométrage', '25000')
    await helpers.fillFormField('Couleur', 'Blanc')
    
    // Sauvegarder
    await page.locator('button:has-text("Enregistrer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Véhicule créé')
    
    // Vérifier que le véhicule apparaît
    await expect(page.getByText('Peugeot 208')).toBeVisible()
    await expect(page.getByText('AB-123-CD')).toBeVisible()
    
    // === ÉTAPE 3 : CRÉER UNE INTERVENTION ===
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    // Click "Nouvelle intervention"
    await helpers.clickButton('Nouvelle intervention')
    await page.waitForTimeout(300)
    
    // Remplir le formulaire intervention
    const clientSelectIntervention = page.locator('select[name="clientId"]')
    await clientSelectIntervention.selectOption({ label: 'Marie Martin' })
    
    // Attendre que les véhicules se chargent
    await page.waitForTimeout(500)
    
    const vehicleSelect = page.locator('select[name="vehicleId"]')
    // Sélectionner le premier véhicule disponible (celui qu'on vient de créer)
    await vehicleSelect.selectOption({ index: 1 })
    
    // Date d'entrée (aujourd'hui)
    const today = new Date().toISOString().split('T')[0]
    await page.locator('input[name="entryDate"]').fill(today)
    
    await helpers.fillFormField('Kilométrage', '25000')
    
    const descriptionTextarea = page.locator('textarea[name="description"]')
    await descriptionTextarea.fill('Révision 25 000 km + changement filtre à air')
    
    // Sauvegarder
    await page.locator('button:has-text("Enregistrer")').click()
    
    // Vérifier le toast success
    await helpers.expectSuccessToast('Intervention créée')
    
    // Vérifier que l'intervention apparaît
    await expect(page.getByText('Marie Martin')).toBeVisible()
    await expect(page.getByText('Peugeot 208')).toBeVisible()
    await expect(page.getByText('Révision 25 000 km')).toBeVisible()
    
    // Vérifier le badge statut "En attente"
    await expect(page.getByText('En attente')).toBeVisible()
  })
  
  test('doit empêcher la création sans client sélectionné', async ({ authenticatedPage: page, helpers }) => {
    await page.goto('/interventions')
    await helpers.waitForPageLoad()
    
    await helpers.clickButton('Nouvelle intervention')
    await page.waitForTimeout(300)
    
    // Essayer de sauvegarder sans remplir
    await page.locator('button:has-text("Enregistrer")').click()
    
    // Vérifier les messages d'erreur
    await expect(page.getByText('Le client est requis')).toBeVisible()
  })
})
