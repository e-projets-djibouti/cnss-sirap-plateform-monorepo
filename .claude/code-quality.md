---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Qualité de Code — Niveau Senior

## Principe directeur

Code **propre**, **minimal**, sans superflu. Développement niveau senior.

## Règles impératives

1. **Pas de fichiers longs** : max 300–400 lignes par fichier. Découper en modules/ sous-fichiers si nécessaire.
2. **Pas de superflu** : pas de code mort, imports inutiles, commentaires évidents, duplication.
3. **SOLID** : responsabilité unique, dépendances explicites, interfaces claires.
4. **DRY** : extraire les logiques réutilisables (utils, helpers, hooks partagés).
5. **Lisibilité** : noms explicites, fonctions courtes, structure claire.

## Pratiques attendues

- **Backend** : module → controller léger → service (logique métier) → DTOs. Pas de fat controllers.
- **Frontend** : composants < 150 lignes, extraire la logique dans des hooks/utils.
- **Fichiers > 200 lignes** : signaler et découper avant de continuer.