// Réglages du site à remplir à la main.

// Version complète : lien de paiement Stripe (Payment Link du produit « Customer chooses price »).
// Dans Stripe, régler « After payment » → rediriger vers
//   https://fonderiemodulaire.com/atelier?session_id={CHECKOUT_SESSION_ID}
// Tant qu'il est vide, tout le bloc « Full version » est caché et seul l'essai gratuit s'affiche.
// Exemple : "https://buy.stripe.com/xxxxxxxx"
export const CHECKOUT_URL = "https://buy.stripe.com/3cI00k3tLeKyaifgrKfYY00"
// Prix minimum affiché (le vrai minimum se règle dans Stripe, sur le prix « Customer chooses »)
export const MIN_PRICE = "€5.99"

// Footer (maquette Figma). Un intitulé sans adresse s'affiche en texte simple, sans lien.
// Ton site, lien de « Made by bguillaume.info »
export const AUTHOR_URL = "https://bguillaume.info"
// Ton profil X / Twitter — exemple : "https://x.com/ton_pseudo"
export const TWITTER_URL = "https://x.com/guillaumebth"
// Lien « Contact » — exemple : "mailto:hello@bguillaume.info" ou une page de contact
export const CONTACT_URL = "mailto:guillaumebth@gmail.com"
// Bouton « Buy a screen » de l'atelier sur mobile (l'outil ne s'utilise que sur ordinateur)
export const SCREEN_URL = "https://www.amazon.com/s?k=external+monitor"
