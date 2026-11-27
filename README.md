# ColocSync

Application mobile de gestion de colocation (projet S5 MMI).

## Stack

- Mobile : React Native, Expo (SDK 57), Expo Router, NativeWind, React Hook Form, Zod, TanStack Query.
- API : Node.js, TypeScript, Fastify, Better Auth, WebSocket.
- Donnees : PostgreSQL 17 et Prisma 7.
- Notifications : Expo Notifications. L’IA est hors périmètre produit actuel.

## Développer avec Docker Desktop

Le guide Windows de première installation et de démarrage est dans
[`docs/UTILISER_OPENCODE.md`](docs/UTILISER_OPENCODE.md#8-installer-docker-desktop-et-lancer-le-projet).
Il couvre l’API, PostgreSQL, Expo sur téléphone et navigateur, ainsi que Prisma Studio.

À chaque séance, démarre toute la stack avec :

```powershell
npm run dev
```

- QR Expo Go : affiché dans cette fenêtre de terminal
- API : http://localhost:3000/api/health
- Aperçu web Expo : http://localhost:8081
- QR code Expo Go : affiché dans les logs de `mobile`
- Prisma Studio : http://localhost:5555
- Arrêt sans perte des données : `docker compose down`

PostgreSQL conserve ses données dans le volume Docker `pg_data`. N’utilise pas
`docker compose down -v` sauf si tu veux supprimer la base locale.

## Travail sur la base de donnees

```powershell
# Generer le client Prisma
docker compose exec api npm run db:generate

# Creer une migration apres modification du schema
docker compose exec api npx prisma migrate dev --name modification

# Prisma Studio démarre avec la stack : http://localhost:5555
```

Le modèle, les tables, les types PostgreSQL, les relations et les contraintes sont décrits dans [`docs/DATABASE.md`](docs/DATABASE.md). Le workflow de typage Prisma/TypeScript et les consignes pour les agents IA sont dans [`docs/TYPESCRIPT-DATABASE.md`](docs/TYPESCRIPT-DATABASE.md). Après chaque changement de modèle, régénère Prisma Client et lance le typecheck.

## Authentification

Par défaut, `AUTH_EMAILS_ENABLED=false` : Better Auth accepte l’inscription et la connexion sans Resend. La vérification et la réinitialisation par e-mail restent alors désactivées; le changement de mot de passe depuis le compte reste disponible.

Pour activer plus tard les e-mails et rendre la vérification obligatoire, configurez dans `.env` :

- `BETTER_AUTH_SECRET` : secret aléatoire long, obligatoire en production.
- `BETTER_AUTH_URL` : URL publique de l’API utilisée dans les liens e-mail et OAuth.
- `AUTH_EMAILS_ENABLED=true`, `RESEND_API_KEY` et `AUTH_EMAIL_FROM` : envoi des e-mails de vérification et de réinitialisation; l’expéditeur doit être autorisé par Resend. L’API refuse de démarrer si l’option est activée sans ces identifiants.
- OAuth est facultatif : renseignez les paires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` ou `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`. Les boutons correspondants restent inactifs sans identifiants.

Ajoutez les variables nécessaires localement après avoir créé `.env` depuis `.env.example`. Ne commitez jamais les vraies valeurs. Les liens de retour mobile utilisent le schéma `colocsync`.

Les lockfiles et les migrations Prisma doivent rester versionnés avec Git.

Les fonctionnalites metier ColocSync restent a developper.
