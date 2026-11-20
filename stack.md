# Stack technique — ColocSync

## Stack

| Couche | Technologies | Rôle |
|---|---|---|
| Application mobile | React Native · Expo | Application Android et iOS |
| Navigation et interface | Expo Router · NativeWind | Écrans, navigation et styles |
| Formulaires | React Hook Form · Zod | Saisie et validation |
| Données côté client | TanStack Query | Requêtes, mutations et cache |
| Backend | Node.js · Fastify | API REST et services métier |
| Authentification | Better Auth | Comptes et sessions |
| Persistance | Prisma · PostgreSQL | Accès typé, migrations et stockage |
| Temps réel | WebSocket | Diffusion des changements |
| Notifications | Expo Notifications | Notifications push |
| Intelligence artificielle | API IA | Suggestions via le backend |
| Langage | TypeScript | Typage du mobile et du backend |
| Développement | Docker · Git · GitHub | Environnement local et versionnement |

## Architecture générale

```mermaid
%%{init: {"theme":"dark","flowchart":{"curve":"linear","nodeSpacing":30,"rankSpacing":40},"themeVariables":{"lineColor":"#cbd5e1","fontFamily":"system-ui"}}}%%
flowchart TB
    mobile["Application mobile<br/>React Native · Expo"]
    api["Backend<br/>Node.js · Fastify"]
    prisma["Accès aux données<br/>Prisma"]
    db[(PostgreSQL)]
    auth["Authentification<br/>Better Auth"]
    ia["API IA"]
    push["Notifications push<br/>Expo Notifications"]

    mobile <-->|REST| api
    api --> prisma --> db
    api --- auth
    api --> ia
    api --> push

    classDef client fill:#1e3a5f,stroke:#60a5fa,color:#eff6ff
    classDef server fill:#164e63,stroke:#2dd4bf,color:#ecfeff
    classDef data fill:#4a2c16,stroke:#f59e0b,color:#fffbeb
    classDef service fill:#302340,stroke:#c084fc,color:#faf5ff
    class mobile client
    class api server
    class prisma,db data
    class auth,ia,push service
    linkStyle default stroke:#cbd5e1,stroke-width:2px
```

## Application mobile

```mermaid
%%{init: {"theme":"dark","flowchart":{"curve":"linear","nodeSpacing":30,"rankSpacing":40},"themeVariables":{"lineColor":"#cbd5e1","fontFamily":"system-ui"}}}%%
flowchart TB
    navigation["Navigation<br/>Expo Router"]
    ui["Interface<br/>React Native · NativeWind"]
    forms["Formulaires et validation<br/>React Hook Form · Zod"]
    query["Requêtes et cache<br/>TanStack Query"]
    api["API REST Fastify"]

    navigation --> ui
    ui --> forms
    ui --> query
    forms --> query
    query <-->|HTTP / JSON| api

    classDef client fill:#1e3a5f,stroke:#60a5fa,color:#eff6ff
    classDef server fill:#164e63,stroke:#2dd4bf,color:#ecfeff
    class navigation,ui,forms,query client
    class api server
    linkStyle default stroke:#cbd5e1,stroke-width:2px
```

## Backend et données

```mermaid
%%{init: {"theme":"dark","flowchart":{"curve":"linear","nodeSpacing":30,"rankSpacing":40},"themeVariables":{"lineColor":"#cbd5e1","fontFamily":"system-ui"}}}%%
flowchart TB
    routes["Routes REST<br/>Fastify"]
    auth["Sessions<br/>Better Auth"]
    business["Services métier<br/>Permissions et règles"]
    prisma["Prisma"]
    db[(PostgreSQL)]

    routes --- auth
    routes --> business --> prisma --> db

    classDef server fill:#164e63,stroke:#2dd4bf,color:#ecfeff
    classDef data fill:#4a2c16,stroke:#f59e0b,color:#fffbeb
    class routes,auth,business server
    class prisma,db data
    linkStyle default stroke:#cbd5e1,stroke-width:2px
```

## Synchronisation temps réel

**REST** gère les lectures et les écritures. **WebSocket** signale les changements après leur enregistrement ; **TanStack Query** recharge les données concernées.

```mermaid
%%{init: {"theme":"dark","flowchart":{"curve":"linear","nodeSpacing":30,"rankSpacing":40},"themeVariables":{"lineColor":"#cbd5e1","fontFamily":"system-ui"}}}%%
flowchart TB
    backend["Backend Fastify<br/>Changement enregistré"]
    ws["WebSocket<br/>Événement de changement"]
    query["TanStack Query<br/>Invalidation du cache"]
    rest["API REST<br/>Lecture des données"]
    ui["Interface mobile<br/>Données actualisées"]

    backend --> ws --> query
    query --> rest
    rest -->|Réponse| query
    query --> ui

    classDef client fill:#1e3a5f,stroke:#60a5fa,color:#eff6ff
    classDef server fill:#164e63,stroke:#2dd4bf,color:#ecfeff
    class query,ui client
    class backend,ws,rest server
    linkStyle default stroke:#cbd5e1,stroke-width:2px
```

## Services complémentaires

```mermaid
%%{init: {"theme":"dark","flowchart":{"curve":"linear","nodeSpacing":30,"rankSpacing":40},"themeVariables":{"lineColor":"#cbd5e1","fontFamily":"system-ui"}}}%%
flowchart LR
    backend["Backend Fastify"]
    ia["API IA"]
    push["Service push Expo"]
    mobile["Application mobile<br/>Expo Notifications"]

    backend <-->|Suggestions| ia
    backend --> push --> mobile

    classDef client fill:#1e3a5f,stroke:#60a5fa,color:#eff6ff
    classDef server fill:#164e63,stroke:#2dd4bf,color:#ecfeff
    classDef service fill:#302340,stroke:#c084fc,color:#faf5ff
    class mobile client
    class backend server
    class ia,push service
    linkStyle default stroke:#cbd5e1,stroke-width:2px
```
