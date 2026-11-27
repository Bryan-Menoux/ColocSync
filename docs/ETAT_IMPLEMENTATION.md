# État actuel — base, backend et application mobile

**Relevé : 27 novembre 2026, après la migration métier.** Ce document confronte le MLD cible, le schéma Prisma, les migrations, la base PostgreSQL Docker, les routes Fastify et les écrans/mobile API. La base a été inspectée au niveau du schéma uniquement : aucune ligne de compte ou donnée personnelle n’a été consultée.

## Conclusion rapide

La migration `20261127040000_add_mld_business_schema` a ajouté les 22 tables métier manquantes et les champs de profil compatibles dans `user`. PostgreSQL contient maintenant les 26 tables applicatives (quatre Better Auth, dont `user`, et 22 tables métier), plus `_prisma_migrations`. Les deux migrations sont appliquées; la table `user` Better Auth et ses identifiants texte sont conservés.

Les routes métier et les écrans métier ne sont toujours pas implémentés : les tables rendent la persistance possible, mais ne signifient pas que les fonctionnalités sont déjà disponibles.

## État par fonctionnalité

| Domaine | Données en base / Prisma | Backend | Mobile | Premier avis |
|---|---|---|---|---|
| **Comptes / authentification** | `user`, `session`, `account`, `verification` présents; identifiants `String` | Better Auth gère inscription, connexion, session, e-mail, mot de passe et OAuth conditionnel; `/api/me` exige une session | Connexion, inscription, compte, vérification/réinitialisation/changement de mot de passe; SecureStore via plugin Expo | Fondation déjà fonctionnelle. Ce compte ne couvre pas encore le profil métier du MLD, la colocation, les adhésions ni les invitations. |
| **Profil / colocation** | `User`, `House`, `Membership`, `Tag`, `UserTag`, `HouseInvitation` migrés; `User.id` reste un `String` Better Auth | Aucune route House/Membership/profil métier | Pas d’onboarding colocation ni de profil complet; `/account` est un écran de compte simple | `username` reste nullable jusqu'à une politique de profil/backfill; mot de passe non dupliqué. |
| **Finances** | `Expense`, `ExpenseShare`, `Repayment` migrés avec décimaux et contraintes positives | Aucune route finance | Aucun écran finance | À construire; dépenses privées liées à la House, pas de table personnelle; devise/arrondis et règles de remboursement restent ouverts. |
| **Tâches ménagères** | `Task`, `TaskRecurrence`, `TaskAssignment` migrés; Prisma n’autorise qu’une récurrence par tâche | Aucune route tâches | Aucun écran tâches | À construire; décision confirmée : plusieurs règles par tâche. Corriger `TaskRecurrence.taskId @unique` avant cette fonctionnalité; génération/rotation restent à décider. |
| **Courses** | `ShoppingCategory`, `ShoppingItem` migrés | Aucune route courses | Aucun écran courses | À construire; temps réel requis par décision produit. Authentifier/autoriser le WebSocket avant émission; règles concurrentes et archivage restent à définir. |
| **Calendrier** | `Event`, `EventParticipant` migrés avec dates et participants | Aucune route calendrier | Aucun calendrier métier | À construire; le calendrier visuel agrège tâche, course et événement mais le MLD ne relie pas ces entités. |
| **Messagerie** | `Conversation`, `ConversationParticipant`, `Message` migrés | Aucun endpoint message; `/ws` est un test ouvert de connexion/ping | Aucun écran conversation implémenté | Authentifier les WebSockets et autoriser les conversations avant tout usage fonctionnel. |
| **Documents** | `Folder`, `Document` migrés; métadonnées uniquement | Aucune route ni stockage de fichier métier | Aucun écran documents | À construire avec stockage privé externe; les fichiers ne sont pas dans PostgreSQL. |
| **Notifications / historique** | `Notification`, `ActivityLog` migrés | Aucune route ni événement métier | Aucun centre ou historique implémenté | À construire après les mutations métier, selon les droits de visibilité. |

Les rapports détaillés par fonctionnalité et les plans proposés se trouvent dans [`docs/fonctionnalites/`](fonctionnalites/README.md).
L’audit backend/API de Better Auth et ses actions restantes sont détaillés dans [`09-authentification-backend.md`](fonctionnalites/09-authentification-backend.md).

## Authentification actuelle

### Backend et persistance

