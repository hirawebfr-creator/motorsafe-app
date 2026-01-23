import { test, expect } from '../fixtures/auth'

test.describe('Parcours inscription garage', () => {
  test('doit permettre de créer un compte garage complet', async ({ page, helpers }) => {
    // Étape 1 : Aller sur la page inscription
    await page.goto('/pro/inscription')
    await helpers.waitForPageLoad()
    
    // Vérifier que le stepper s'affiche
    await expect(page.getByText('Créez votre compte')).toBeVisible()
    
    // Étape 2 : Remplir les informations de compte
    await helpers.fillFormField('Prénom', 'Jean')
    await helpers.fillFormField('Nom', 'Dupont')
    await helpers.fillFormField('Email', 'jean.dupont.test@example.com')
    await helpers.fillFormField('Mot de passe', 'SecurePass123!')
    await helpers.fillFormField('Confirmer le mot de passe', 'SecurePass123!')
    
    // Click "Suivant"
    await helpers.clickButton('Suivant')
    await helpers.waitForPageLoad()
    
    // Étape 3 : Remplir les informations du garage
    await helpers.fillFormField('Nom du garage', 'Garage Test E2E')
    await helpers.fillFormField('Adresse', '123 Rue de Test')
    await helpers.fillFormField('Code postal', '75001')
    await helpers.fillFormField('Ville', 'Paris')
    await helpers.fillFormField('SIRET', '12345678901234')
    await helpers.fillFormField('Téléphone', '0612345678')
    
    // Click "Suivant"
    await helpers.clickButton('Suivant')
    await helpers.waitForPageLoad()
    
    // Étape 4 : Choisir un plan
    // Cliquer sur le plan "Essentiel"
    const essentialPlan = page.locator('text=Essentiel').first()
    await essentialPlan.click()
    await page.waitForTimeout(500) // Attendre animation
    
    // Click "Suivant"
    await helpers.clickButton('Suivant')
    await helpers.waitForPageLoad()
    
    // Étape 5 : Accepter les CGU
    const cguCheckbox = page.locator('input[type="checkbox"]').first()
    await cguCheckbox.check()
    
    const cgvCheckbox = page.locator('input[type="checkbox"]').nth(1)
    await cgvCheckbox.check()
    
    // Click "Créer mon compte"
    await helpers.clickButton('Créer mon compte')
    
    // Vérifier la redirection vers le dashboard
    await helpers.waitForPageLoad()
    await helpers.expectUrl('/dashboard')
    
    // Vérifier que le dashboard s'affiche
    await expect(page.getByText('Tableau de bord')).toBeVisible()
    
    // Vérifier qu'on voit bien le nom du garage
    await expect(page.getByText('Garage Test E2E')).toBeVisible()
  })
  
  test('doit afficher des erreurs de validation si formulaire incomplet', async ({ page, helpers }) => {
    await page.goto('/pro/inscription')
    await helpers.waitForPageLoad()
    
    // Essayer de passer à l'étape suivante sans remplir
    await helpers.clickButton('Suivant')
    
    // Vérifier les messages d'erreur
    await expect(page.getByText('Le prénom est requis')).toBeVisible()
    await expect(page.getByText('Le nom est requis')).toBeVisible()
    await expect(page.getByText("L'email est requis")).toBeVisible()
    await expect(page.getByText('Le mot de passe est requis')).toBeVisible()
    
    // Vérifier qu'on est toujours sur l'étape 1
    await expect(page.getByText('Créez votre compte')).toBeVisible()
  })
  
  test('doit vérifier que les mots de passe correspondent', async ({ page, helpers }) => {
    await page.goto('/pro/inscription')
    await helpers.waitForPageLoad()
    
    await helpers.fillFormField('Prénom', 'Jean')
    await helpers.fillFormField('Nom', 'Dupont')
    await helpers.fillFormField('Email', 'jean.dupont@example.com')
    await helpers.fillFormField('Mot de passe', 'SecurePass123!')
    await helpers.fillFormField('Confirmer le mot de passe', 'DifferentPass123!')
    
    await helpers.clickButton('Suivant')
    
    // Vérifier le message d'erreur
    await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible()
  })
})
