# ColocSync

Application mobile de gestion de colocation (projet S5 MMI).

## Stack

- Mobile : React Native, Expo (SDK 57), Expo Router, NativeWind, React Hook Form, Zod, TanStack Query.
- API : Node.js, TypeScript, Fastify, Better Auth, WebSocket.
- Donnees : PostgreSQL 17 et Prisma 7.
- Notifications : Expo Notifications. IA : integration API a developper.

## Reprendre le developpement avec Docker

Pre-requis : Docker Desktop avec Docker Compose v2.

```powershell
docker compose up -d --build
docker compose ps
```

- API : http://localhost:3001/api/health
- Expo : `docker compose logs -f mobile` (informations de connexion et QR code).
- Logs API : `docker compose logs -f api`
- Arret sans perte des donnees : `docker compose down`

Les fichiers sources sont dans `backend/` et `mobile/`. La base PostgreSQL utilise
le volume Docker `pg_data` : ne pas executer `docker compose down -v` si tu veux
conserver ses donnees.

## Travail sur la base de donnees

```powershell
# Generer le client Prisma
docker compose exec api npm run db:generate

# Creer une migration apres modification du schema
docker compose exec api npx prisma migrate dev --name modification

# Ouvrir Prisma Studio
docker compose run --rm -p 5555:5555 api npx prisma studio --browser none --hostname 0.0.0.0
```

## Authentification

Par défaut, `AUTH_EMAILS_ENABLED=false` : Better Auth accepte l’inscription et la connexion sans Resend. La vérification et la réinitialisation par e-mail restent alors désactivées; le changement de mot de passe depuis le compte reste disponible.

Pour activer plus tard les e-mails et rendre la vérification obligatoire, configurez dans `.env` :

- `BETTER_AUTH_SECRET` : secret aléatoire long, obligatoire en production.
- `BETTER_AUTH_URL` : URL publique de l’API utilisée dans les liens e-mail et OAuth.
- `AUTH_EMAILS_ENABLED=true`, `RESEND_API_KEY` et `AUTH_EMAIL_FROM` : envoi des e-mails de vérification et de réinitialisation; l’expéditeur doit être autorisé par Resend. L’API refuse de démarrer si l’option est activée sans ces identifiants.
- OAuth est facultatif : renseignez les paires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` ou `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`. Les boutons correspondants restent inactifs sans identifiants.

Ajoutez les variables nécessaires localement après avoir créé `.env` depuis `.env.example`. Ne commitez jamais les vraies valeurs. Les liens de retour mobile utilisent le schéma `colocsync`.

## Nouveau poste ou restauration depuis Git

Le projet (mobile + backend) est deja cree : aucun outil de scaffolding requis.
Pour restaurer les dependances a partir des lockfiles :

```powershell
# Creer .env depuis .env.example puis renseigner un vrai BETTER_AUTH_SECRET.
Copy-Item .env.example .env
# Exemple de generation du secret :
# docker run --rm node:24-bookworm-slim node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose build
docker compose up -d db
docker compose run --rm api npm ci
docker compose run --rm api npx prisma migrate deploy
docker compose run --rm --no-deps mobile npm ci
docker compose up -d
```

`backend/package-lock.json`, `mobile/package-lock.json` et les migrations Prisma
doivent etre conserves et versionnes avec Git.

## Telephone physique

Adapter `LAN_IP`, `EXPO_PUBLIC_API_URL` et `BETTER_AUTH_URL` dans `.env` a l'IP
locale du PC, puis relancer `docker compose up -d --force-recreate api mobile`.
Le telephone et le PC doivent etre sur le meme reseau. Sur le telephone,
`localhost` ne designe pas le PC.

Les fonctionnalites metier ColocSync restent a developper.
