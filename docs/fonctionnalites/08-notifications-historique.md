# Analyse Figma — notifications et historique

## Constat Figma

Fichier `b3W6Nyjq8zpjJO49nCzcLy`, canevas `297:961`. Aucun écran distinct de centre de notifications ou d’historique d’activité n’apparaît dans les frames métier recensées. Le frame `297:1154` « settings » expose dans son menu une entrée « Notification » (`297:1159`) et « Paramètre » (`297:1160`), sans que cela démontre le contenu de ces destinations. Une icône de notification apparaît aussi dans l’en-tête calendrier (`297:2316`, `297:2438`), mais ce n’est pas une interface de notification. Les captures de messagerie montrent compteurs non lus, qui appartiennent à la liste des conversations et ne remplacent pas un centre de notifications.

## Modèle cible et état actuel

Le MLD cible distingue `Notification` et `ActivityLog` dans `docs/MCD/ColocSync---MLD-MASTER.json`. `Notification` porte destinataire, canal, titre, corps, dates d’envoi et de lecture; `ActivityLog` porte colocation, acteur, action, type/identifiant d’entité, détails et date d’occurrence. Ils ont des objectifs différents : signaler à un utilisateur une action à traiter, versus conserver une trace d’événements de colocation.

`Notification` et `ActivityLog` sont désormais présents dans `backend/prisma/schema.prisma` et migrés; `backend/src/index.ts` n’expose pas de routes correspondantes. La stack documente Expo Notifications, mais aucun flux métier de push n’est établi par cette seule mention.

## Plan de documentation et réalisation

1. **Décisions produit** — préciser quelles actions génèrent une notification ou une entrée d’historique, les destinataires, les règles de confidentialité, expiration/rétention, lecture/archivage, préférences par canal, et si l’historique est visible à tous les membres actifs.
2. **Événements métier** — inventorier les mutations sources (dépense, tâche, course, événement, message, document, adhésion). Écrire l’activité/notif dans la même transaction logique ou via outbox fiable après succès; ne jamais créer une notification avant commit. Définir déduplication/retry.
3. **API cible** — liste paginée des notifications de l’utilisateur, compteur non lu, mutation de lecture; journal paginé par colocation seulement si confirmé comme écran. Le serveur tire le destinataire/acteur de la session et vérifie membership active pour toute donnée de colocation.
4. **Push** — décider l’enregistrement/révocation des tokens Expo, multi-appareils, permissions OS et deep links. Ne pas placer de secrets/tokens push dans des réponses ou logs. La notification push ne contient que les informations nécessaires; recharger les données via API après ouverture.
5. **Mobile** — entrée Settings « Notification » à relier à un écran défini; états loading/vide/erreur, demande de permission contextualisée, préférences, badge et ouverture vers l’écran cible. Prévoir l’absence de permission push sans bloquer les notifications in-app.
6. **Tests** — autorisation inter-colocation et par destinataire, statut lu, pagination, aucune fuite de contenu privé, émission seulement après succès transactionnel, retry idempotent, token révoqué, deep link invalide et permission refusée.

## Inconnues et limites

Le MCD/MLD est une cible de données, pas un contrat d’interface complet. Les frames consultées ne montrent pas le centre, le détail, les filtres, ni les préférences de notification ou le journal. Avant développement, fournir ces écrans ou décider explicitement qu’ils ne font pas partie du MVP. Ne pas confondre les pastilles non lues de messagerie avec les notifications générales.

## Sources

Figma metadata/captures en lecture seule : frame `297:1154` et nœuds `297:1159`, `297:1160`, `297:2316`, `297:2438`; `docs/MCD/ColocSync---MLD-MASTER.json`; `backend/prisma/schema.prisma`; `backend/src/index.ts`; `stack.md` (Expo Notifications). Toutes routes et comportements proposés restent à valider.

## Mise à jour backend — 27 novembre 2026

`Notification` et `ActivityLog` existent dans Prisma/PostgreSQL, sans routes ni émetteurs métier. Créer `services/activity-log.ts`, `services/notifications.ts`, `routes/notifications.ts` et éventuellement `routes/activity.ts` après confirmation d’un écran d’historique (noms cibles). Les mutations métier appellent ces services seulement après validation; idéalement enregistrer l’activité/notif dans la même transaction ou via une outbox fiable. Ne jamais notifier avant le commit. Les notifications sont lues par leur destinataire issu de la session; l’historique est filtré par House et Membership active. Les métadonnées polymorphes de `ActivityLog` ne dispensent jamais de réautoriser l’entité cible à sa lecture.

Prévoir liste paginée, compteur non lu et mutation de lecture; Expo push est une livraison secondaire, non l’autorité de lecture. Token push lié au compte/appareil, révocable, jamais exposé dans les logs. Les écrans vus ne définissent pas le catalogue d’événements, préférences, rétention, contenu privé admissible ni le centre d’historique : ces règles restent préalables à la tranche. Tests : destinataire/House, contenu privé, pagination, idempotence, échec transactionnel sans notification, révocation de token et permission push refusée.
