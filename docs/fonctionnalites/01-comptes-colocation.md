# Analyse Figma - comptes et colocation

## Statut
Figma analysé en lecture seule : fileKey `b3W6Nyjq8zpjJO49nCzcLy`, canevas `297:961`. Frames pertinentes détaillées dans le complément ci-dessous.

## Existant
Mobile : mobile\src\app\index.tsx implemente connexion email/password, remember-me, reset, verification et redirection account. mobile\src\app\register.tsx implemente name/email/password/rememberMe et validation mot de passe 8-128. mobile\src\app\account.tsx affiche nom/email, changement mot de passe et deconnexion. Aucun ecran colocation.
Backend : backend\src\index.ts expose /api/auth/*, /api/me, /api/auth/config, /api/auth/providers. /ws est ouvert et limite a connected/ping. backend\src\lib\auth.ts configure Better Auth + Prisma, email/password, verification conditionnelle et OAuth conditionnel. Aucune route House/Membership.

## MCD contre Prisma
MCD source docs\MCD\ColocSync---MLD-MASTER.json : User 63ZHg5aQo8apazBQfaSlV, House eZZqMUzIwWtdCqAccefbo, Membership fZ3qPcOnPqeEV00x5LOrI, Tag E1QYoKlOM5PlOZjUyMVOj, UserTag hGoXq5l_KqRDOAEUszy-w. Membership relie user_id et house_id; UserTag relie User et Tag. HouseInvitation existe aussi dans le MCD, a confirmer.
Note historique : à sa rédaction, Prisma ne contenait que Better Auth. Depuis, `House`, `Membership`, `Tag`, `UserTag` et `HouseInvitation` ont été ajoutés et migrés. `User.id` texte Better Auth reste canonique; voir la mise à jour datée ci-dessous et `docs/DATABASE.md`.

## Plan vertical a confirmer
1. Inspecter les frames et etats Figma, champs, actions, erreurs, navigation; decider multi-colocation, role createur, invitation/code et champs obligatoires.
2. Definir identite Better Auth/profil, contraintes House et Membership, puis migration Prisma.
3. Backend : session Better Auth uniquement; GET /api/me, GET /api/houses, POST /api/houses transaction House+Membership, GET /api/houses/:houseId avec membership actif, PATCH /api/me. Controle isolation serveur; jamais user_id fourni par client.
4. Mobile : routes Expo Router onboarding/compte/settings; schemas Zod/RHF dans mobile\src\lib\validation.ts; fonctions API et TanStack Query dans mobile\src\lib\api.ts; loading/error/retry; aucun acces DB client.
5. Pas de WebSocket generalise : /ws actuel nest pas authentifie; ajouter seulement si besoin temps reel confirme.

## Questions metier
Un utilisateur peut-il appartenir a plusieurs House ? Quel role pour le createur ? Creation directe ou invitation/code ? Quels champs House sont requis ? Adresse visible par qui ? username ou User.name canonique ? Profil MCD dans ce lot ? Que signifient exactement les frames 297:1077/1115/1154 ? Suppression compte/coloc, quitter, changement email, revocation sessions ?

## Validation
MCD, Prisma, routes/auth/mobile et frames Figma lus. Aucun outil d’écriture Figma appelé.

## Complément Figma — inspection ultérieure
Frames inspectées : `297:962` Connexion, `297:983` Inscription, `297:1013`, `297:1024`, `297:1059` création coloc en trois étapes, `297:1115` Compte, `297:1154` settings, `319:1277` Themes. Les vues montrent profil avec photo, âge/localisation, profession, citation, à-propos et tags; création avec nom, image/thème; menu Notifications/Paramètres. Le profil MLD contient des champs correspondants mais le schéma Prisma actuel n’en contient aucun hors identité Better Auth. Aucun écrit Figma n’a été effectué.

## Mise à jour backend — 27 novembre 2026

**État corrigé :** la migration `20261127040000_add_mld_business_schema` a ajouté `House`, `Membership`, `Tag`, `UserTag` et `HouseInvitation` au schéma Prisma et à PostgreSQL. `User.id` demeure l’identifiant texte Better Auth; le profil étend `user`. Aucune API profil/colocation/invitation n’existe encore. Voir `docs/ETAT_IMPLEMENTATION.md` et `docs/DATABASE.md`; les constats « seuls Better Auth » ci-dessus sont historiques.

**Architecture cible**, fichiers à créer sous `backend/src/` :
- `plugins/authentication.ts` : résoudre `auth.api.getSession()` avec les en-têtes de requête; refuser 401 si session absente/expirée; exposer un contexte typé dont l’ID vient exclusivement de `session.user.id`.
- `plugins/house-access.ts` ou service `services/membership.ts` : vérifier Membership active (`leftAt IS NULL`) dans la House ciblée et le rôle requis; refuser par défaut. Ne pas faire confiance à `userId`, `role` ou `houseId` d’autorisation envoyé par le client.
- `routes/me.ts`, `routes/houses.ts`, `routes/invitations.ts`, `schemas/` et `services/` : valider entrées, exécuter les créations/adhésions atomiquement via Prisma, renvoyer DTO explicites. `POST /houses` crée House et Membership ensemble; profil limité aux champs MLD.
- `app.ts`/`index.ts` enregistre les plugins et routes. Fichiers proposés, non présents à ce jour.

Avant implémentation, arrêter les valeurs de rôles et les droits de création/invitation à partir du dossier et des écrans; le MLD ne spécifie pas leur sémantique. Tester 401, membre inactif, accès inter-House, rôle insuffisant, création transactionnelle, invitation expirée/révoquée/réutilisée et fuite d’identifiants. Les opérations profil privé ne doivent exposer que les champs prévus par le parcours.

## Better Auth — état backend/API

Voir le rapport détaillé [09-authentification-backend.md](09-authentification-backend.md) pour inscription, connexion, mots de passe, vérification e-mail, sessions/cookies, limites et verdict. L’authentification de base est branchée, mais ne constitue pas encore une fondation complète d’autorisation des routes métier.
