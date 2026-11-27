# Base de données ColocSync

**Source de vérité :** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Prisma Migrate matérialise les changements dans PostgreSQL. Le MLD source est [`docs/MCD/ColocSync---MLD-MASTER.json`](MCD/ColocSync---MLD-MASTER.json).

## Principes et décision d'identité

- Better Auth reste l'autorité pour les comptes, mots de passe, fournisseurs et sessions. Les tables existantes `user`, `session`, `account` et `verification` ne sont ni remplacées ni dupliquées.
- Le `User.id` Better Auth est un `String`. Les clés étrangères utilisateur du MLD, initialement `INTEGER`, deviennent donc `TEXT`/`String` et pointent vers `user.id`. Les identifiants des autres entités métier restent des `INTEGER` auto-incrémentés.
- Les champs de profil étendent la table `user` existante. Le MLD `email_verified` correspond à `emailVerified`; `profile_picture_path` correspond à `image`. Les deux champs ne sont pas recréés.
- `name`, `email`, `createdAt` et `updatedAt` gardent les noms, types et contraintes existants de Better Auth. En particulier, `email` reste `TEXT` et les dates restent `TIMESTAMP(3)` sans fuseau, contrairement aux tailles/types du MLD.
- Better Auth fournit `emailVerified`, `createdAt` et `updatedAt`; les valeurs par défaut `FALSE`/`CURRENT_TIMESTAMP` du MLD ne sont donc pas ajoutées à ces colonnes existantes.
- `password_hash` du MLD est omis : les identifiants et mots de passe restent gérés par Better Auth dans `account`.
- `username` est nullable au départ, bien que le MLD le marque obligatoire. Cela évite d'inventer une valeur ou de bloquer d'anciens comptes; le rendre obligatoire nécessitera un parcours de profil et une migration de remplissage contrôlée.
- Les champs de profil facultatifs du MLD restent facultatifs. Les chemins de photos/fichiers sont des références de métadonnées, pas le stockage des fichiers eux-mêmes.

## Inventaire des modèles métier

| Modèle / table PostgreSQL | Rôle selon le MLD |
|---|---|
| `User` / `user` | Profil associé au compte canonique Better Auth |
| `House` / `house` | Colocation et adresse |
| `Tag` / `tag` | Étiquette de profil |
| `UserTag` / `user_tag` | Association entre profil et étiquette |
| `Membership` / `membership` | Historique d'appartenance utilisateur-colocation |
| `Expense` / `expense` | Dépense de colocation |
| `ExpenseShare` / `expense_share` | Part d'une dépense attribuée à un membre |
| `Repayment` / `repayment` | Remboursement entre membres |
| `HouseInvitation` / `house_invitation` | Invitation avec empreinte du jeton, jamais le jeton brut |
| `Task` / `task` | Définition d'une tâche ménagère |
| `TaskRecurrence` / `task_recurrence` | Règle de récurrence d'une tâche |
| `TaskAssignment` / `task_assignment` | Attribution datée d'une tâche à un membre |
| `ShoppingCategory` / `shopping_category` | Catégorie d'article |
| `ShoppingItem` / `shopping_item` | Article commun ou attribué à un membre |
| `Event` / `event` | Événement, absence ou visite |
| `EventParticipant` / `event_participant` | Participation à un événement |
| `Conversation` / `conversation` | Conversation liée à une colocation |
| `ConversationParticipant` / `conversation_participant` | Participation et lecture d'une conversation |
| `Message` / `message` | Message texte ou référence de pièce jointe |
| `Folder` / `folder` | Dossier de documents de colocation |
| `Document` / `document` | Métadonnées d'un fichier stocké hors base |
| `Notification` / `notification` | Notification destinée à un membre |
| `ActivityLog` / `activity_log` | Événement d'historique; l'entité référencée est polymorphe |

## Correspondance Better Auth / MLD `User`

