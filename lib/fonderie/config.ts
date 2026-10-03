// Réglages du site à remplir à la main.

// Adresse du site (plan du site, robots, liens absolus)
export const SITE_URL = "https://fonderiemodulaire.com"

// Version complète : lien de paiement Stripe (Payment Link du produit à prix fixe).
// Dans Stripe, régler « After payment » → rediriger vers
//   https://fonderiemodulaire.com/atelier?session_id={CHECKOUT_SESSION_ID}
// Tant qu'il est vide, tout le bloc « Full version » est caché et seul l'essai gratuit s'affiche.
// Exemple : "https://buy.stripe.com/xxxxxxxx"
export const CHECKOUT_URL = "https://buy.stripe.com/fZu3cwfctbym0HF6RafYY01"
// Prix affiché sur le site (le vrai prix se règle dans Stripe : à changer aux deux endroits)
export const PRICE = "€5.99"

// Footer (maquette Figma). Un intitulé sans adresse s'affiche en texte simple, sans lien.
// Ton site, lien de « Made by bguillaume.info »
export const AUTHOR_URL = "https://bguillaume.info"
// Ton profil X / Twitter — exemple : "https://x.com/ton_pseudo"
export const TWITTER_URL = "https://x.com/guillaumebth"
// Ton profil Instagram
export const INSTAGRAM_URL = "https://www.instagram.com/guillaumebth/"
// Mon autre outil, présenté dans l'encart de la home
export const SYMBL_URL = "https://www.symbl.space"
// Lien « Contact » — exemple : "mailto:hello@bguillaume.info" ou une page de contact
export const CONTACT_URL = "mailto:guillaumebth@gmail.com"
// Bouton « Buy a screen » de l'atelier sur mobile (l'outil ne s'utilise que sur ordinateur)
export const SCREEN_URL = "https://www.amazon.com/s?k=external+monitor"

// Page /legal (mentions légales, CGV, confidentialité). Champs vides = « [à compléter] » sur la page.
export const LEGAL = {
  name: "Guillaume Berthonneau",
  status: "Entrepreneur individuel (micro-entreprise)",
  siren: "820 170 124",
  address: "", // adresse de l'entreprise (ou de domiciliation) ; vide = pas affichée
  vat: "TVA non applicable, article 293 B du CGI", // mention de la franchise de TVA
  // Médiateur de la consommation (obligatoire pour vendre à des particuliers) : nom et site
  mediator: { name: "", url: "" },
}
