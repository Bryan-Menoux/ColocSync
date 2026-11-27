---
name: colocsync-fastify-prisma
description: Contrats Fastify, données Prisma/PostgreSQL et isolation ColocSync. À charger quand une route, une règle métier, une relation ou une migration change.
---

1. Vérifie `backend/package.json`, les routes existantes et `backend/prisma/schema.prisma`. Distingue schéma en place, proposition et migration appliquée.
2. Définis entrée, réponse et erreurs observables avant de changer un contrat mobile/serveur. Vérifie la session puis l’appartenance à la colocation ciblée côté serveur ; ne te fie pas à un identifiant fourni par le client.
3. Choisis contraintes et transactions selon les invariants réels du lot. Demande une décision si les règles de rôle ou de répartition sont inconnues. Ne modifie jamais le client Prisma généré et n’applique pas de migration.
4. Prévois un contrôle positif, un refus sans droit et un refus pour une autre colocation lorsque ces frontières sont touchées. Indique ce qui a été réellement exécuté.
