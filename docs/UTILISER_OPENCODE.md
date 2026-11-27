# Démarrer ColocSync dans OpenCode

Guide de prise en main pour les personnes qui contribuent au projet.

## 1. Installer OpenCode

Sur Windows, télécharge **OpenCode Desktop** depuis [opencode.ai](https://opencode.ai/) et lance l’installateur.

## 2. Connecter son compte Anthropic

L’agent par défaut utilise **Claude** via Anthropic. Dans OpenCode, connecte le fournisseur Anthropic depuis **Settings → Fournisseurs**, puis suis la méthode de connexion proposée. L’accès aux modèles dépend du compte ou de l’abonnement Anthropic configuré.

Les conversations longues peuvent consommer davantage. Pour réduire le contexte, utilise `/compact` ou démarre une nouvelle conversation après avoir terminé une tâche.

## 3. Ouvrir le bon dossier

Maintenant tu vas dans l'accueil d’OpenCode (tu peux faire ALT + la touche Fin). Puis tu survole le premier onglet sous Projets et tu cliques sur l'icône de dossier pour ouvrir un projet.

Ouvre le dossier racine de ton clone github de ColocSync avec **File → Open Folder**. C'est vraiment le dossier à la racine qui s'appelle `ColocSync`.

Démarre une **nouvelle conversation dans ce dossier**. OpenCode y détecte la configuration du projet, notamment l’agent par défaut et ses consignes. Comme ça tu peux directement utiliser l'IA sans rien avoir à config.

## 4. Choisir l’agent ColocSync

Dans le sélecteur d’agent **en bas à gauche** dans la conversation, choisis **ColocSync-Claude** (`colocsync`). C’est l’orchestrateur du projet, propulsé par **Claude Sonnet 5.5**. Il choisit le spécialiste et le niveau d’effort appropriés. Ce profil utilise Claude, **pas GPT-6 Luna** : Luna est un modèle OpenAI.

Pour utiliser OpenAI à la place, sélectionne **ColocSync OpenAI** (`colocsync-openai`) dans le même sélecteur. Son orchestrateur et ses sous-agents utilisent la famille OpenAI. Changer uniquement le modèle de la conversation ne bascule pas les profils de sous-agents.

**N’utilise pas `Plan` ni `Build` pour travailler sur ColocSync.** Garde l’orchestrateur voulu sélectionné, y compris pour demander une analyse ou un plan de travail.

## 5. Expliquer ce que vous voulez

Pas besoin de connaître le code ni les termes techniques. Explique simplement :

- Qu’est-ce qui te pose problème, ou que voudrais-tu pouvoir faire ?
- Qu’aimerais-tu qu’il se passe ?
- As-tu un exemple ou une image à partager ?

Exemple : « Quand je crée un compte, je veux un message qui me confirme qu’un e-mail a été envoyé. »

ColocSync regardera le projet et te demandera des précisions si nécessaire. Le plan du projet sera dans `docs/` ; demande à ColocSync de le consulter avant de commencer une nouvelle fonctionnalité. S’il ne le trouve pas, préviens le responsable du projet au lieu de deviner.

Si ta demande concerne une maquette, partage le lien Figma de l’écran. La reproduire dans l’application ne modifie pas la maquette originale ; la changer demande ton accord.

## 6. Quelques règles pratiques

- Laisse l’orchestrateur distribuer le travail ; ne change pas manuellement vers un autre rôle pour contourner un blocage.
- Les fichiers `.env` et leurs variantes ne doivent pas être lus ou recherchés. Les fichiers nommés exactement `.env.example` sont autorisés ; ne copie jamais de vraies valeurs secrètes dans un exemple. Fais toujours attention à laisser le `.env` dans le `.gitignore`. Sinon tu risques de divulguer des secrets dans le dépôt.
- ColocSync garde le travail sur ta branche de travail. Il ne l’ajoute pas à la version principale du projet (`main`) sans te demander clairement ton accord.

## 7. Comment gérer le github ?

La branche `main` contient la version commune du projet. Ta **branche de travail** est un espace séparé où ColocSync peut avancer sans modifier cette version. Ainsi, vous pouvez toutes deux travailler en parallèle sur le projet sans vous marcher dessus. Quand tu veux que ton changement soit intégré à la version commune, ColocSync te demandera ton accord puis fera un merge de ta branche dans `main`. Tu peux continuer à travailler sur ta branche après le merge. Quand l'autre membre de l'équipe a fini son travail, il peut faire la même chose pour que tu récupères ses changements dans ta branche, il faudra donc que tu demande à ColocSync de mettre à jour ta branche avec les changements de `main` avant de continuer ton travail.

Quand tu demandes une modification, voici ce qui se passe :

1. **ColocSync vérifie où en est le projet.** Il regarde ta branche de travail et la version commune (`main`). S’il n’existe pas encore de branche à ton nom, il en crée une à partir de la dernière version commune. Sinon, il reprend celle qui existe.
2. **Il met ta branche à jour si nécessaire.** Si `main` a reçu des changements entre-temps, ColocSync les récupère dans ta branche sans effacer ton travail. S’il ne peut pas réunir les changements sans risque, il s’arrête et demande de l’aide.
3. **Il fait la modification et l’enregistre sur ta branche.** Cette sauvegarde ne change pas `main`.
4. **Quand le changement est prêt, il te l’explique** et te dit ce qu’il a vérifié. Il te demande ensuite : « Veux-tu ajouter cette modification à la version principale du projet ? »
5. **Tu décides.** Si tu réponds oui, ColocSync ajoute le changement à `main` et conserve ta branche de travail pour la suite. Si tu réponds non, le changement reste sur ta branche et pourra être repris plus tard.

Tu n’as pas besoin de connaître les commandes Git, tu peux répondre simplement « oui, ajoute-le à la version principale » ou « non, je veux encore le modifier ».

Comme le tout sera potentiellement géré par OpenCode, il est important de penser à lui demander de faire un commit de temps en temps pour que tu puisses revenir à un état précédent si il y a le moindre problème. Tu peux lui demander de faire un commit à tout moment, il te demandera un message de commit et fera le commit pour toi.

**Ajouter un changement à `main` ne signifie pas forcément que l’application est publiée aux utilisateurs.** Cela dépend de la façon dont le projet sera déployé. À ce moment là, si vous ne savez vraiment pas comment le déployer, venez me voir, je pourrais vous aider à le faire.

## 8. Installer Docker Desktop et lancer le projet

Docker Desktop fournit l’environnement Linux isolé du projet : PostgreSQL, l’API, Expo et Prisma Studio tournent dans des conteneurs. Node.js est nécessaire uniquement pour lancer `npm run dev` ; PostgreSQL reste dans Docker.

### Installer Docker Desktop (Windows)

1. Installe [Node.js LTS](https://nodejs.org/) et [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Dans l’installateur Docker, garde le backend **WSL 2** proposé par défaut.
3. Redémarre Windows si demandé, lance **Docker Desktop** et attends que le moteur soit démarré.

### Première initialisation

Connecte le PC au réseau du téléphone (Wi-Fi ou hotspot), ouvre PowerShell à la racine de `ColocSync`, puis lance :

```powershell
npm run dev
```

La commande crée `.env` depuis l’exemple s’il manque, détecte l’IPv4 de la route active, la transmet à Docker Compose et démarre les services. Le premier lancement installe les dépendances ; les suivants réutilisent les volumes et ne réinstallent que si un `package-lock.json` change. Pour arrêter les services, appuie sur `Ctrl+C`.

### Accéder aux services

Ouvre les services pendant que le script tourne :
   - API : http://localhost:3000/api/health
   - Application web sur le PC : http://localhost:8081
   - Prisma Studio : http://localhost:5555

`Ctrl+C` arrête les conteneurs sans supprimer les données. `docker compose down -v` supprimerait la base locale.

### Ouvrir l’application sur un téléphone

1. Installe **Expo Go** depuis le Play Store ou l’App Store.
2. Connecte le téléphone et le PC au même réseau, par exemple en activant le hotspot du téléphone puis en connectant le PC dessus.
3. Scanne avec Expo Go le QR affiché dans le terminal.

Le script redétecte l’adresse à chaque lancement, y compris après un changement de Wi-Fi ou de hotspot. La communication via hotspot dépend du modèle et des réglages du téléphone. Si Expo Go ne se connecte pas, vérifie aussi l’autorisation de Docker Desktop dans le pare-feu Windows.

Le navigateur et l’app Expo Go utilisent le même serveur de développement. L’API est publiée sur `localhost:3000` pour le navigateur ; le client mobile actuel utilise aussi le port `3001`, conservé pour compatibilité. Prisma Studio est accessible uniquement sur le PC à `localhost:5555`.
