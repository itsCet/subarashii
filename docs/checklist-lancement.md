# Checklist avant la mise en ligne

À passer en revue une fois toutes les fonctionnalités validées.

## Légal
- [ ] Politique de confidentialité (nLPD suisse + RGPD) : il faut la raison sociale, l'adresse, un e-mail de contact et le nom du responsable
- [ ] CGV, obligatoires avec le paiement en ligne (politique de remboursement)
- [ ] Relecture par un professionnel avant d'activer Stripe

## Référencement (SEO)
- [ ] `sitemap.xml` + `robots.txt` (exclure `/staff`, `/commandes`, `/shop/panier` ; inclure `/galerie`)
- [ ] Meta description sur chaque page
- [ ] Image de partage (Open Graph) + `metadataBase`
- [ ] Données structurées « CafeOrCoffeeShop » (adresse, horaires, téléphone)
- [ ] Textes travaillés sur les mots-clés locaux (manga café Genève, tournoi TCG Genève…)
- [ ] Google Search Console : vérification via le DNS Wix, envoi du sitemap
- [ ] Fiche Google Business Profile (Maps) : lien vers l'app
- [ ] Ne pas casser le référencement du site Wix (sous-domaine, ou redirections si remplacement)

## Technique
- [ ] Page 404 aux couleurs du café
- [ ] Liens à compléter : partenaires, `alcoveBookingUrl` (`lib/cafe.ts`), `/leaderboard`
- [ ] Nom du produit en `alt` des photos du shop
- [x] Compression des photos envoyées par le staff
- [ ] Ajouter de vraies photos du café (Staff → Photos)
- [ ] Test de vitesse Lighthouse sur le site en ligne
- [ ] Anti-spam : Cloudflare Turnstile sur la connexion
- [ ] Statistiques : Vercel Analytics (sans cookie)
- [ ] Accueil : un appel à l'action principal

## Hébergement et domaine
- [ ] Domaine : `app.subarashiimangacafe.ch` → Vercel (enregistrement DNS chez Wix)
- [ ] Vercel Pro (usage commercial)
- [ ] Supabase : SMTP (Resend, Brevo…) et Site URL de prod ; plan Pro pour les sauvegardes
- [ ] Stripe : clés de prod + webhook (si paiement en ligne)
- [ ] Remise à zéro des données de test (`supabase/reset-test-data.sql`)