| Champ MLD | Champ Prisma/Better Auth | Décision |
|---|---|---|
| `id INTEGER` | `User.id String` | ID canonique Better Auth; aucune seconde identité |
| `first_name`, `last_name` | `firstName`, `lastName` | Colonnes facultatives distinctes; `name` Better Auth est conservé |
| `username VARCHAR(50) NOT NULL UNIQUE` | `username String? @unique` | Nullable temporairement jusqu'à l'onboarding/backfill |
| `email VARCHAR(255)` | `email String @unique` | Colonne Better Auth existante conservée, y compris son type PostgreSQL |
| `email_verified BOOLEAN NOT NULL DEFAULT FALSE` | `emailVerified BOOLEAN NOT NULL` | Champ Better Auth existant conservé; aucun défaut SQL ajouté, Better Auth fournit la valeur |
| `profile_picture_path` | `image` | Champ Better Auth existant conservé |
| `birth_date DATE` | `birthDate DateTime? @db.Date` | Facultatif comme dans le MLD |
| `phone_number`, `occupation`, `citation`, `about` | Champs Prisma de profil | Facultatifs; aucun usage métier supplémentaire supposé |
| `password_hash` | — | Non créé; Better Auth conserve la responsabilité des identifiants |
| `created_at`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP` | `createdAt`, `updatedAt TIMESTAMP(3) NOT NULL` | Colonnes Better Auth conservées sans conversion; Better Auth fournit les valeurs |

## Types PostgreSQL

Le schéma Prisma explicite les types natifs quand la précision compte : `@db.VarChar(n)`, `@db.Decimal(p, s)`, `@db.Date` et `@db.Timestamptz(6)`. `Decimal` est conservé comme décimal exact, jamais remplacé par `Float`; `Json` correspond au JSON PostgreSQL. Les champs sans type natif explicite suivent le type Prisma/PostgreSQL indiqué dans la référence détaillée ci-dessous.

## Contraintes et règles

- Les clés étrangères, clés primaires composées, contraintes uniques et index nommés sont définis dans le schéma Prisma.
- Les contraintes SQL `CHECK` exprimées dans le MLD sont ajoutées à la migration SQL : Prisma 7 ne les représente pas dans le schéma déclaratif. Elles doivent être conservées lors des migrations ultérieures.
- Les colonnes à `NoAction` empêchent la suppression d'un parent encore référencé. Les `Cascade` sont limités aux relations que le MLD marque ainsi.
- Une contrainte de base garantit des formes simples (ex. montant positif); les règles nécessitant une identité, une adhésion ou un contexte transactionnel restent à valider dans les services backend.

## Décisions produit confirmées et écarts à corriger

- Bryan confirme le temps réel pour les courses : le backend devra authentifier/autoriser chaque connexion et abonnement, persister via REST/Prisma puis diffuser après commit.
- Les dépenses privées restent attachées à une House et ne sont pas des dépenses personnelles indépendantes.
- Une tâche peut avoir plusieurs règles de récurrence. Le schéma actuel `Task.recurrence` singulier et `TaskRecurrence.taskId @unique` contredit cette décision; modifier le modèle et faire une migration avant l’API tâches.
- L’IA est hors périmètre produit actuel.

## Décisions métier non encodées par le MLD

Le schéma décrit les données, pas encore les services métier. À spécifier avant les routes correspondantes : rôles et droits d'une adhésion, répartition et arrondis des dépenses, calcul des soldes, règles d'invitation, calendrier de génération des récurrences/rotations, modification/suppression des courses achetées, cardinalité réelle des conversations directes et groupes, stockage des fichiers, livraison push/e-mail, et stratégie de rétention/suppression. Ne pas déduire ces règles d'un type SQL ou d'une maquette.

## Relations du MLD

Les identifiants utilisateur ci-dessous sont `String` côté PostgreSQL après adaptation à Better Auth; les autres références gardent leur type entier. Sauf indication contraire, le MLD demande `ON DELETE NO ACTION` et `ON UPDATE NO ACTION`.

| Table / champ FK | Cible | Suppression |
|---|---|---|
| `user_tag.user_id` | `user.id` | No action |
| `user_tag.tag_id` | `tag.id` | No action |
| `membership.user_id` | `user.id` | No action |
| `membership.house_id` | `house.id` | No action |
| `expense.house_id` | `house.id` | No action |
| `expense.payer_id` | `user.id` | No action |
| `expense_share.expense_id` | `expense.id` | No action |
| `expense_share.user_id` | `user.id` | No action |
| `repayment.house_id` | `house.id` | No action |
| `repayment.payer_id` | `user.id` | No action |
| `repayment.recipient_id` | `user.id` | No action |
| `house_invitation.house_id` | `house.id` | No action |
| `house_invitation.created_by_id` | `user.id` | No action |
| `task.house_id` | `house.id` | No action |
| `task.created_by_id` | `user.id` | No action |
| `task_recurrence.task_id` | `task.id` | Cascade |
| `task_assignment.task_id` | `task.id` | No action |
| `task_assignment.user_id` | `user.id` | No action |
| `shopping_item.house_id` | `house.id` | No action |
| `shopping_item.added_by_id` | `user.id` | No action |
| `shopping_item.owner_id` | `user.id` | No action |
| `shopping_item.category_id` | `shopping_category.id` | No action |
| `shopping_item.purchased_by_id` | `user.id` | No action |
| `event.house_id` | `house.id` | No action |
| `event.created_by_id` | `user.id` | No action |
| `event_participant.event_id` | `event.id` | Cascade |
| `event_participant.user_id` | `user.id` | No action |
| `conversation.house_id` | `house.id` | No action |
| `conversation.created_by_id` | `user.id` | No action |
| `conversation_participant.conversation_id` | `conversation.id` | Cascade |
| `conversation_participant.user_id` | `user.id` | No action |
| `message.conversation_id` | `conversation.id` | Cascade |
| `message.sender_id` | `user.id` | No action |
| `folder.house_id` | `house.id` | No action |
| `document.folder_id` | `folder.id` | No action |
| `document.uploaded_by_id` | `user.id` | No action |
| `notification.house_id` | `house.id` | No action |
| `notification.user_id` | `user.id` | No action |
| `activity_log.house_id` | `house.id` | No action |
| `activity_log.actor_id` | `user.id` | No action |

Better Auth conserve aussi ses deux relations d'identité `session.userId -> user.id` et `account.userId -> user.id`, avec suppression en cascade comme dans le schéma d'origine.

## Contraintes `CHECK` du MLD

Ces contraintes sont du SQL PostgreSQL dans la migration, car Prisma ne les décrit pas dans le schéma Prisma :

| Table | Prédicat |
|---|---|
| `membership` | `left_at IS NULL OR left_at >= joined_at` |
| `expense` | `amount > 0` |
| `expense_share` | `amount > 0` |
| `repayment` | `recipient_id <> payer_id`; `amount > 0` |
| `task_recurrence` | `frequency IN ('daily', 'weekly', 'monthly')`; `repeat_every > 0`; `end_date IS NULL OR end_date >= start_date` |
| `task_assignment` | `status IN ('pending', 'completed', 'skipped')` |
| `shopping_item` | `quantity > 0` |
| `event` | `event_type IN ('event', 'absence', 'guest_visit')`; `ends_at IS NULL OR ends_at >= starts_at`; `guest_count >= 0` |
| `conversation` | `conversation_type IN ('direct', 'house', 'group')` |
| `message` | `(body IS NOT NULL AND length(btrim(body)) > 0) OR attachment_path IS NOT NULL` |
| `document` | `size_bytes >= 0` |
| `notification` | `channel IN ('in_app', 'email', 'push')` |

## Référence complète des champs

Les tableaux ci-dessous répertorient chaque champ persistant des 26 modèles (les champs relationnels de navigation ne sont pas des colonnes). Les types et valeurs reflètent le schéma Prisma et la migration; `NULL` indique une colonne nullable.

- [Migration métier appliquée (`migration.sql`)](../backend/prisma/migrations/20261127040000_add_mld_business_schema/migration.sql)
- [Schéma Prisma source](../backend/prisma/schema.prisma)

Les noms de table/champ PostgreSQL sont ceux indiqués par `@@map`/`@map`. Les contraintes `CHECK` ajoutées en SQL sont listées plus haut.

### `User` -> `user`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `TEXT` | Non | `none` | PK |
| `name` | `name` | `TEXT` | Non | `none` |  |
| `email` | `email` | `TEXT` | Non | `none` | UNIQUE |
| `emailVerified` | `emailVerified` | `BOOLEAN` | Non | `none` |  |
| `image` | `image` | `TEXT` | Oui | `none` |  |
| `createdAt` | `createdAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `updatedAt` | `updatedAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `username` | `username` | `VARCHAR(50)` | Oui | `none` | UNIQUE |
| `lastName` | `last_name` | `VARCHAR(100)` | Oui | `none` |  |
| `firstName` | `first_name` | `VARCHAR(100)` | Oui | `none` |  |
| `birthDate` | `birth_date` | `DATE` | Oui | `none` |  |
| `phoneNumber` | `phone_number` | `VARCHAR(20)` | Oui | `none` |  |
| `occupation` | `occupation` | `VARCHAR(100)` | Oui | `none` |  |
| `citation` | `citation` | `VARCHAR(255)` | Oui | `none` |  |
| `about` | `about` | `TEXT` | Oui | `none` |  |

### `Session` -> `session`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `TEXT` | Non | `none` | PK |
| `expiresAt` | `expiresAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `token` | `token` | `TEXT` | Non | `none` | UNIQUE |
| `createdAt` | `createdAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `updatedAt` | `updatedAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `ipAddress` | `ipAddress` | `TEXT` | Oui | `none` |  |
| `userAgent` | `userAgent` | `TEXT` | Oui | `none` |  |
| `userId` | `userId` | `TEXT` | Non | `none` |  |

