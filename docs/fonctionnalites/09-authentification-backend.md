# Audit backend — Better Auth et API

**Relevé : 27 novembre 2026.** Portée : backend/API, non les lacunes d’interface. Références : `backend/src/lib/auth.ts`, `backend/src/index.ts`, `backend/prisma/schema.prisma`, `backend/package-lock.json`, `compose.yaml`, `docs/ETAT_IMPLEMENTATION.md`. Better Auth `1.7.7`; documentation officielle 1.7.x.

## État constaté

- Better Auth utilise Prisma/PostgreSQL et le modèle `User` canonique. `emailAndPassword.enabled` est actif; l’inscription, connexion, gestion de session et endpoints d’auth sont relayés via `GET/POST /api/auth/*`.
- La configuration fournit envoi de réinitialisation par Resend et envoi de vérification conditionnel. `requireEmailVerification`, `sendOnSignUp` et `sendOnSignIn` dépendent de `AUTH_EMAILS_ENABLED`; l’adresse est donc exigée avant connexion seulement quand ce drapeau est actif. Expiration du lien de vérification configurée à 3600 s; session révoquée sur reset.
- Le serveur Fastify transmet les cookies `Set-Cookie` reçus de Better Auth et `/api/me` appelle `auth.api.getSession()` sur les en-têtes entrants; requête sans session observée : 401. Cela prouve une lecture de session, pas une couverture des futures routes métier.
- Plugin Expo installé; le client mobile utilise `expo-secure-store`. OAuth Google/Apple/Facebook n’est activé qu’avec les paires d’identifiants correspondantes; configuration en cours : tous faux. Cela n’affecte pas email/mot de passe.
- `trustedOrigins` contient schéma `colocsync://`, origine client et origines Expo en développement. CORS autorise l’origine `CLIENT_ORIGIN` avec credentials.
- Rate limit Better Auth activé; seuils spécifiques : envoi de vérification et demande de reset, 1/minute. Les autres paramètres reposent sur les défauts de la version; confirmer la persistance/partage du stockage pour un déploiement multi-instance.
- Garde existante : secret obligatoire en production; variables Resend obligatoires si envoi activé. Ne pas confondre ce contrôle de présence avec validation de longueur/entropie ou déploiement correct.
- Vérifications HTTP en lecture seule sur Docker : `/api/health` 200 et base connectée; `/api/auth/config` indique email activé; `/api/auth/providers` indique les trois fournisseurs non configurés; `/api/me` sans session 401.

## Verdict demandé

**Non, l’authentification backend/API n’est pas encore “tout bon” ni validée de bout en bout.** Le socle Better Auth est intégré et répond; les appels HTTP observés sont cohérents. Restent des contrôles de configuration/sécurité production et surtout aucun middleware partagé d’authentification/autorisation pour les futures routes métier. Les fonctions détaillées ci-dessous ne sont pas toutes testées par des tests d’intégration de flux.

## À compléter ou prouver avant production

