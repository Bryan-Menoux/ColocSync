# Analyses fonctionnelles Figma et plans de développement

Fichier analysé : [maquette ColocSync](https://www.figma.com/design/b3W6Nyjq8zpjJO49nCzcLy/ColocSync_Menoux_Norrito_Pruvost?node-id=297-961), canevas `297:961`. Les frames ont été consultées via Figma MCP en lecture seule; aucun outil de modification Figma n’a été appelé.

État du code, des migrations et de la base PostgreSQL réelle : [audit d’implémentation](../ETAT_IMPLEMENTATION.md).

## Rapports par domaine

1. [Comptes et colocation](01-comptes-colocation.md)
2. [Finances](02-finances.md)
3. [Tâches ménagères](03-taches-menageres.md)
4. [Courses](04-courses.md)
5. [Calendrier](05-calendrier.md)
6. [Messagerie](06-messagerie.md)
7. [Documents](07-documents.md)
8. [Notifications et historique](08-notifications-historique.md)
9. [Audit backend Better Auth/API](09-authentification-backend.md)

Chaque document distingue ce que montre la maquette, le MLD cible, l’état du code réel et les recommandations/questions. Les routes décrites sont des propositions à valider, pas des contrats déjà disponibles.

## Référence consolidée — 27 novembre 2026

Les notes historiques ci-dessous sont à lire avec les mises à jour des rapports. En cas de contradiction, cette synthèse, le MLD et les décisions produit confirmées prévalent. La maquette guide les parcours et l’affichage; le MLD décrit les données; les règles non définies restent explicitement à décider avant le développement.

- MLD : `docs/MCD/ColocSync---MLD-MASTER.json`; ses 22 tables métier ont été ajoutées au schéma Prisma et migrées. Voir [l’audit d’implémentation](../ETAT_IMPLEMENTATION.md) et [DATABASE.md](../DATABASE.md).
- Les tables existent, mais aucune route métier n’est encore livrée. Better Auth fournit l’authentification; il n’existe pas encore de middleware partagé d’identité/adhésion/autorisation pour les routes métier.
- Le WebSocket `/ws` actuel reste un test public `connected`/`ping`, non utilisable pour les données métier.
- Décisions confirmées par Bryan : synchronisation temps réel requise pour les courses; dépenses privées rattachées au logement (aucune dépense personnelle indépendante); plusieurs règles de récurrence possibles pour une tâche. L’IA est hors périmètre produit.
- Le schéma Prisma actuel n’autorise encore qu’une règle de récurrence par tâche (`TaskRecurrence.taskId @unique`) : migration corrective requise avant le développement des tâches.
- Better Auth est intégré, mais l’authentification ne remplace pas les contrôles d’accès métier; voir le verdict et les preuves de l’[audit backend](09-authentification-backend.md).
- Les API et fichiers indiqués dans les plans sont des cibles proposées, pas des contrats implémentés. Le backend reste l’autorité pour session, identité, adhésion, droits, validations et isolation.

## Ordre de réalisation recommandé

1. **Fondation serveur** : contrats et tests d’authentification; middleware session; identité issue de session; service commun d’adhésion active et de rôle; validation DTO; erreurs uniformes; tests d’isolation.
2. **Compte/colocation** : profil, House, Membership et invitations, après décision des rôles/invitations non spécifiés par les écrans/MLD.
3. **Tranches métier** : tâches et courses (temps réel autorisé après commit), finances, calendrier; chaque tranche inclut services, routes Fastify, schémas de validation, transaction Prisma et tests.
4. **Messagerie et documents** : autorisation dédiée; WebSocket authentifié pour le chat; stockage privé et téléchargement contrôlé pour les documents.
5. **Notifications/historique** : déclencher après succès des mutations; définir les destinataires et la rétention avant livraison.

Cet ordre est une recommandation, non une dépendance absolue. Chaque rapport précise l’état, les tables, les modules backend cibles, les contrôles, les tests et les décisions encore ouvertes. Pour toute mutation, persister d’abord; publier ensuite. Les contrôles de session, d’appartenance et d’autorisation restent côté serveur.

## Sources techniques croisées

`backend/prisma/schema.prisma`, `backend/src/index.ts`, `mobile/src/lib/api.ts`, `mobile/src/lib/auth-client.ts`, `stack.md` et les MCD/MLD sous `docs/MCD/`.