### `Account` -> `account`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `TEXT` | Non | `none` | PK |
| `accountId` | `accountId` | `TEXT` | Non | `none` |  |
| `providerId` | `providerId` | `TEXT` | Non | `none` |  |
| `userId` | `userId` | `TEXT` | Non | `none` |  |
| `accessToken` | `accessToken` | `TEXT` | Oui | `none` |  |
| `refreshToken` | `refreshToken` | `TEXT` | Oui | `none` |  |
| `idToken` | `idToken` | `TEXT` | Oui | `none` |  |
| `accessTokenExpiresAt` | `accessTokenExpiresAt` | `TIMESTAMP(3)` | Oui | `none` |  |
| `refreshTokenExpiresAt` | `refreshTokenExpiresAt` | `TIMESTAMP(3)` | Oui | `none` |  |
| `scope` | `scope` | `TEXT` | Oui | `none` |  |
| `password` | `password` | `TEXT` | Oui | `none` |  |
| `createdAt` | `createdAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `updatedAt` | `updatedAt` | `TIMESTAMP(3)` | Non | `none` |  |

### `Verification` -> `verification`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `TEXT` | Non | `none` | PK |
| `identifier` | `identifier` | `TEXT` | Non | `none` |  |
| `value` | `value` | `TEXT` | Non | `none` |  |
| `expiresAt` | `expiresAt` | `TIMESTAMP(3)` | Non | `none` |  |
| `createdAt` | `createdAt` | `TIMESTAMP(3)` | Oui | `none` |  |
| `updatedAt` | `updatedAt` | `TIMESTAMP(3)` | Oui | `none` |  |

### `House` -> `house`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `name` | `name` | `VARCHAR(100)` | Non | `none` |  |
| `housePhotoPath` | `house_photo_path` | `TEXT` | Oui | `none` |  |
| `country` | `country` | `VARCHAR(255)` | Non | `none` |  |
| `city` | `city` | `VARCHAR(255)` | Non | `none` |  |
| `postalCode` | `postal_code` | `VARCHAR(20)` | Non | `none` |  |
| `houseAddress` | `house_address` | `VARCHAR(255)` | Oui | `none` |  |
| `theme` | `theme` | `VARCHAR(50)` | Oui | `none` |  |

### `Tag` -> `tag`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `name` | `name` | `VARCHAR(100)` | Non | `none` | UNIQUE |

### `UserTag` -> `user_tag`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `tagId` | `tag_id` | `INTEGER` | Non | `none` |  |

Contraintes/index : PK (userId,tagId).

### `Membership` -> `membership`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `role` | `role` | `VARCHAR(20)` | Non | `none` |  |
| `joinedAt` | `joined_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |
| `leftAt` | `left_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |

Contraintes/index : INDEX (userId,houseId) `idx_membership_user_house`; INDEX (houseId) `idx_membership_house`.

### `Expense` -> `expense`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `payerId` | `payer_id` | `TEXT` | Non | `none` |  |
| `title` | `title` | `VARCHAR(255)` | Non | `none` |  |
| `amount` | `amount` | `DECIMAL(10, 2)` | Non | `none` |  |
| `expenseDate` | `expense_date` | `DATE` | Non | `none` |  |
| `isPrivate` | `is_private` | `BOOLEAN` | Non | `true` |  |
| `description` | `description` | `TEXT` | Oui | `none` |  |

Contraintes/index : INDEX (houseId,expenseDate) `idx_expense_house_date`; INDEX (payerId,expenseDate) `idx_expense_payer_date`.

### `ExpenseShare` -> `expense_share`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `expenseId` | `expense_id` | `INTEGER` | Non | `none` |  |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `amount` | `amount` | `DECIMAL(10, 2)` | Non | `none` |  |

Contraintes/index : UNIQUE (expenseId,userId) `uq_expense_share_expense_user`; INDEX (userId) `idx_expense_share_user`.

### `Repayment` -> `repayment`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `payerId` | `payer_id` | `TEXT` | Non | `none` |  |
| `recipientId` | `recipient_id` | `TEXT` | Non | `none` |  |
| `amount` | `amount` | `DECIMAL(10, 2)` | Non | `none` |  |
| `repaymentDate` | `repayment_date` | `DATE` | Non | `none` |  |

Contraintes/index : INDEX (houseId,repaymentDate) `idx_repayment_house_date`.

### `HouseInvitation` -> `house_invitation`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `createdById` | `created_by_id` | `TEXT` | Non | `none` |  |
| `tokenHash` | `token_hash` | `VARCHAR(64)` | Non | `none` | UNIQUE |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |
| `expiresAt` | `expires_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `isRevoked` | `is_revoked` | `BOOLEAN` | Non | `false` |  |

