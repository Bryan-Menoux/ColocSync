# Analyse Figma - 06 Messagerie

Figma: b3W6Nyjq8zpjJO49nCzcLy / canvas 297:961 / frames 297:1461 Chat-perso, 297:1515 Chat-commun, 297:1567 Chat
## Sources et constat
Figma: b3W6Nyjq8zpjJO49nCzcLy / 297:961 / frames 297:1461, 297:1515, 297:1567. Inspection metadata/context/screenshot indisponible dans cet environnement.
MLD cible: docs/MCD/ColocSync---MLD-MASTER.json, entites Conversation, ConversationParticipant, Message (section 06, lignes 1882-2227).
Conversation: id, house_id, created_by_id, conversation_type direct/group/house, name, picture_path, created_at. Participant: joined_at, last_read_at, left_at, unicite conversation/user. Message: body ou attachment_path, sent_at, contrainte texte non vide ou fichier. Aucun modele Attachment separe.
Note historique : à sa rédaction, Prisma ne contenait que Better Auth. Depuis, les modèles métier, dont `Conversation`, `ConversationParticipant` et `Message`, sont migrés; les routes de messagerie restent absentes.
API actuelle: backend/src/index.ts expose health, auth, me, et /ws ouvert qui repond connected/ping uniquement. Aucun endpoint conversation/message. mobile/src/lib/api.ts ne contient aucun client messagerie.
stack.md (95-117) impose REST pour lectures/ecritures, WebSocket apres persistance, invalidation TanStack Query.
## Plan interfaces
A confirmer par Figma: liste des conversations (nom/photo, dernier message, date, non-lus, recherche, vide/chargement/erreur); Chat-perso direct; Chat-commun house; Chat/groupe prive; historique pagine, composeur, pieces jointes, offline/reconnexion, echec/retry.
Mobile Expo: TanStack Query pour donnees serveur; aucun acces DB client.
## Contrats proposes (non implementes)
HTTP: GET /api/conversations?houseId; POST /api/conversations; GET /api/conversations/:id/messages?cursor&limit; POST /api/conversations/:id/messages; POST /api/conversations/:id/read. Gestion participants POST/DELETE seulement apres confirmation metier/Figma.
GET liste: participant actif, dernier message, non-lus. POST conversation: houseId, type, participants, nom/photo; direct exactement 2, house/group membres actifs. GET messages: curseur, tri sent_at,id. POST message: texte et/ou fichier, validation MLD/type/taille, persister avant notification. POST read: mettre a jour last_read_at de la session, jamais userId arbitraire.
WebSocket GET /ws: session Better Auth obligatoire; refuser session absente/expiree; abonner uniquement aux conversations autorisees. Evenements: ready, conversation.created/updated/participant_changed, message.created, conversation.read, error. Valider subscribe/unsubscribe/ping, revalider acces, diffuser seulement aux participants actifs. Apres reconnexion, resynchroniser par HTTP; le client ne publie jamais message.created.
## Autorisations
Toute route et upgrade exigent session valide. houseId, conversation, participants et auteur sont resolus serveur. Lecture/liste/message/read: participant actif (left_at NULL) et house coherente. Creation: createur et participants membres actifs; direct limite a deux. Envoi: expediteur actif au moment transaction. Roles ajout/retrait/nom/photo a decider, jamais deduits UI. Pieces jointes: MIME/taille, stockage hors DB, nom non controle, URL protegee. Persister puis publier; idempotency key envisagee pour retry.
## Tests
API/DB: 401 sans session routes/upgrade; isolation house et groupes prives; invariants direct et texte/fichier; pagination; last_read_at; fichier type/taille/URL; aucun evenement si transaction echoue.
WebSocket: handshake valide/invalide/expire; abonnement autorise/refuse; diffusion aux seuls participants; evenement apres POST; reconnexion/resynchronisation HTTP; heartbeat, doublon/retry, socket lent.
Mobile: trois types de chat, vide/erreur/offline, auteur/horodatage/fichier/pagination, invalidation TanStack Query, retry sans double envoi, accessibilite/clavier/selection fichier.
## Decisions et blocages
1. Architecture: HTTP lit/ecrit, WebSocket notifie, autorisation serveur.
2. MLD cible non implemente: migration Prisma et routes restent a concevoir.
3. Piece jointe portee par Message; stockage/URL signe a decider.
4. last_read_at ne fournit pas accuse par message; modele additionnel necessaire pour cela.
5. Sans metadata/context/screenshot Figma, impossible de confirmer autres frames, actions groupe, recherche, erreurs, pieces jointes et mapping exact.
## Sources
docs/MCD/ColocSync---MLD-MASTER.json; backend/prisma/schema.prisma; backend/src/index.ts; mobile/src/lib/api.ts; stack.md section Synchronisation temps reel.

## Complément Figma — inspection ultérieure

Correction : captures des frames `297:1461`, `297:1515`, `297:1567` consultées via MCP en lecture seule. La liste montre recherche et filtres Toutes/Non lues/Groupes, avatar/nom, aperçu, temps relatif et compteur non lu. Les écrans Chat-perso et Chat-commun montrent des bulles de message, auteur/horodatage et composeur. Une phrase évoque le calendrier, sans preuve d’une intégration automatique. Les captures ne confirment pas les états hors ligne, erreurs, pagination ni les pièces jointes. Aucun écrit Figma effectué.

## Mise à jour backend — 27 novembre 2026

Les tables `Conversation`, `ConversationParticipant` et `Message` sont migrées; les routes manquent. Créer `routes/conversations.ts`, `routes/messages.ts`, `schemas/message.ts`, `services/messaging.ts` et un WebSocket dédié (cibles). REST lit et écrit; WebSocket notifie après commit et ne constitue jamais une voie d’écriture métier. L’upgrade `/ws` existant est ouvert et ne doit pas être réutilisé pour des messages avant authentification.

Toutes les routes et l’upgrade résolvent la session Better Auth; participant actif (`leftAt IS NULL`) requis pour lire, envoyer et marquer lu. La House et l’auteur viennent de la session/conversation persistée, jamais d’un champ client fiable. À l’abonnement, revérifier l’accès; diffuser seulement aux participants actifs. Après reconnexion, rattrapage par API paginée. Valider `body` non vide ou référence de fichier, tailles/MIME côté serveur, pagination par curseur stable et mise à jour `lastReadAt`. Le MLD ne permet pas les accusés de lecture par message ni ne tranche les droits de gestion de groupe; ne pas promettre ces fonctions.

Tests : 401 route et handshake, session expirée, participant parti, isolation entre conversations/Houses, message vide, contenu/fichier invalide, pagination, `lastReadAt`, diffusion après succès uniquement, absence de fuite aux non-participants et reprise HTTP après reconnexion. Le stockage des pièces jointes reste privé et à sélectionner avant cette partie.
