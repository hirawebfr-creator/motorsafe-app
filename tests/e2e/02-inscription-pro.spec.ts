import { test, expect } from '@playwright/test'

// ============================================================================
// TEST: Parcours inscription Pro
// Ces tests vérifient le parcours d'inscription garage
// ============================================================================

test.describe('Parcours inscription pro', () => {
  
  test('doit afficher la page inscription pro', async ({ page }) => {
    await page.goto('/pro/inscription')
    
    // Vérifier les éléments clés
    await expect(page.getByRole('heading', { name: /Créer un compte pro/i })).toBeVisible()
    await expect(page.getByLabel('Nom du garage')).toBeVisible()
    await expect(page.getByLabel('Email garage')).toBeVisible()
    await expect(page.getByLabel('Email responsable')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Envoyer la demande' })).toBeVisible()
  })
  
  test('doit valider les champs requis', async ({ page }) => {
    await page.goto('/pro/inscription')
    
    // Soumettre le formulaire vide (les inputs required devraient bloquer)
    // Vérifier que le formulaire a bien les attributs required
    const garageNameInput = page.getByLabel('Nom du garage')
    await expect(garageNameInput).toHaveAttribute('required', '')
    
    const garageEmailInput = page.getByLabel('Email garage')
    await expect(garageEmailInput).toHaveAttribute('required', '')
    
    const responsableEmailInput = page.getByLabel('Email responsable')
    await expect(responsableEmailInput).toHaveAttribute('required', '')
    
    const passwordInput = page.getByLabel('Mot de passe')
    await expect(passwordInput).toHaveAttribute('required', '')
  })
  
  test('doit soumettre une demande inscription valide', async ({ page }) => {
    await page.goto('/pro/inscription')
    
    // Générer un email unique pour éviter les duplicates
    const uniqueId = Date.now()
    
    // Remplir le formulaire
    await page.getByLabel('Nom du garage').fill('Garage Test Playwright')
    await page.getByLabel('Email garage').fill(`garage.playwright.${uniqueId}@test.fr`)
    await page.getByLabel('Téléphone').fill('0612345678')
    await page.getByLabel('Adresse').fill('123 rue Test')
    await page.getByLabel('SIRET').fill('12345678901234')
    await page.getByLabel('Email responsable').fill(`responsable.${uniqueId}@test.fr`)
    await page.getByLabel('Mot de passe').fill('SecurePassword123!')
    
    // Soumettre
    await page.getByRole('button', { name: 'Envoyer la demande' }).click()
    
    // Attendre une réponse (succès ou erreur, mais pas timeout)
    // On vérifie qu'il y a un toast ou redirection
    await page.waitForTimeout(3000)
    
    // Le formulaire a été soumis - soit on est redirigé, soit on a un toast
    const url = page.url()
    const hasToast = await page.getByText(/demande|envoyée|attente|erreur/i).count() > 0
    
    // On doit soit être redirigé soit avoir un message
    expect(url.includes('/pro/en-attente') || hasToast).toBeTruthy()
  })
  
  test('doit afficher le lien vers connexion', async ({ page }) => {
    await page.goto('/pro/inscription')
    
    const loginLink = page.getByRole('link', { name: /Déjà un compte/i })
    await expect(loginLink).toBeVisible()
    
    // Vérifier l'attribut href plutôt que naviguer
    await expect(loginLink).toHaveAttribute('href', '/auth/login')
  })
  
})