Contraintes/index : INDEX (houseId) `idx_house_invitation_house`.

### `Task` -> `task`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `createdById` | `created_by_id` | `TEXT` | Non | `none` |  |
| `title` | `title` | `VARCHAR(160)` | Non | `none` |  |
| `description` | `description` | `TEXT` | Oui | `none` |  |
| `category` | `category` | `VARCHAR(80)` | Oui | `none` |  |
| `isActive` | `is_active` | `BOOLEAN` | Non | `true` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |
| `recurrence` | `recurrence` | `TaskRecurrence` | Oui | `none` |  |

Contraintes/index : INDEX (houseId) `idx_task_house`.

### `TaskRecurrence` -> `task_recurrence`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `taskId` | `task_id` | `INTEGER` | Non | `none` | UNIQUE |
| `frequency` | `frequency` | `VARCHAR(12)` | Non | `none` |  |
| `repeatEvery` | `repeat_every` | `INTEGER` | Non | `1` |  |
| `startDate` | `start_date` | `DATE` | Non | `none` |  |
| `endDate` | `end_date` | `DATE` | Oui | `none` |  |
| `rotateMembers` | `rotate_members` | `BOOLEAN` | Non | `false` |  |

### `TaskAssignment` -> `task_assignment`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `taskId` | `task_id` | `INTEGER` | Non | `none` |  |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `dueAt` | `due_at` | `TIMESTAMPTZ(6)` | Non | `none` |  |
| `status` | `status` | `VARCHAR(12)` | Non | `'pending'` |  |
| `completedAt` | `completed_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : UNIQUE (taskId,userId,dueAt) `uq_task_assignment_person_due`; INDEX (userId,dueAt) `idx_task_assignment_due`; INDEX (taskId) `idx_task_assignment_task`.

### `ShoppingCategory` -> `shopping_category`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `name` | `name` | `VARCHAR(100)` | Non | `none` | UNIQUE |

### `ShoppingItem` -> `shopping_item`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `addedById` | `added_by_id` | `TEXT` | Non | `none` |  |
| `ownerId` | `owner_id` | `TEXT` | Oui | `none` |  |
| `categoryId` | `category_id` | `INTEGER` | Oui | `none` |  |
| `name` | `name` | `VARCHAR(200)` | Non | `none` |  |
| `quantity` | `quantity` | `DECIMAL(8, 2)` | Non | `1` |  |
| `unit` | `unit` | `VARCHAR(30)` | Oui | `none` |  |
| `plannedFor` | `planned_for` | `DATE` | Oui | `none` |  |
| `purchasedById` | `purchased_by_id` | `TEXT` | Oui | `none` |  |
| `purchasedAt` | `purchased_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (houseId,ownerId) `idx_shopping_house_owner`; INDEX (categoryId) `idx_shopping_category`.

