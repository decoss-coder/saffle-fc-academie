# Texte à intégrer dans le cahier des charges

Le module Paiements doit permettre la gestion complète des cotisations dues par les joueurs de SAFFLE FC Académie. La dette financière est toujours rattachée au joueur, tandis que le paiement conserve l'identité exacte du payeur réel.

Les joueurs de l'Équipe A et de l'Équipe B disposent d'un compte personnel obligatoire. Ils peuvent consulter leurs cotisations, payer eux-mêmes, suivre leur solde et télécharger leurs reçus. Les parents ou tuteurs liés à leur fiche peuvent également effectuer un paiement pour eux.

Pour les catégories de formation, le parent ou tuteur reste le payeur principal. Le joueur mineur peut disposer d'un compte sportif, mais son accès financier est limité selon les règles définies par le club.

Wave est intégré comme premier mode de paiement en ligne. Le système génère un lien Wave à partir d'un montant calculé côté serveur, crée un paiement interne en attente, puis permet au trésorier de confirmer l'encaissement. Le paiement validé met à jour le solde de la cotisation, génère un reçu et inscrit l'opération dans l'historique financier.

Le module doit également prendre en charge les paiements manuels, les paiements partiels, les reçus, les impayés, les annulations avec motif et le journal d'audit financier.
