---
name: colocsync-better-auth
description: Sessions, connexion Expo, OAuth, vérification et réinitialisation d’e-mail Better Auth. À charger pour ces parcours, pas pour une route sans changement de session.
---

1. Vérifie la version Better Auth dans les deux `package.json`. Suis le flux entre `backend/src/lib/auth.ts`, `backend/src/index.ts` et `mobile/src/lib/auth-client.ts` avant de changer un réglage.
2. Distingue authentification, vérification d’e-mail et autorisation métier. Vérifie les modes e-mail activé et désactivé, la navigation Expo et les liens de retour si concernés.
3. N’inscris ni ne lis de valeur secrète pour diagnostiquer ; utilise les noms documentés dans `.env.example`. Ne rattache ni n’envoie de données de test à un compte réel sans accord.
4. Décris les cas à vérifier : absence de session, compte non vérifié, déconnexion ou expiration, retour OAuth ou lien expiré selon le lot. Ne présente pas un contrôle local comme un test d’envoi réel.