### `Event` -> `event`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `createdById` | `created_by_id` | `TEXT` | Non | `none` |  |
| `title` | `title` | `VARCHAR(160)` | Non | `none` |  |
| `eventType` | `event_type` | `VARCHAR(20)` | Non | `'event'` |  |
| `startsAt` | `starts_at` | `TIMESTAMPTZ(6)` | Non | `none` |  |
| `endsAt` | `ends_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `guestCount` | `guest_count` | `INTEGER` | Non | `0` |  |
| `description` | `description` | `TEXT` | Oui | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (houseId,startsAt) `idx_event_house_dates`.

### `EventParticipant` -> `event_participant`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `eventId` | `event_id` | `INTEGER` | Non | `none` |  |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |

Contraintes/index : UNIQUE (eventId,userId) `uq_event_participant`; INDEX (userId) `idx_event_participant_user`.

### `Conversation` -> `conversation`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `createdById` | `created_by_id` | `TEXT` | Non | `none` |  |
| `conversationType` | `conversation_type` | `VARCHAR(15)` | Non | `none` |  |
| `name` | `name` | `VARCHAR(100)` | Oui | `none` |  |
| `picturePath` | `picture_path` | `TEXT` | Oui | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (houseId) `idx_conversation_house`.

### `ConversationParticipant` -> `conversation_participant`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `conversationId` | `conversation_id` | `INTEGER` | Non | `none` |  |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `joinedAt` | `joined_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |
| `lastReadAt` | `last_read_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `leftAt` | `left_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |

