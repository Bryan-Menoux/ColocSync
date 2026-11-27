---
name: colocsync-expo
description: Conventions Expo, React Native, NativeWind, formulaires et données. À charger pour navigation, rendu natif, formulaires ou appels API, pas pour un libellé seul.
---

1. Lis `mobile/AGENTS.md` et vérifie les versions dans `mobile/package.json` avant de consulter la documentation Expo correspondante.
2. Garde les routes dans `src/app/`, la logique réutilisable en dehors. Réemploie les composants et tokens avant d’extraire une nouvelle abstraction.
3. Pour un formulaire, respecte les usages React Hook Form/Zod et vérifie saisie, erreur et état d’envoi. Pour une requête, reprends le client et les conventions TanStack Query ; invalide les clés concernées après mutation et distingue chargement, vide et erreur.
4. Indique les contrôles mobile effectivement lancés ou à demander au parent, dont lint et TypeScript. Un rendu sur web ne valide pas le comportement iOS/Android.
