# Analyse Figma — courses

## Périmètre Figma

Fichier `b3W6Nyjq8zpjJO49nCzcLy`, canevas `297:961`; vues de liste `330:1834`, `330:1965`, `330:2035`. Les captures présentent le titre « Liste de courses », un filtre Tout et des catégories (ex. fruits et légumes, viande et poissons), puis deux onglets : « Courses communes » et « Mes courses » avec compteurs. La liste commune est groupée par catégories (épicerie, hygiène et entretien); les lignes montrent nom, case d’achat et, pour les articles achetés, personne ayant acheté. Un bouton `+` sert à ajouter un élément. Les variantes semblent afficher l’état non acheté/acheté et les onglets, à confirmer fonctionnellement.

## Correspondance MLD et implémentation

Le MLD cible contient `ShoppingCategory` et `ShoppingItem` dans `docs/MCD/ColocSync---MLD-MASTER.json`. `ShoppingItem` relie une colocation, son créateur, éventuellement un propriétaire (`owner_id`), une catégorie et éventuellement la personne acheteuse; nom, quantité, unité, date prévue, achat et création sont prévus. Commentaire MLD : `owner_id NULL` signifie courses communes; non nul, liste personnelle de cet utilisateur. L’achat est renseigné via `purchased_at`/`purchased_by_id`.

À la rédaction initiale, Prisma ne contenait que Better Auth. Depuis, `ShoppingCategory` et `ShoppingItem` sont migrés; aucune route ni vue métier n’est implémentée. Les captures ne prouvent pas toutes les règles d’accès aux listes personnelles ni les unités proposées.

## Plan de développement

1. **Décisions** — confirmer visibilité des listes personnelles, droits de modification/achat des articles communs, suppression d’un article acheté, partage d’achats et sens des compteurs d’onglets/catégories.
2. **Données/migration** — intégrer les modèles MLD après accord sur les identifiants `User` (MLD entier vs Better Auth `String`), unicité/catégories et comportement des références lors du départ d’un membre.
3. **API cible à définir** — routes sous `/api/houses/:houseId/shopping`: obtenir catégories et éléments avec filtre commun/personnel, catégorie et état; ajouter/modifier/supprimer un élément; mutation d’achat/annulation. Les champs d’auteur et acheteur viennent de la session côté serveur. Vérifier membership active, appartenance de catégorie, propriétaire et colocation; ne jamais laisser le client imposer `purchased_by_id`.
4. **Mobile** — afficher filtres horizontaux, onglets et compteurs, listes groupées, ligne cochable et auteur d’achat; formulaire d’ajout (nom, quantité/unité/catégorie; date prévue si elle fait partie du flux); états de chargement/vide/erreur/hors ligne. Garder le cache séparé par colocation et type de liste.
5. **Concurrence et temps réel** — rendre la mutation d’achat sûre en concurrence (mise à jour conditionnelle/contrôle de version selon décision). Après transaction, émettre un événement aux seuls membres autorisés; réconcilier ou invalider TanStack Query, REST reste la source de vérité.
6. **Tests** — isolation de colocation et de liste personnelle, droits d’achat, catégories étrangères, double clic/double achat, suppression et états réseau; test mobile des filtres, compteurs, cases et mise à jour après achat.

## Questions ouvertes

Le MLD ne fixe pas catalogue des unités, règles de quantité, archive/expiration des articles achetés, tri, recherche, conflits de mise à jour ou historique d’achat. La maquette ne doit pas être interprétée comme décidant ces règles.

## Sources

Figma frames `330:1834`, `330:1965`, `330:2035` (captures MCP en lecture seule); `docs/MCD/ColocSync---MLD-MASTER.json`; `backend/prisma/schema.prisma`; `backend/src/index.ts`; `mobile/src/lib/api.ts`. Les contrats d’API sont des propositions non implémentées.

## Mise à jour backend — 27 novembre 2026

Les modèles `ShoppingCategory` et `ShoppingItem` sont désormais migrés; l’API et le flux métier restent à créer. Bryan confirme que **la synchronisation temps réel est requise**. Créer `routes/shopping.ts`, `schemas/shopping.ts`, `services/shopping.ts` et un module de diffusion WebSocket (noms cibles). REST est la source de vérité pour lecture/écriture; après commit seulement, publier les changements aux sockets authentifiés et autorisés de la House. La reconnexion recharge via REST.

Toute route et connexion WS vérifie session Better Auth et Membership active. Une liste commune a `ownerId = null`; une liste personnelle est limitée à `ownerId = session.user.id`. L’auteur, l’acheteur et le propriétaire ne sont jamais acceptés comme identité autoritaire du client; la catégorie doit être valide. Une mutation d’achat doit être conditionnelle/transactionnelle pour éviter qu’une concurrence attribue deux acheteurs; publier l’état confirmé après commit. Les abonnements WS sont limités aux Houses permises, sans diffusion globale.

Tests backend requis : session/adhésion, isolation commune-personnelle et inter-House, droits propriétaire, catégorie étrangère, courses concurrentes/double achat, WS sans session, abonnements/refus, aucun événement en cas de rollback, reconnexion par REST. À décider avant implémentation : politique de modification/suppression d’un article acheté, catalogue unités, archivage et règles de visibilité des listes personnelles; ne pas bloquer la décision confirmée de temps réel.
