# Analyse Figma - calendrier / événements

## Modèle cible confirmé
Event CS_a284548a18159802763 contient id, house_id, created_by_id, title, event_type, starts_at, ends_at, guest_count, description et created_at. Source : docs/MCD/ColocSync---MLD-MASTER.json, lignes 1641-1803.
EventParticipant CS_ff0222ee72044bd433c contient event_id et user_id, avec unicité du couple. Source : lignes 1806-1878.
Types autorisés : event, absence, guest_visit. ends_at est facultatif mais ne peut précéder starts_at; guest_count doit être positif ou nul.
guest_count décrit les invités externes; EventParticipant décrit les colocataires concernés. Task, TaskAssignment et TaskRecurrence sont distincts (lignes 999-1395) : aucun lien tâche-evenement n est spécifié.
Relations attendues : House vers Event, User créateur, Event vers EventParticipant et User participant. Toute opération est limitée à une House et une Membership active.

## Ecart avec le réel
Note historique : à sa rédaction, Prisma ne contenait que Better Auth. Depuis, `House`, `Membership`, `Event` et `EventParticipant` sont migrés; les routes restent absentes.
backend/src/index.ts lignes 18-74 n expose aucun endpoint calendrier. /ws lignes 33-40 est ouvert et sans session; il ne peut pas diffuser des données calendrier en l état.

## Ecrans mobiles
1. Calendrier de colocation : mois ou agenda, navigation de période, retour à aujourd hui, jours contenant des événements.
2. Détail : titre, type, début et fin, description, créateur, participants, invités; actions selon autorisation.
3. Création et édition : titre requis, type, début, fin facultative, description, membres participants, guest_count pour guest_visit.
4. Chargement, vide, erreur/retry, suppression concurrente et validation mobile.
Une absence est un Event de type absence, pas une tâche. Ne pas injecter les tâches dans le calendrier sans décision produit.

## API proposée à confirmer
GET /api/houses/:houseId/events?from=ISO&to=ISO&eventType=type : période bornée, participants inclus.
GET /api/houses/:houseId/events/:eventId; POST .../events; PATCH .../events/:eventId; DELETE .../events/:eventId.
Le serveur vérifie session, Membership active, appartenance de chaque participant, enum, longueurs, starts_at <= ends_at et guest_count >= 0; écrit Event et participants en transaction. Le client n accède jamais à Prisma.
Après écriture, notifier uniquement la colocation via WebSocket puis invalider TanStack Query; REST reste la source de lecture.

## Dates et décisions
Le MLD impose TIMESTAMPTZ : stocker UTC, afficher dans le fuseau de la colocation. Le MLD ne fournit pas le fuseau de House; décider d un champ IANA ou d une préférence appareil.
Décider événements sans heure, multi-jours, DST, édition du passé, règle guest_visit/guest_count supérieur à zéro et droits de création, édition et suppression. Ne jamais convertir une date locale en UTC minuit par défaut.

## Complément Figma — inspection ultérieure

Captures MCP en lecture seule : `297:2289` montre sélecteur mois/année, jours de la semaine, filtres Tout/Tâches/Courses/Événements, bouton `+`, cartes horodatées avec titre et participants, et icône notification. L’écran agrège une tâche et un événement de type soirée; cette juxtaposition visuelle ne crée pas de relation MLD. `297:2389` est un formulaire intitulé « ajouter une tâche »; ne pas en déduire que toute tâche est un `Event`. Les modèles sont migrés, mais l’API calendrier reste absente.

## Mise à jour backend — 27 novembre 2026

`Event` et `EventParticipant` sont migrés dans Prisma, mais aucune API n’est livrée. Créer `routes/events.ts`, `schemas/event.ts`, `services/events.ts` (cibles) avec CRUD limité à une House. Appliquer l’authentification partagée, vérifier Membership active pour l’acteur et chaque participant, et contrôler rôle si une politique produit le requiert. Le créateur vient de la session. Les participants et l’événement sont persistés dans une transaction; dates ISO converties en instants UTC, `endsAt >= startsAt`, `guestCount >= 0`, enum conforme MLD. Publier après commit seulement si temps réel calendrier est confirmé.

Le visuel agrège tâches/courses/événements, mais le schéma ne relie pas ces entités : produire une réponse calendrier composée de sources, sans les fusionner en table `Event`. Fuseau IANA de House, événements sans heure, événements multi-jours et droits d’édition/suppression restent à trancher avant la tranche. Tests : membre absent, participant d’une autre House, dates invalides, compte invités négatif, transaction et filtres de période.