Contraintes/index : UNIQUE (conversationId,userId) `uq_conversation_user`; INDEX (userId) `idx_conversation_participant_user`.

### `Message` -> `message`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `conversationId` | `conversation_id` | `INTEGER` | Non | `none` |  |
| `senderId` | `sender_id` | `TEXT` | Non | `none` |  |
| `body` | `body` | `TEXT` | Oui | `none` |  |
| `attachmentPath` | `attachment_path` | `TEXT` | Oui | `none` |  |
| `sentAt` | `sent_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (conversationId,sentAt) `idx_message_conversation_date`.

### `Folder` -> `folder`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `name` | `name` | `VARCHAR(150)` | Non | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : UNIQUE (houseId,name) `uq_folder_house_name`.

### `Document` -> `document`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `folderId` | `folder_id` | `INTEGER` | Non | `none` |  |
| `uploadedById` | `uploaded_by_id` | `TEXT` | Non | `none` |  |
| `name` | `name` | `VARCHAR(255)` | Non | `none` |  |
| `filePath` | `file_path` | `TEXT` | Non | `none` |  |
| `mimeType` | `mime_type` | `VARCHAR(100)` | Non | `none` |  |
| `sizeBytes` | `size_bytes` | `INTEGER` | Non | `none` |  |
| `uploadedAt` | `uploaded_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (folderId) `idx_document_folder`.

