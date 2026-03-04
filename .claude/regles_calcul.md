# CNSS Djibouti — Règles de Calcul et d'Analyse

## Table des matières

1. [Parsing du fichier Excel](#1-parsing-du-fichier-excel)
2. [Nettoyage du montant Net à Payer](#2-nettoyage-du-montant-net-à-payer)
3. [Détection des doublons](#3-détection-des-doublons)
4. [Règles de calcul des montants](#4-règles-de-calcul-des-montants)
5. [Statistiques affichées](#5-statistiques-affichées)
6. [Purification et nombre après purification](#6-purification-et-nombre-après-purification)
7. [Génération de la référence journal](#7-génération-de-la-référence-journal)
8. [Conversion montant en lettres (français)](#8-conversion-montant-en-lettres)

---

## 1. Parsing du fichier Excel

**Fichier source :** `src/utils/excelParser.ts`

Le fichier Excel (.xlsx ou .xls) est lu feuille par feuille. Toutes les feuilles sont concaténées en un seul tableau d'enregistrements.

### Mapping des colonnes (0-indexé)

| Index colonne | Champ           | Description                     |
|---------------|------------------|---------------------------------|
| 1             | `brenet`         | Numéro de brevet du bénéficiaire |
| 2             | `nomsEtPrenoms`  | Nom complet                     |
| 3             | `netAPayer`      | Montant net à payer             |
| 4             | `codePeriode`    | Code période                    |
| 5             | `typeRelation`   | Assuré, Conjoint, etc.          |
| 6             | `nomMere`        | Nom de la mère (optionnel)      |
| 7             | `nature`         | Nature de la prestation         |
| 8             | `banque`         | Nom de la banque                |
| 9             | `rib`            | Relevé d'Identité Bancaire      |

> **Note :** La colonne 0 est ignorée. La ligne 0 (en-tête) est sautée. Les lignes vides ou sans valeur en colonne 1 sont ignorées. Un numéro séquentiel `no` est attribué automatiquement.

---

## 2. Nettoyage du montant Net à Payer

**Fichier source :** `src/utils/excelParser.ts`, lignes 28-39

Le champ `netAPayer` (colonne 3) subit un nettoyage en 3 étapes :

### Algorithme

```
Entrée : valeur brute (ex: "26 619", "1.234,56", "1,234.56")

Étape 1 — Conversion en chaîne
  valeur = String(row[3])

Étape 2 — Suppression des espaces (séparateurs de milliers)
  cleaned = valeur.replace(/\s+/g, '')
  Puis suppression des caractères non numériques sauf point, virgule et tiret :
  cleaned = cleaned.replace(/[^\d,.-]/g, '')

Étape 3 — Normalisation décimale
  SI la chaîne contient une virgule MAIS PAS de point :
    → Format européen : virgule = séparateur décimal
    → Remplacer virgule par point : cleaned.replace(',', '.')
  SINON :
    → Virgule = séparateur de milliers
    → Supprimer les virgules : cleaned.replace(/,/g, '')

Étape 4 — Conversion finale
  netAPayer = parseFloat(normalized) || 0
```

### Exemples

| Entrée brute  | Après nettoyage | Résultat |
|----------------|-----------------|----------|
| `"26 619"`     | `"26619"`       | 26619    |
| `"1 234,56"`   | `"1234.56"`     | 1234.56  |
| `"1,234.56"`   | `"1234.56"`     | 1234.56  |
| `""`           | `""`            | 0        |
| `null`         | (ignoré)        | 0        |

---

## 3. Détection des doublons

**Fichier source :** `src/utils/excelParser.ts`, fonction `detectDuplicates`

### Paramètres configurables

- **Colonnes de comparaison** (`columns`) : par défaut `['brenet', 'nomsEtPrenoms', 'rib']`
- **Opérateur** (`operator`) : `'AND'` ou `'OR'`

Ces paramètres sont modifiables dans les Paramètres de l'application (`SettingsContext`).

### Mode AND (ET logique)

> Toutes les colonnes sélectionnées doivent correspondre pour que deux enregistrements soient considérés comme doublons.

```
Pour chaque enregistrement :
  clé = concaténation(colonnes sélectionnées, séparateur="|||")
  → toLowerCase() + trim() sur chaque valeur

Si plusieurs enregistrements partagent la même clé :
  → Ils forment un groupe de doublons
  → isDuplicate = true
  → duplicateGroup = numéro de groupe (incrémental)
```

### Mode OR (OU logique)

> Au moins une colonne doit correspondre pour qu'un enregistrement soit considéré comme doublon.

```
Pour chaque colonne :
  Regrouper les enregistrements ayant la même valeur
  Si un groupe a plus d'1 élément → tous sont marqués comme doublons potentiels

Ensuite :
  Collecter tous les indices ayant au moins une correspondance
  Les regrouper par combinaison complète de valeurs pour l'attribution du groupId
```

### Résultat

Chaque enregistrement reçoit :
- `isDuplicate: boolean` — `true` si l'enregistrement fait partie d'un groupe de doublons
- `duplicateGroup: number | undefined` — identifiant du groupe (commençant à 1)

---

## 4. Règles de calcul des montants

**Fichier source :** `src/utils/amountCalculations.ts`

### 4.1 Montant Total

```
Montant Total = Σ (netAPayer) pour TOUS les enregistrements
```

Aucun filtre. Somme brute de tous les `netAPayer`.

### 4.2 Montant (1 par groupe) — `calculateAmountOnePerGroup`

> Prend en compte UNE SEULE occurrence par groupe de doublons + tous les enregistrements non-doublons.

```
Initialiser seenGroups = ensemble vide
Initialiser somme = 0

Pour chaque enregistrement r :
  SI r n'est PAS un doublon (isDuplicate = false) :
    somme += r.netAPayer
  SINON SI r.duplicateGroup existe ET n'est PAS dans seenGroups :
    Ajouter r.duplicateGroup à seenGroups
    somme += r.netAPayer
  SINON :
    (doublon déjà compté → ignorer)

Résultat = somme
```

**Logique clé :** Pour un groupe de 3 doublons avec le même montant de 10 000 DJF, seul le premier est compté → 10 000 DJF au lieu de 30 000 DJF.

### 4.3 Montant Sans Doublons — `calculateAmountWithoutDuplicates`

```
Montant Sans Doublons = Σ (netAPayer) pour les enregistrements où isDuplicate = false
```

> Exclut TOUS les enregistrements marqués comme doublons, y compris la première occurrence.

### 4.4 Écart Total vs 1/groupe

```
Écart = Montant Total - Montant (1 par groupe)
```

> Représente le surcoût dû aux doublons si on garde une occurrence par groupe.

### 4.5 Écart Total vs Sans doublons

```
Écart = Montant Total - Montant Sans Doublons
```

> Représente le montant total des enregistrements marqués comme doublons.

### 4.6 Nombre de groupes de doublons — `calculateDuplicateGroupsCount`

```
Groupes = nombre de valeurs distinctes de duplicateGroup
         parmi les enregistrements où isDuplicate = true ET duplicateGroup existe
```

---

## 5. Statistiques affichées

### Page Analyse (`Analysis.tsx`)

| Indicateur            | Formule                                                    |
|-----------------------|------------------------------------------------------------|
| Enregistrements       | `records.length`                                           |
| Montant Total         | `Σ netAPayer` (tous)                                       |
| Montant (1/groupe)    | `calculateAmountOnePerGroup(records)`                      |
| Assurés / Conjoints   | Comptage par `typeRelation` contenant "assuré" ou "conjoint" |
| Doublons              | `count(isDuplicate=true)` + `(groupes distincts)`          |
| Montant Sans Doublons | = Montant (1/groupe) *(affiché tel quel sur cette page)*   |
| Groupes Doublons      | `duplicateGroupsCount`                                     |
| Écart Total vs 1/grp  | `totalAmount - amountOnePerGroup`                          |
| Écart Sans doublons   | `totalAmount - amountOnePerGroup` *(même calcul)*          |

### Page Purification (`Purify.tsx`)

| Indicateur               | Formule                                                  |
|--------------------------|----------------------------------------------------------|
| Total enregistrements    | `records.length`                                         |
| Montant total            | `Σ netAPayer` (tous)                                     |
| Doublons détectés        | `count(isDuplicate=true)` + nombre de groupes            |
| Après purification       | `records.length - duplicateGroupsCount` (nombre)         |
|                          | `cleanRecordsAmount` (montant des non-doublons)          |
| Montant (1 par groupe)   | `calculateAmountOnePerGroup`                             |
| Écart Total vs 1/groupe  | `totalAmount - amountOnePerGroup`                        |
| Écart Total vs Sans doublons | `totalAmount - cleanRecordsAmount`                   |

### Montant utilisé pour le bordereau PDF

```
Montant du bordereau = calculateAmountOnePerGroup(processedRecords)
```

> C'est le montant "1 par groupe" qui est utilisé comme montant officiel du bordereau de virement.

---

## 6. Purification et nombre après purification

### Nombre d'enregistrements après purification

```
nombreApresPurification = totalRecords - duplicateGroupsCount
```

**Explication :** On retire le nombre de GROUPES de doublons (pas le nombre de doublons). Si 3 enregistrements forment 1 groupe, on retire 1 (on garde donc 2 non-doublons + 1 occurrence du groupe conceptuellement, mais le fichier purifié ne contient que les `isDuplicate = false`).

### Enregistrements du fichier purifié (Excel/PDF)

```
cleanRecords = records.filter(r => !r.isDuplicate)
```

> Le fichier purifié exclut TOUS les enregistrements marqués comme doublons.

---

## 7. Génération de la référence journal

**Fichier source :** `src/utils/amountCalculations.ts`, fonction `generateRefJournal`

### Format

```
NUMyymmddxx
```

| Partie | Description                                   |
|--------|-----------------------------------------------|
| `NUM`  | Préfixe fixe (ajouté au moment de l'insertion)|
| `yy`   | Année sur 2 chiffres                          |
| `mm`   | Mois sur 2 chiffres (01-12)                   |
| `dd`   | Jour sur 2 chiffres (01-31)                   |
| `xx`   | Nombre aléatoire entre 00 et 99               |

**Exemple :** `NUM26030457` → 4 mars 2026, suffixe 57

---

## 8. Conversion montant en lettres

**Fichier source :** `src/utils/numberToFrenchWords.ts`

Le montant total du bordereau est converti en lettres françaises pour le document officiel.

Utilise les règles orthographiques françaises :
- 71 = "soixante-et-onze"
- 80 = "quatre-vingts" (avec S)
- 81 = "quatre-vingt-un" (sans S)
- 200 = "deux-cents" (avec S si pas suivi)
- 201 = "deux-cent-un" (sans S si suivi)

---

## Résumé des formules clés

| Nom                         | Formule                                              |
|------------------------------|------------------------------------------------------|
| **Montant Total**            | `Σ netAPayer (tous)`                                 |
| **Montant 1/groupe**         | `Σ netAPayer (non-doublons + 1er de chaque groupe)`  |
| **Montant sans doublons**    | `Σ netAPayer (isDuplicate = false uniquement)`        |
| **Écart total vs 1/grp**     | `Montant Total - Montant 1/groupe`                   |
| **Écart total vs sans dbl**  | `Montant Total - Montant sans doublons`              |
| **Nb après purification**    | `Total enregistrements - Nb groupes doublons`         |
| **Montant bordereau**        | `= Montant 1/groupe`                                 |

---

*Document généré le 4 mars 2026 — CNSS Djibouti*