1. **Secret/configuration** — rejeter les valeurs placeholder et secrets faibles; vérifier ≥32 caractères/entropie suffisante et rotation maîtrisée. `compose.yaml` fournit des valeurs de développement localhost et un secret vide par défaut : le déploiement production doit injecter un secret fort, URL HTTPS canonique, `CLIENT_ORIGIN` exact et aucun fallback localhost. Valider la configuration au démarrage.
2. **Cookies et transport** — le proxy relaie `Set-Cookie`, mais `auth.ts` ne montre pas de configuration explicite d’attributs cookie. Vérifier sur la réponse réelle production : Secure sous HTTPS, HttpOnly, SameSite adapté, Path/Domain restreints; ne jamais journaliser les valeurs. TLS au proxy, CORS à origine explicite et CSRF/origines de confiance cohérents. Ne pas affirmer les attributs effectifs sans inspection de l’en-tête HTTP.
3. **Sessions** — vérifier durée/renouvellement, expiration, rotation, déconnexion et révocation, stockage DB et comportement SecureStore sur Android/iOS; décider si une limite de sessions/appareil est nécessaire. Tester cookie absent, invalide, expiré et révoqué.
4. **E-mail/vérification/reset** — documenter le comportement voulu lorsque la livraison est désactivée (actuellement `requireEmailVerification` false); prouver token à usage unique/expiration, réponses anti-énumération, throttling et révocation des sessions après reset. Ajouter tests d’intégration Resend mocké; ne jamais loguer les liens/tokens.
5. **Limitation d’abus** — tester limites d’inscription, login, reset et vérification sous charge. Better Auth indique que les appels `auth.api` côté serveur ne passent pas par son rate limiter; ajouter des limites API adaptées sur endpoints métier sensibles. En multi-instance, employer un stockage rate-limit partagé si requis.
6. **Middleware métier** — implémenter plugin Fastify commun qui résout session; exposer seulement `session.user.id`; 401 sans session; service d’adhésion active et rôle; 403 (ou 404 anti-énumération selon contrat) pour ressources hors périmètre. Aucun `userId` client ne peut autoriser une action. Protéger également les upgrades WebSocket et chaque abonnement.
7. **Tests de sécurité/API** — tests réels des flux inscription, vérification, connexion, session/cookie, reset/change password, déconnexion, rate limit, origines CORS et droits métier. Les contrôles actuels `typecheck` et quelques GET ne sont pas des preuves de ces propriétés.

## Flux et points d’audit

| Fonction | État connu | Contrôle manquant / preuve attendue |
|---|---|---|
| Inscription email/mot de passe | Better Auth activé; écran mobile existant | Test API succès/doublon/validation; confirmer politique d’email vérifié |
| Connexion | Route générique; session consultable par `/api/me` | Test mauvais identifiant, cookie créé, limites de tentative |
| Vérification e-mail | Callback Resend; conditionnée à `AUTH_EMAILS_ENABLED` | Tester token expiré/consommé, renvoi limité et politique production |
| Demande/réinitialisation mot de passe | Envoi configuré; révocation sessions activée | Tester token et non-énumération, révocation effective, throttling |
| Changement mot de passe | Endpoint Better Auth disponible selon client | Tester session requise, mot de passe courant, révocation attendue |
| Sessions/déconnexion | Stockage Prisma; endpoint via Better Auth | Vérifier cookie/TTL/révocation réelle et comportement multi-appareil |
| Cookies | `Set-Cookie` relayé par Fastify | Attributs effectifs Secure/HttpOnly/SameSite à prouver en production |
| OAuth | Google/Apple/Facebook conditionnels | Non configurés dans l’environnement interrogé; hors parcours actif |
| WebSocket | `/ws` public, `connected`/`ping` seulement | Ne pas envoyer de données; fermer ou protéger avant usage métier |

## Répartition backend cible

`src/lib/auth.ts` reste la configuration Better Auth. Refactoriser `src/index.ts` à terme en `src/app.ts` (construction Fastify), `src/plugins/authentication.ts` (session), `src/plugins/house-access.ts` (Membership/rôle), `src/routes/auth.ts` ou le handler proxy, `src/routes/me.ts`, `src/schemas/` et `src/services/`. Les noms sont une proposition d’organisation, non des fichiers déjà créés. Better Auth reste responsable des identifiants; les services métier ne relisent ni ne dupliquent le hash de mot de passe.

## Sources documentaires

- [Better Auth 1.7 — cookies](https://better-auth.com/docs/concepts/cookies)
- [Better Auth 1.7 — rate limiting](https://better-auth.com/docs/concepts/rate-limit)
- [Better Auth 1.7 — email](https://better-auth.com/docs/concepts/email)
- [Better Auth — intégration Fastify](https://better-auth.com/docs/integrations/fastify)
- [Better Auth — Expo](https://better-auth.com/docs/integrations/expo)

Ces liens expliquent les capacités du framework, pas la preuve que chaque option est configurée correctement ici. Audit statique et requêtes HTTP limitées; aucune revue exhaustive ni test de pénétration effectués.
