# Règle centrale : distinguer le joueur et le payeur

## Problème à résoudre

Les joueurs de l'Équipe A et de l'Équipe B doivent pouvoir se connecter à leur compte personnel et payer eux-mêmes.

Mais certains paiements peuvent aussi être effectués par leurs parents ou tuteurs.

Il ne faut donc pas confondre :
- le joueur concerné par la cotisation ;
- la personne qui effectue réellement le paiement.

## Règle métier

La cotisation est toujours rattachée au joueur.

Le paiement est toujours rattaché :
- au joueur concerné ;
- au payeur réel ;
- au mode de paiement ;
- au montant ;
- à la référence ;
- au statut de validation.

## Exemple

Un joueur doit payer 60 000 FCFA.

- Le joueur paie 20 000 FCFA via son compte.
- Son parent paie 40 000 FCFA via son compte.

Le système affiche :
- Montant dû : 60 000 FCFA
- Montant payé : 60 000 FCFA
- Reste à payer : 0 FCFA
- Statut : payé

Dans l'historique, les deux paiements restent séparés.
