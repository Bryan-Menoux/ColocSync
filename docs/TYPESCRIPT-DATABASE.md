# Types TypeScript de la base

Prisma génère les types depuis [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Il n'est pas nécessaire de déclarer à la main une interface pour chaque table ni d'ajouter une seconde génération : le client expose un type de modèle et des types de requête/mutation pour chaque modèle.

## Génération

Après chaque modification du schéma, depuis le conteneur API :

```powershell
docker compose exec api npm run db:generate
docker compose exec api npm run typecheck
```

Sortie générée : `backend/src/generated/prisma/`. **Ne jamais modifier ce répertoire à la main.** Les fichiers sont régénérés par Prisma et ne constituent pas une source de vérité.

Les migrations restent nécessaires pour synchroniser PostgreSQL :

```powershell
docker compose exec api npx prisma migrate dev --name description_du_changement
```

Relire le SQL généré avant application. Les contraintes `CHECK` du MLD sont conservées dans le SQL de migration, car elles ne sont pas décrites dans le schéma Prisma. En déploiement, appliquer les migrations versionnées avec `prisma migrate deploy`, pas `migrate reset`.

## Utiliser les types générés côté backend

Importer les lignes de modèle et types d'opération depuis le client généré. Utiliser le client Prisma partagé de l'API pour les requêtes :

```ts
import type { Expense, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const expenseFilter: Prisma.ExpenseWhereInput = {
  amount: { gt: 0 },
  isPrivate: false,
};

const expenses: Expense[] = await prisma.expense.findMany({ where: expenseFilter });
```

Chaque modèle (`User`, `House`, `Expense`, etc.) a son type de ligne. Le namespace `Prisma` fournit les types d'entrée tels que `Prisma.ExpenseCreateInput`, `Prisma.ExpenseWhereInput`, `Prisma.ExpenseWhereUniqueInput`, `Prisma.ExpenseUpdateInput` et les types de sélection. Utiliser un type adapté à l'opération plutôt qu'une interface copiée de la table.

`Decimal` est exact : garder `Prisma.Decimal`/les valeurs décimales pour les montants; ne pas convertir en `number` pour des calculs financiers sans règle d'arrondi explicite. Les dates Prisma sont des `Date` JavaScript; les colonnes `DATE` restent des dates civiles, à ne pas traiter implicitement comme un instant UTC.

## API et application mobile

Les types Prisma sont des types **internes de persistance**, pas des contrats HTTP :

- Ne pas retourner un modèle Prisma complet comme réponse API. Projeter explicitement les champs publics, en particulier pour `User`, `Account`, les jetons et les mots de passe.
- Définir les formes de requête/réponse (DTO) côté API et valider à l'exécution les données provenant du réseau. Un type TypeScript seul n'effectue aucune validation.
- Dériver les types TypeScript des schémas de validation lorsque le schéma utilisé le permet; sinon, définir une forme explicite et la garder alignée sur le contrat API.
- Le mobile consomme les DTO/API partagés ou ses types de contrat; il n'importe jamais `backend/src/generated/prisma` et n'accède jamais directement à PostgreSQL.
- Ne pas masquer un désaccord avec `any` ou une assertion de type. Corriger la source (modèle, validation, mapping ou DTO) et faire passer le typecheck.

## Réflexe demandé aux agents IA

Avant d'écrire une route, un service, une mutation ou un écran lié aux données :

1. Lire le modèle et les relations concernés dans `backend/prisma/schema.prisma` ainsi que la règle fonctionnelle correspondante dans la documentation de domaine.
2. Vérifier les types réels générés : nullabilité, ID, décimaux, dates, relations et valeurs autorisées; ne pas déduire une règle métier d'une maquette.
3. Décider séparément le type persisté, le schéma de validation d'entrée et le DTO public; vérifier les droits de session/colocation côté serveur.
4. Modifier le schéma Prisma si la persistance change, générer le client, créer/revoir la migration, puis lancer le typecheck.
5. Mettre à jour [`DATABASE.md`](DATABASE.md) si une table, un champ, une contrainte ou une relation change.

Le type généré réduit les erreurs de compilation et garde les accès DB alignés sur le schéma; il ne remplace ni la validation d'entrée, ni les autorisations, ni les tests métier.
