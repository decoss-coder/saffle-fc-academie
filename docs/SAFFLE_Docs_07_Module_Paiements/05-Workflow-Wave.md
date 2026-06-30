# Workflow Wave

## Objectif

Intégrer Wave comme premier mode de paiement en ligne.

La logique retenue reprend le principe utilisé dans AviaSchoolPay : génération d'un lien marchand Wave avec montant calculé côté serveur, puis création d'un paiement interne en attente.

## Workflow

1. L'utilisateur se connecte.
2. Il consulte une cotisation due.
3. Il clique sur « Payer avec Wave ».
4. Le système vérifie que l'utilisateur est autorisé.
5. Le système vérifie le solde restant.
6. Le système calcule le montant à payer.
7. Le système génère un lien Wave.
8. Le système crée un paiement interne avec le statut `en_attente`.
9. L'utilisateur paie via Wave.
10. Le trésorier confirme l'encaissement.
11. Le paiement passe au statut `confirme`.
12. Le solde du joueur est mis à jour.
13. Le reçu est généré.
14. Une notification est envoyée.

## Statuts Wave

- en_attente
- confirme
- annule
- expire
- rembourse
- echec

## Règle importante

Le paiement Wave ne doit pas modifier directement la cotisation tant qu'il n'est pas confirmé dans le système.
