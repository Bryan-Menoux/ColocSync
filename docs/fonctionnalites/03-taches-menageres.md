# Analyse Figma — tâches ménagères

## Périmètre Figma

Fichier `b3W6Nyjq8zpjJO49nCzcLy`, canevas `297:961`. Deux vues de liste distinctes : `330:2133` et `330:2241`, affichées comme variantes/états. `297:2389` est le formulaire calendrier « ajouter une tâche » et relève aussi du calendrier. Les captures montrent une liste « Tâches », un bouton `+`, filtres Tout et par tâche, sections Aujourd’hui/À venir, cartes avec titre, date, membres assignés, statut et règle de récurrence. Les cartes ont un bouton d’ouverture. Statuts visibles : « À faire » et « Terminer »; récurrences visibles : chaque semaine, tous les mardis/jeudis, jamais. La vue calendrier `297:2289` affiche également une tâche à 10:00 avec personnes assignées.

## MCD/MLD et état réel

Le MLD prévoit `Task`, `TaskRecurrence` et `TaskAssignment` (`docs/MCD/ColocSync---MLD-MASTER.json`). La définition de tâche est distincte des occurrences/attributions. `TaskAssignment` porte notamment `user_id`, `due_at`, `status`, `completed_at`; la récurrence porte fréquence, intervalle, bornes et `rotate_members`. `Membership` définit le contexte de colocation. Ces modèles sont maintenant présents dans Prisma et migrés; le schéma ne permet toutefois qu’une règle par tâche, à corriger selon la décision confirmée ci-dessous. `backend/src/index.ts` n’expose pas de routes tâches. L’application mobile n’a pas encore de flux métier tâches.

## Plan vertical de développement

1. **Décisions et migration** — définir les statuts exacts, qui crée/modifie/termine une tâche, si plusieurs membres peuvent être affectés, si la rotation crée des occurrences à l’avance ou à la demande, et le comportement en cas de départ d’un membre. Mapper l’identité Better Auth vers `User` avant les clés étrangères.
2. **API** — concevoir les contrats, sans les considérer comme existants : `GET /api/houses/:houseId/tasks?from=&to=&status=` pour les occurrences; `POST /api/houses/:houseId/tasks` pour définition + récurrence; `PATCH /api/tasks/:taskId`; mutation de statut d’une occurrence; lecture du détail. La liste doit fournir date/état, tâche, assignés et fréquence affichable. Valider côté serveur l’adhésion active, les membres assignés, les dates et la règle de récurrence.
3. **Règles** — faire persister une occurrence avant d’émettre un événement; empêcher les doublons de génération. Décider si terminer est une transition idempotente, et si le report/annulation existe. Les vues visuelles ne précisent pas les règles de rotation.
4. **Mobile** — écran liste regroupé par échéance (Aujourd’hui/À venir), filtres Tout/tâche, cartes et accès détail; formulaire de création/édition; action terminer. Utiliser TanStack Query, formulaires Zod/RHF et les composants/styles existants. Prévoir chargement, liste vide, erreur/retry, absence d’assigné et mutation en cours.
5. **Synchronisation** — REST demeure source de vérité. Les tâches n’ont pas de décision temps réel spécifique; ne pas l’ajouter par analogie avec les courses. Si nécessaire ultérieurement, diffuser aux membres autorisés après commit.
6. **Validation** — tests de droits inter-colocations, membre inactif, transition de statut, limites de dates, occurrence récurrente, rotation et absence de duplication; test mobile des filtres, états et complétion.

## Inconnues à trancher

Le visuel ne définit pas la sémantique des filtres, la possibilité d’éditer/supprimer, le report d’échéance, l’historique, la fréquence personnalisée, ni le moment de génération des occurrences. Les dates affichées dans le calendrier ne suffisent pas à affirmer qu’une tâche est un événement (`Event`) : le MLD ne relie pas ces entités.

## Sources et statut

Figma : frames `330:2133`, `330:2241`, `297:2289`, `297:2389`; captures MCP en lecture seule. Modèle cible : `docs/MCD/ColocSync---MLD-MASTER.json`. Existant : `backend/prisma/schema.prisma`, `backend/src/index.ts`, `mobile/src/`. Les routes et étapes d’implémentation ci-dessus sont des propositions, pas des contrats implémentés.

## Mise à jour backend — 27 novembre 2026

Les modèles `Task`, `TaskRecurrence` et `TaskAssignment` sont maintenant migrés, mais aucune route métier n’existe. Décision produit confirmée : une tâche peut avoir **plusieurs règles**. Le Prisma actuel impose encore `Task.recurrence` singulier et `task_id UNIQUE`; lever cette contrainte et passer à une relation un-à-plusieurs dans Prisma + migration avant d’implémenter les tâches. Cette correction est un prérequis bloquant, pas une évolution facultative.

Créer `routes/tasks.ts`, `schemas/task.ts`, `services/tasks.ts` et un service de génération d’occurrences (noms cibles). Routes proposées : liste paginée/filtrée par période, création/édition de définition et de règles, lecture, mutation d’une attribution/occurrence. Le middleware partagé dérive user de la session, vérifie adhésion active à la House; le service vérifie les assignés, propriétaire et périmètre House. Validation de fréquence/intervalle/bornes, fuseau, statut et transitions; transaction sur définition/règles/attributions. Conserver l’unicité de l’attribution selon la clé actuelle et rendre la génération idempotente pour éviter les doublons. Décider si les occurrences sont pré-générées ou calculées au fil de l’eau et comment la rotation fonctionne; le MLD ne tranche pas.

Tests backend : accès inter-House, membre parti, plusieurs règles sur une tâche, bornes/date, génération répétée sans doublon, rotation et transition de statut. Le calendrier peut agréger les tâches visuellement comme le montre Figma, mais elles restent `TaskAssignment`, sans création artificielle d’`Event`.
