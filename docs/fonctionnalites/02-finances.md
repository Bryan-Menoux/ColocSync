# Analyse finances ColocSync

## Perimetre et limite
- Figma: fichier b3W6Nyjq8zpjJO49nCzcLy, canvas 297:961, frames 330:1583 et 330:1691.
- Les captures des frames Figma consultées en lecture seule sont décrites dans le complément ci-dessous.

## Sources et etat actuel
- MLD docs/MCD/ColocSync---MLD-MASTER.json: Expense (DtJaxKaaxqhLlOFtBouYA), ExpenseShare (dW0TVac4MUnmyfmXfWhXD), Repayment (naC33sDcPKQxs_bAF_vNS).
- backend/prisma/schema.prisma: `Expense`, `ExpenseShare` et `Repayment` sont présents depuis la migration métier du 27 novembre 2026; aucune route finance.
- backend/src/index.ts: sante, auth, /api/me, /ws de test; aucun endpoint finance. WS ouvert et temporaire.
- mobile/src/lib/api.ts et mobile/src/app/colocsync.tsx: sante/auth uniquement; aucune vue ou action finance.

## Modele cible et invariants
### Expense (DtJaxKaaxqhLlOFtBouYA)
house_id, payer_id, title, amount DECIMAL(10,2) > 0, expense_date, is_private (defaut TRUE), description. Relations: fk_Expense_house_id_House (R9nNi9wn7D9LwNr5VB2cF), fk_Expense_payer_id_User (0h7Czf3yT-_-YcC7njSE2). Index maison/date et payeur/date.
### ExpenseShare (dW0TVac4MUnmyfmXfWhXD)
expense_id, user_id, amount DECIMAL(10,2) > 0; unicite (expense_id,user_id) (uq_expense_share_expense_user). Somme des parts = montant; depense privee sans partage. Relations: w19tYydZPadsBa6yph_Y2 et oT9iYgl-Lbs_GJukcrpVp.
### Repayment (naC33sDcPKQxs_bAF_vNS)
house_id, payer_id, recipient_id, amount DECIMAL(10,2) > 0, repayment_date; recipient_id <> payer_id. Dette globale sans lien a ExpenseShare: uniquement transferts reels, jamais compensations automatiques. Relations: 38sskrRClM9f2JglSom0v, 60EVpRCBWD1LyvOm657mc, -qxbqITlSN2QMNv7vFm81.

## Cible vs actuel
- Cible: liste/detail/creation Expense, parts ExpenseShare, privee visible selon regle et sans partage, soldes parts + remboursements reels, Repayment, permissions serveur, vues mobile.
- Actuel: les trois tables finance sont migrées, mais les routes/services et l’écran métier restent absents.

## Plan de developpement
### Vues
A confirmer via MCP sur 330:1583 et 330:1691: accueil finances (total/solde/historique), detail depense, creation/edition privee ou partagee, saisie remboursement, loading/vide/erreur/acces refuse. Ne pas inventer les variantes visuelles.
### API a concevoir
Prefixe a valider: /api/houses/:houseId/finances. GET /expenses?from=&to=; POST /expenses (Expense + parts atomiques); GET /expenses/:expenseId; PATCH ou suppression (decision produit); GET /summary (sans ecrire Repayment); GET/POST /repayments. Montants decimaux exacts (string recommande), dates ISO, validation IDs/parts/maison.
### Transaction, permissions, erreurs
Session serveur obligatoire (401). Verifier appartenance active a la meme maison pour maison, payeur, beneficiaires et acteurs du remboursement. Transaction pour depense + parts. Verifier montant positif, somme exacte, aucune part en prive, payer != destinataire. Aucune fuite privee dans liste/detail/resume. Codes: 400 validation, 401 session, 403 permission, 404 non visible/inexistant, 409 concurrence eventuelle, 500 sans details sensibles.
### Mobile
Ajouter API typee dans mobile/src/lib/api.ts, hooks TanStack Query et cles maison/periode, routes Expo Router apres confirmation Figma, composants NativeWind existants, invalidation post-mutation et prevention doubles soumissions.

## Tests requis
API: session absente, autre maison, privee hors payeur, utilisateurs externes, payer == destinataire. Invariants: montant positif, parts uniques, somme exacte, aucune part privee, remboursement independant. Transactions atomiques et aucune fuite des privees. Mobile: loading/empty/error, validation, invalidation, navigation frames. Regression: auth, health, typecheck backend/mobile, lint mobile.

## Decisions ouvertes
Acces MCP pour noms/variantes/etats; edition/suppression et historique; format montant/devise/periode/arrondi; qui edite; parts par defaut; 403 ou 404; migration Prisma et compatibilite MLD INTEGER avec User.id actuellement String.

## Validation
Lecture MLD, Prisma, API, client mobile, manifests et captures Figma en lecture seule. Aucun modèle Prisma finance, endpoint finance ou vue finance métier trouvé.

## Complément Figma — inspection ultérieure
Captures MCP consultées en lecture seule pour `330:1583` et `330:1691`. L’écran présente « Dépenses », résumé avancé par le membre et remboursements en attente, liste des remboursements (émetteur/destinataire/montant), onglets « Dépenses communes »/« Mes dépenses », lignes par membre/catégorie/montant et barres « Équilibre des dépenses ». La seconde frame est une variante de l’écran. Le visuel n’établit ni formule de calcul ni parcours d’ajout/édition. Le MLD garde priorité pour les invariants : parts = montant, aucune part sur une dépense privée, remboursement enregistré uniquement s’il s’agit d’un transfert réel. Aucun outil d’écriture Figma appelé.

## Mise à jour backend — 27 novembre 2026

`Expense`, `ExpenseShare` et `Repayment` sont désormais présents dans Prisma et la migration métier; ils ne sont pas encore accessibles par API. Les dépenses privées restent rattachées à `houseId` et visibles selon la décision produit à leur auteur dans le logement; aucune table personnelle indépendante. Cette interprétation respecte la maquette « Mes dépenses » sans contredire la FK du MLD.

Créer `routes/expenses.ts`, `routes/repayments.ts`, `schemas/finance.ts`, `services/finance.ts` (noms cibles, non existants) sous `backend/src/`. Les routes passent par le middleware session + adhésion active à la House; le payeur/acteur vient de la session. Le service vérifie que tous les bénéficiaires sont membres actifs de la même House, que les montants sont positifs, que les parts uniques totalisent exactement le montant et qu’une dépense privée n’a aucune part. Employer `Prisma.Decimal`, jamais `number` flottant pour les calculs; écrire dépense et parts dans une transaction. Un remboursement représente un transfert réellement effectué, ne modifie pas les parts et interdit payeur = destinataire. Ne jamais exposer une dépense privée à un autre membre dans liste, détail ou résumé.

Routes proposées : `GET/POST /api/houses/:houseId/expenses`, `GET/PATCH/DELETE /api/houses/:houseId/expenses/:expenseId` selon politique d’édition/suppression à confirmer; `GET /summary`; `GET/POST /repayments`. Valider les sommes à deux décimales, dates, limites de période et IDs. Tests d’autorisation, confidentialité privée, transaction/rollback, parts exactes, membres étrangers et remboursements réels. À trancher avant la tranche : devise, calcul/arrondi de l’équilibre affiché et politique de modification/suppression. Le MLD ne fixe pas de formule de solde.