- `backend/src/lib/auth.ts` configure Better Auth avec Prisma/PostgreSQL, email/mot de passe, plugin Expo et envoi d’e-mail conditionnel.
- `backend/src/index.ts` transmet `/api/auth/*` à Better Auth; `GET /api/me` retourne `401` sans session.
- La route de santé, la configuration d’auth et l’état des fournisseurs OAuth sont publics. Ces routes ne renvoient pas les secrets.
- Le WebSocket `/ws` est volontairement ouvert : il envoie `connected` et répond `pong` à `ping`. Il ne doit pas porter de données métier en l’état.
- Dans l’environnement Docker interrogé, `/api/auth/config` annonce les e-mails activés et `/api/auth/providers` indique Google/Apple/Facebook non configurés.

### Mobile

- `mobile/src/lib/auth-client.ts` utilise `@better-auth/expo` et `expo-secure-store`.
- `mobile/src/lib/api.ts` choisit l’hôte Expo en développement natif; les appels observés couvrent santé et configuration/fournisseurs d’authentification, pas les domaines métier.
- Écrans présents : `index.tsx`, `register.tsx`, `account.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `verify-email.tsx`, `verified.tsx`, `change-password.tsx`.
- `account.tsx` protège l’écran côté navigation et propose déconnexion/changement de mot de passe. L’autorité de sécurité doit toutefois rester côté backend pour toutes les futures données métier.

## Premier avis qualité / risques

### Points solides

- Authentification confiée à Better Auth plutôt que réimplémentée.
- Session mobile conservée avec SecureStore.
- Vérification serveur visible sur `/api/me`; messages d’erreur et états d’attente existent sur les flux d’auth.
- Le backend teste réellement PostgreSQL dans `/api/health`.
- Les écrans métier ne simulent pas encore des données de production; cela évite de prendre des maquettes pour des fonctionnalités déjà disponibles.

### Points à traiter avant les premières routes métier

1. **Profil** — le champ MLD `username` est nullable pour préserver les comptes existants; définir l'onboarding et le remplissage avant de le rendre obligatoire.
2. **Identité** — Better Auth reste la source d'identité/mot de passe; ne pas recréer `password_hash` ni accepter un ID utilisateur fourni par le client comme autorisation.
3. **Autorisation de colocation** — chaque route doit dériver l’utilisateur de la session, vérifier une adhésion active et autoriser l’action côté serveur.
4. **WebSocket** — `/ws` est explicitement non authentifié et ne valide aucune adhésion. Le garder en test seulement; authentifier l’upgrade, filtrer abonnements/destinataires et émettre après commit.
5. **Validation API** — aucune route métier ni schéma de validation serveur n’existe encore. Ajouter validation d’entrée, erreurs cohérentes, transactions sur invariants multi-tables et tests d’isolation pour chaque tranche.
6. **Contrats mobile/backend** — définir les DTO et schémas d'entrée/sortie; gérer chargement, vide, erreur, reprise réseau et invalidation TanStack Query. Les fonctions API mobile actuelles ne couvrent pas les parcours métier.

Ces constats sont un premier audit statique et un contrôle de schéma, pas une revue exhaustive de sécurité ni une preuve de couverture fonctionnelle.

## Vérifications effectuées

- Base PostgreSQL Docker : 27 tables physiques (26 applicatives + `_prisma_migrations`), 42 clés étrangères (40 métier + 2 Better Auth), 17 contraintes `CHECK`; deux migrations réussies et `prisma migrate status` à jour.
- Base vide temporaire : les deux migrations s'appliquent depuis zéro; base de vérification supprimée après le contrôle.
- Migration métier : additive; aucune suppression/altération des colonnes Better Auth existantes; champs nouveaux de `user` restent facultatifs sauf `username` unique mais nullable.
- Types : génération Prisma 7.10.1 et typecheck backend réussis; le test de compilation couvre les 26 modèles/délégations et les types create/read/update de `Expense`.
- API en cours : `/api/health` → `200`, base `connected`; `/api/auth/config` → `200`; `/api/auth/providers` → `200`; `/api/me` sans session → `401`.
- Backend : `npm run typecheck` → succès.
- Mobile : `npm run lint` depuis Windows bloqué car `mobile/node_modules/expo` manque sur l’hôte; même commande dans le conteneur Docker `mobile` → succès.
- Aucun test de comportement métier/routes présent pour le moment.

## Sources

`docs/MCD/ColocSync---MLD-MASTER.json`; `docs/DATABASE.md`; `docs/TYPESCRIPT-DATABASE.md`; `backend/prisma/schema.prisma`; `backend/prisma/migrations/20261009105918_init/migration.sql`; `backend/prisma/migrations/20261127040000_add_mld_business_schema/migration.sql`; `backend/src/index.ts`; `backend/src/lib/auth.ts`; `mobile/src/app/`; `mobile/src/lib/api.ts`; `mobile/src/lib/auth-client.ts`; `mobile/src/lib/validation.ts`; `stack.md`.
