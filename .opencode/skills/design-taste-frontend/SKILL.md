---
name: design-taste-frontend
description: Guide visuel ColocSync adapté de TasteSkill. Obligatoire pour créer ou refaire un écran, intégrer une maquette Figma ou juger un rendu. Pas pour un changement purement textuel ou technique.
---

# Design Taste Frontend — ColocSync

1. **Trouve la référence.** Une maquette validée fait foi. Lis le frame exact, sa capture, ses composants, variantes et tokens. Ne propose pas de nouvelle palette si le design est fourni. Si l’accès manque, demande un lien de sélection accessible ou une capture ; n’invente pas les détails.
2. **Sans maquette, pars de l’usage.** Nomme l’action principale et le contenu qu’une personne doit voir en premier. Reprends d’abord les primitives de l’application (`mobile/src/constants/theme.ts`, écrans voisins, composants partagés). Préfère hiérarchie typographique, espacements cohérents et accent réservé à l’action principale plutôt que cartes, dégradés ou décoration ajoutés par défaut. Ne transforme pas le thème de démonstration en charte approuvée.
3. **Traduis en React Native.** Le code généré par Figma est une référence, pas du code Expo prêt à coller. Utilise les composants du projet, NativeWind et le flux naturel ; pas de positionnement absolu généralisé, d’HTML/CSS web collé ni de bibliothèque ajoutée pour une seule vue. Préserve les zones sûres, le clavier, le défilement et les tailles de texte. Représente les états réels, pas des chiffres ou contenus présentés comme authentiques.
4. **Regarde avant de conclure.** Compare une capture du rendu et la référence à largeur comparable ; contrôle aussi une largeur étroite, les textes longs, le contraste, les zones tactiles et les états utiles. Corrige les écarts les plus visibles, puis regarde à nouveau. Un typecheck ne prouve pas la fidélité. Sans aperçu disponible, indique clairement « rendu non vérifié ».

Adaptation locale du workflow mobile de TasteSkill : aucun script web, asset externe ni générateur de palette requis.