### `Notification` -> `notification`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `userId` | `user_id` | `TEXT` | Non | `none` |  |
| `channel` | `channel` | `VARCHAR(15)` | Non | `none` |  |
| `title` | `title` | `VARCHAR(160)` | Non | `none` |  |
| `body` | `body` | `TEXT` | Non | `none` |  |
| `createdAt` | `created_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |
| `sentAt` | `sent_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |
| `readAt` | `read_at` | `TIMESTAMPTZ(6)` | Oui | `none` |  |

Contraintes/index : INDEX (userId,createdAt) `idx_notification_user_date`.

### `ActivityLog` -> `activity_log`

| Champ Prisma | Colonne PostgreSQL | Type PostgreSQL | Nullable | Defaut | Cle |
|---|---|---|---|---|---|
| `id` | `id` | `INTEGER` | Non | `sequence (autoincrement)` | PK |
| `houseId` | `house_id` | `INTEGER` | Non | `none` |  |
| `actorId` | `actor_id` | `TEXT` | Oui | `none` |  |
| `action` | `action` | `VARCHAR(60)` | Non | `none` |  |
| `entityType` | `entity_type` | `VARCHAR(60)` | Non | `none` |  |
| `entityId` | `entity_id` | `INTEGER` | Oui | `none` |  |
| `details` | `details` | `JSONB` | Oui | `none` |  |
| `occurredAt` | `occurred_at` | `TIMESTAMPTZ(6)` | Non | `CURRENT_TIMESTAMP` |  |

Contraintes/index : INDEX (houseId,occurredAt) `idx_activity_house_date`.

Les listes `Contraintes/index` indiquent les champs Prisma; les noms SQL personnalisés sont ceux après `map`. Les cibles et actions de suppression des clés étrangères figurent dans la section [Relations du MLD](#relations-du-mld).

## Notes de champs provenant du MLD

| Champ | Signification / invariant documenté |
|---|---|
| `User.firstName`, `User.lastName` | Facultatifs; non demandés à l'inscription initiale. |
| `User.birthDate` | Facultatif; l'âge affiché est calculé, pas stocké. |
| `User.password_hash` | Présent dans le MLD mais omis du schéma : Better Auth gère le mot de passe. |
| `User.updatedAt` | À actualiser lors d'une modification par le serveur/ORM; champ Better Auth existant conservé. |
| `Expense.isPrivate` | `true` signifie visible uniquement par le payeur selon le MLD; `false`, visible par les membres. |
| `HouseInvitation.tokenHash` | Stocker l'empreinte du code/lien, jamais le jeton brut. |
| `TaskRecurrence.rotateMembers` | La rotation effective relève de la logique applicative, pas de la colonne booléenne seule. |
| `TaskAssignment.completedAt` | Date réelle d'accomplissement de la tâche. |
| `ShoppingItem.ownerId` | `NULL` indique un article commun; sinon l'article est attribué à cet utilisateur. |
| `Conversation.conversationType` | Le MLD décrit `direct`, `house` ou `group`; règles de participation à vérifier côté serveur. |
| `Conversation.name`, `Conversation.picturePath` | Facultatifs; notamment utiles aux groupes privés. |
| `ConversationParticipant.leftAt` | `NULL` signifie participation active; renseigné quand la personne quitte le groupe/la colocation. |
| `Message.body` | Facultatif si une pièce jointe est fournie; le texte vide seul est refusé par le `CHECK`. |
| `Message.attachmentPath` | Référence à un fichier/image stocké hors PostgreSQL. |
| `ActivityLog.actorId` | `NULL` représente une action système. |
| `ActivityLog.entityId` | Identifiant polymorphe informatif, sans clé étrangère. |
| `ActivityLog.details` | JSON d'historique; ne pas y copier inutilement des données privées. |

## Migrations et génération

Depuis `backend/` avec `DATABASE_URL` configurée :

```sh
npm run db:migrate
npm run db:generate
npm run typecheck
```

Ne jamais utiliser `migrate reset` sur une base contenant des données. Vérifier tout SQL généré avant de l'appliquer. Voir aussi [`TYPESCRIPT-DATABASE.md`](TYPESCRIPT-DATABASE.md) pour le workflow de typage.
