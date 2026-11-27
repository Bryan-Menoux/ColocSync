# Analyse Figma — Documents

## Périmètre et limite d’inspection

- Fichier Figma : `b3W6Nyjq8zpjJO49nCzcLy`.
- Canvas : `297:961`.
- Frames demandées : `297:1372`, `297:2151`.
- Captures des deux frames consultées en lecture seule : grille de six dossiers,
  recherche et tuile « Ajouter ». Les captures ne montrent pas le contenu
  intérieur des dossiers ni les actions de téléversement/suppression; ces points
  restent à confirmer. Aucun outil d’écriture Figma n’a été appelé.

## Contrat de données existant

Le MLD prévoit déjà un espace de documents par colocation :

- `Folder` (`CS_acf2085df6c0f0e2131`) : `id`, `house_id`, `name`,
  `created_at`. Le nom est obligatoire, limité à 150 caractères, et unique
  par colocation (`uq_folder_house_name`) (`docs/MCD/ColocSync---MLD-MASTER.json:2229-2306`).
- `Document` (`CS_e78043a405bccbb11db`) : `id`, `folder_id`, `uploaded_by_id`,
  `name`, `file_path`, `mime_type`, `size_bytes`, `uploaded_at`.
  `size_bytes >= 0`; les octets sont explicitement prévus dans un espace privé
  sécurisé, tandis que cette table conserve les métadonnées
  (`docs/MCD/ColocSync---MLD-MASTER.json:2309-2442`).
- Relations : `Document.folder_id → Folder.id`
  (`CS_fc48074efe16dd2255a`) et `Document.uploaded_by_id → User.id`
  (`CS_f3b1135074bf2e5a007`) ; `Folder.house_id → House.id`
  (`CS_1989014ca6db98c0960`) (`...MLD-MASTER.json:3336-3387`).
- Index présent : `idx_document_folder` ; aucune suppression logique, version,
  checksum, taille maximale ou statut d’upload n’est défini dans le MLD.

À la rédaction initiale, Prisma ne contenait que Better Auth. Depuis, `House`,
`Folder` et `Document` sont migrés; le backend ne contient toujours aucune
route document ni stockage métier. Le MLD est la cible fonctionnelle, pas la
preuve d’une fonctionnalité déjà livrée.

## Plan UX à confirmer sur les frames

Ne pas implémenter ces éléments sans confirmation par screenshot/context :

1. **Navigation** : entrée Documents dans la navigation de la colocation ;
   conserver le contexte `houseId` et afficher un état vide.
2. **Dossiers** : liste des dossiers, ouverture d’un dossier, retour par
   breadcrumb ou bouton ; le regroupement par dossier est attesté par le MLD,
   pas par le visuel non accessible.
3. **Aperçu** : si une frame montre une fiche ou un viewer, prévoir un aperçu
   adapté au MIME ; sinon téléchargement uniquement. Ne pas promettre un
   viewer universel.
4. **Téléversement** : si montré, sélectionner un fichier puis créer les
   métadonnées seulement après upload réussi. Afficher progression, erreur,
   limite de taille/type et reprise/annulation selon les capacités du stockage.
5. **Suppression** : si montrée, confirmation explicite et contrôle serveur ;
   définir si elle supprime immédiatement l’objet externe ou passe par une
   corbeille. Aucune suppression n’est modélisée aujourd’hui.

Métadonnées à afficher ou éditer seulement si le design le prévoit : nom,
dossier, type MIME, taille, auteur (`uploaded_by_id`) et date
(`uploaded_at`). `file_path` reste interne au serveur et ne doit pas être
présenté comme URL publique.

## Stockage et API à concevoir

Stockage recommandé : objet privé externe (S3-compatible ou fournisseur
équivalent), avec `file_path` comme clé opaque, jamais comme chemin local
exposé. Le serveur vérifie le fichier, écrit l’objet, puis persiste
`Document`; en cas d’échec DB, supprimer l’objet orphelin. Pour le
téléchargement, produire une URL signée courte durée ou streamer via le
backend. Ne pas placer les octets dans PostgreSQL.

Contrat minimal à décider et versionner :

