# Statuts et validations

## Statuts d'une cotisation

- non_payee
- partiellement_payee
- payee
- annulee
- exoneree

## Statuts d'un paiement

- en_attente
- confirme
- rejete
- annule
- rembourse
- expire

## Validations

Le système doit empêcher :

- un paiement négatif ;
- un paiement à zéro ;
- un paiement supérieur au solde restant, sauf règle spécifique ;
- un paiement par un utilisateur non lié au joueur ;
- la double confirmation d'un même paiement ;
- la suppression d'un paiement confirmé sans journal d'audit ;
- la modification silencieuse d'un paiement.

## Montant minimum

Pour Wave, le montant minimum recommandé est de 100 FCFA.
