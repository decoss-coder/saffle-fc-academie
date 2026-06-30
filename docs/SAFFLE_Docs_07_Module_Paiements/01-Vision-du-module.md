# Vision du module Paiements

## Objectif général

Le module Paiements doit permettre à SAFFLE FC Académie de suivre toutes les cotisations, paiements, impayés, reçus et confirmations financières liés aux joueurs.

Le module doit gérer les paiements :
- des joueurs de l'Équipe A ;
- des joueurs de l'Équipe B ;
- des catégories de formation ;
- des parents ou tuteurs ;
- des paiements manuels enregistrés par le trésorier.

## Principe central

Le paiement n'est pas seulement lié au compte connecté. Il est lié à une cotisation due par un joueur.

Un joueur peut donc avoir une dette, mais cette dette peut être payée :
- par le joueur lui-même ;
- par un parent ;
- par un tuteur ;
- par une autre personne autorisée ;
- par saisie manuelle du trésorier.

## Formule fonctionnelle

Joueur → Cotisation due → Paiement effectué par un payeur → Reçu → Mise à jour du solde.