- `GET /houses/:houseId/folders` — dossiers visibles, pagination si nécessaire.
- `POST /houses/:houseId/folders` — créer un dossier, nom validé et unicité
  garantie par la contrainte.
- `GET /houses/:houseId/folders/:folderId/documents` — métadonnées paginées.
- `POST /houses/:houseId/folders/:folderId/documents/upload` — multipart ou
  URL d’upload présignée ; vérifier MIME déclaré et MIME détecté, taille et
  nom.
- `GET /documents/:documentId/download` — autorisation puis URL signée/stream.
- `DELETE /documents/:documentId` — seulement si confirmé par le visuel et la
  politique de rétention.

Toutes les routes doivent dériver la colocation depuis le dossier et vérifier
une adhésion active (`Membership`/`House` du MLD), jamais faire confiance à un
`houseId` client isolé. Vérifier aussi que l’utilisateur est l’auteur ou possède
le rôle autorisé pour créer/supprimer. Le download doit refaire ce contrôle à
chaque demande ; une URL signée ne doit pas être permanente ni devinable.

## Mobile et validations

- Utiliser le picker natif, afficher nom, type et taille avant envoi.
- Prévoir les états réseau : attente, upload, succès, échec, retry ; ne pas
  charger le fichier entier en mémoire si le picker permet un flux/URI.
- Échapper les noms affichés ; refuser nom vide, taille nulle ou excessive,
  MIME interdit et extension incohérente. La validation serveur est l’autorité.
- Pagination et cache par `(houseId, folderId)` ; invalider la liste après
  création/suppression.
- Ne pas journaliser URL signées, contenu, jetons ou chemins sensibles.

## Décisions ouvertes / blocages

1. Récupérer un rendu ou `context` des frames `297:1372` et `297:2151` pour
   confirmer les variantes et les actions réellement visibles.
2. Confirmer : types acceptés, taille maximale, renommage, doublons, pagination,
   édition/suppression de dossiers, suppression de documents et rétention.
3. Choisir le fournisseur de stockage, la stratégie antivirus/MIME réel,
   l’expiration des URLs et la gestion des objets orphelins.
4. Ajouter les modèles Prisma métier : le schéma actuel ne reflète pas encore
   le MLD Documents.
5. Clarifier la correspondance entre les identifiants entiers du MLD et les
    identifiants `String` de Better Auth avant migration.

## Complément Figma — inspection ultérieure

Correction : captures des frames `297:1372` et `297:2151` consultées via MCP en lecture seule. Elles présentent le titre « Documents », sous-titre « Tout ce qui concerne la coloc », recherche, six dossiers illustrés (Logement, Loyer, Entretien, Énergie, Internet, Assurance) et une tuile « Ajouter ». Les captures ne montrent pas le contenu d’un dossier, le téléversement effectif ni la suppression. Le regroupement en `Folder` correspond au MLD; les noms affichés sont des exemples visuels, pas un catalogue métier figé. Aucun outil d’écriture Figma appelé.

## Mise à jour backend — 27 novembre 2026

`Folder` et `Document` sont migrés; aucune route ni stockage objet métier n’est en place. Créer `routes/folders.ts`, `routes/documents.ts`, `schemas/document.ts`, `services/documents.ts` et un adaptateur de stockage privé (cibles). Vérifier session et adhésion active à la House via le dossier, sans faire confiance au `houseId` fourni seul. Le serveur valide le nom, la taille réelle, le type détecté et le dossier; `uploadedById` vient de la session. Stocker les octets hors PostgreSQL; DB ne contient que métadonnées et clé opaque. Téléchargement exige une nouvelle autorisation et un flux serveur ou URL signée de courte durée. Nettoyer l’objet si l’écriture DB échoue; ne pas journaliser chemin, URL signée ou contenu.

La capture ne prouve pas téléchargement, suppression ni renommage; conserver ces actions comme options à décider. Fixer fournisseur, types/limites, analyse antivirus, expiration des liens et suppression/rétention avant de développer les uploads. Tests : membre non autorisé, dossier d’une autre House, MIME falsifié, dépassement de taille, upload interrompu, rollback/nettoyage, téléchargement sans droit et URL expirée.
