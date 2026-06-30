# Permissions du module Paiements

| Action | Joueur A/B | Parent lié | Trésorier | Admin |
|---|:---:|:---:|:---:|:---:|
| Voir son solde | Oui | Oui pour joueur lié | Oui | Oui |
| Payer pour lui-même | Oui | Non | Oui | Oui |
| Payer pour un joueur lié | Non | Oui | Oui | Oui |
| Voir tous les paiements | Non | Non | Oui | Oui |
| Confirmer paiement Wave | Non | Non | Oui | Oui |
| Enregistrer paiement manuel | Non | Non | Oui | Oui |
| Annuler paiement | Non | Non | Oui avec motif | Oui avec motif |
| Télécharger reçu | Oui | Oui | Oui | Oui |
| Modifier montant confirmé | Non | Non | Non recommandé | Non recommandé |

## Principe général

Un utilisateur ne peut payer que pour un joueur auquel il est lié.

Exceptions :
- Trésorier
- Administrateur
