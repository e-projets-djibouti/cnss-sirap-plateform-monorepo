# CNSS Djibouti — Guide de Développement

> **Plateforme de Gestion des Bordereaux de Virement**
> Version 2.0 — Mars 2026 — Déploiement On-Premise

---

## STACK TECHNIQUE

| Couche | Technologie |
|--------|------------|
| Frontend | React 18 + React Router 7 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | NestJS 10 + TypeScript strict |
| ORM | Prisma 5 + PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 7j) + bcrypt (12 rounds) |
| Stockage | MinIO (S3-compatible, self-hosted) |
| Email | Nodemailer (SMTP configurable) |
| PDF | jsPDF + jspdf-autotable (côté client) |
| QR Code | qrcode (npm) |
| Excel | SheetJS (xlsx) côté client + backend validation |
| Graphiques | Recharts |
| Requêtes | TanStack Query v5 |
| Déploiement | Docker Compose + Nginx reverse proxy + SSL |

---

## ARCHITECTURE MONOREPO

```
cnss-djibouti/
├── packages/
│   ├── shared/                  ← Types TS partagés (frontend + backend)
│   │   └── src/
│   │       ├── types/            (CNSSRecord, CNSSStats, DTOs, enums)
│   │       ├── constants/        (BANKS, AMOUNT_RANGES, ROLE_PRIORITY)
│   │       └── utils/            (formatAmount, numberToFrenchWords)
│   │
│   ├── backend/                 ← API NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       ├── config/           (env, jwt, minio, smtp)
│   │       ├── prisma/           (prisma.service, prisma.module)
│   │       ├── common/
│   │       │   ├── guards/       (jwt-auth.guard, roles.guard)
│   │       │   ├── decorators/   (@CurrentUser, @Roles, @Public)
│   │       │   ├── interceptors/ (logging, transform)
│   │       │   ├── filters/      (http-exception.filter)
│   │       │   └── pipes/        (validation.pipe)
│   │       └── modules/
│   │           ├── auth/
│   │           ├── users/
│   │           ├── upload/
│   │           ├── duplicates/
│   │           ├── dashboard/
│   │           ├── analysis/
│   │           ├── bordereaux/
│   │           ├── email/
│   │           ├── verification/
│   │           ├── settings/
│   │           ├── roles/
│   │           └── audit/
│   │
│   └── frontend/                ← React 18 + React Router 7
│       ├── public/
│       │   └── cnss-logo.png
│       └── src/
│           ├── main.tsx
│           ├── routes.tsx         (React Router 7 config)
│           ├── pages/
│           │   ├── Auth.tsx
│           │   ├── Upload.tsx
│           │   ├── Dashboard.tsx
│           │   ├── AdminDashboard.tsx
│           │   ├── Analysis.tsx
│           │   ├── Purify.tsx
│           │   ├── History.tsx
│           │   ├── Verification.tsx
│           │   ├── Users.tsx
│           │   ├── Roles.tsx
│           │   └── Settings.tsx
│           ├── components/
│           │   ├── ui/            (shadcn/ui)
│           │   ├── layout/        (Sidebar, Navbar, Footer, ProtectedRoute)
│           │   ├── dashboard/     (KPICard, charts)
│           │   ├── analysis/      (filters, table, pagination)
│           │   ├── purify/        (stats, export dialog)
│           │   └── auth/          (login form)
│           ├── contexts/
│           │   ├── AuthContext.tsx
│           │   └── SettingsContext.tsx
│           ├── hooks/
│           │   ├── useAuth.ts
│           │   ├── useApi.ts
│           │   └── useRecords.ts
│           ├── lib/
│           │   └── api.ts         (axios instance + intercepteurs JWT)
│           ├── types/              (re-export depuis @cnss/shared)
│           └── utils/
│               ├── excelParser.ts
│               └── dashboardExport.ts
│
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── scripts/
│   ├── deploy.sh
│   └── backup.sh
├── .env.example
├── package.json                  (workspaces root)
└── claude.md                     (CE FICHIER)
```

---

## MODÈLE DE DONNÉES

### Types partagés (@cnss/shared)

```typescript
// types/cnss.ts
interface CNSSRecord {
  no: number;              // Numéro d'ordre (auto-incrémenté global)
  brenet: string;          // Numéro de brevet
  nomsEtPrenoms: string;   // Nom complet
  netAPayer: number;       // Montant net à payer (DJF)
  codePeriode: string;     // Période de paiement
  typeRelation: string;    // "Assuré" ou "Conjoint"
  nomMere?: string;        // Nom de la mère (optionnel)
  nature: string;          // Nature de la prestation
  banque: string;          // Banque destinataire
  rib: string;             // Relevé d'Identité Bancaire
  isDuplicate?: boolean;
  duplicateGroup?: number;
}

interface CNSSStats {
  totalRecords: number;
  totalAmount: number;
  assures: number;
  conjoints: number;
  duplicates: number;
  duplicateGroups: number;
  uniqueBanks: number;
}

enum AppRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DIRECTOR = 'director',
  ACCOUNTANT = 'accountant'
}

// Priorité : owner(1) > admin(2) > director(3) > accountant(4)
const ROLE_PRIORITY: Record<AppRole, number> = {
  owner: 1, admin: 2, director: 3, accountant: 4
};

const BANKS = ['BCIMR', 'CAC BANK', 'SALAAM BANK', 'EXIM BANK', 'BOA'];

const AMOUNT_RANGES = [
  { label: '0 - 50 000 DJF', min: 0, max: 50000 },
  { label: '50 000 - 100 000 DJF', min: 50000, max: 100000 },
  { label: '100 000 - 150 000 DJF', min: 100000, max: 150000 },
  { label: '150 000 - 200 000 DJF', min: 150000, max: 200000 },
  { label: '200 000+ DJF', min: 200000, max: Infinity },
];
```

### Schéma Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AppRole {
  owner
  admin
  director
  accountant
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String         @map("password_hash")
  fullName      String         @map("full_name")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  roles         UserRole[]
  refreshTokens RefreshToken[]
  customRoles   UserCustomRole[]
  auditLogs     AuditLog[]

  @@map("users")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  role      AppRole
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_roles")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model Bordereau {
  id                  String      @id @default(uuid())
  refJournal          String      @map("ref_journal")
  bankName            String      @map("bank_name")
  fileName            String      @map("file_name")
  totalAmount         Decimal     @map("total_amount")
  recordCount         Int         @map("record_count")
  validationDate      DateTime    @default(now()) @map("validation_date")
  records             Json        // JSONB — tableau de CNSSRecord purifiés
  status              String      @default("validated")
  isOriginal          Boolean     @default(true) @map("is_original")
  originalBordereauId String?     @map("original_bordereau_id")
  originalBordereau   Bordereau?  @relation("Duplicates", fields: [originalBordereauId], references: [id])
  duplicates          Bordereau[] @relation("Duplicates")
  pdfStoragePath      String?     @map("pdf_storage_path")
  excelStoragePath    String?     @map("excel_storage_path")
  downloadCount       Int         @default(0) @map("download_count")
  emailCount          Int         @default(0) @map("email_count")
  lastDownloadedAt    DateTime?   @map("last_downloaded_at")
  lastEmailedAt       DateTime?   @map("last_emailed_at")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  @@map("bordereaux")
}

model BankEmail {
  id        String   @id @default(uuid())
  bankName  String   @map("bank_name")
  email     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("bank_emails")
}

model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  category  String   @default("general")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("settings")
}

model CustomRole {
  id          String           @id @default(uuid())
  name        String
  description String?
  isSystem    Boolean          @default(false) @map("is_system_role")
  permissions RolePermission[]
  users       UserCustomRole[]
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  @@map("custom_roles")
}

model Permission {
  id          String           @id @default(uuid())
  code        String           @unique
  name        String
  description String?
  category    String
  roles       RolePermission[]
  createdAt   DateTime         @default(now()) @map("created_at")

  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  roleId       String     @map("role_id")
  permissionId String     @map("permission_id")
  role         CustomRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now()) @map("created_at")

  @@map("role_permissions")
}

model UserCustomRole {
  id        String     @id @default(uuid())
  userId    String     @map("user_id")
  roleId    String     @map("role_id")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      CustomRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now()) @map("created_at")

  @@map("user_custom_roles")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  action    String   // LOGIN, LOGOUT, GENERATE_BORDEREAU, SEND_EMAIL, etc.
  entity    String?  // bordereau, user, setting...
  entityId  String?  @map("entity_id")
  details   Json?
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")
  user      User?    @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

---

## RÔLES ET NAVIGATION

| Rôle | Pages accessibles |
|------|------------------|
| owner | Dashboard (opérationnel + admin toggle), Analyser, Purifier, Historique, Utilisateurs, Rôles, Paramètres |
| admin | Dashboard (admin auto), Analyser, Purifier, Historique, Utilisateurs, Rôles, Paramètres |
| director | Dashboard, Analyser, Purifier, Historique |
| accountant | Dashboard, Analyser, Purifier, Historique |

Résolution du rôle : si multi-rôles → prendre le plus prioritaire (owner > admin > director > accountant).

---

## API ENDPOINTS COMPLETS

### Auth — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/login` | Non | Connexion → { accessToken, refreshToken } |
| POST | `/api/auth/refresh` | Non | Refresh → nouveau couple de tokens |
| POST | `/api/auth/logout` | Oui | Invalidation du refresh token |
| GET | `/api/auth/me` | Oui | Profil + rôles de l'utilisateur connecté |

### Users — `/api/users`

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/users` | Oui | admin+ | Liste tous les utilisateurs |
| POST | `/api/users` | Oui | admin+ | Créer un utilisateur + rôle |
| PATCH | `/api/users/:id` | Oui | admin+ | Modifier profil |
| PATCH | `/api/users/:id/roles` | Oui | admin+ | Modifier les rôles |
| DELETE | `/api/users/:id` | Oui | owner | Supprimer un utilisateur |

### Upload — `/api/upload`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/upload/parse` | Oui | Upload Excel → retourne CNSSRecord[] parsés |

### Duplicates — `/api/duplicates`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/duplicates/detect` | Oui | Détecte doublons sur CNSSRecord[] (colonnes + opérateur) |

### Dashboard — `/api/dashboard`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/dashboard/stats` | Oui | Calcul des 11 KPI |
| POST | `/api/dashboard/charts` | Oui | Données pour les 7 graphiques |
| POST | `/api/dashboard/export/pdf` | Oui | Export PDF rapport analytique |
| POST | `/api/dashboard/export/excel` | Oui | Export Excel (3 onglets) |
| GET | `/api/dashboard/admin` | Oui | Stats depuis la base (admin+) |

### Bordereaux — `/api/bordereaux`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/bordereaux/generate` | Oui | Générer bordereau (PDF + Excel + DB + MinIO) |
| POST | `/api/bordereaux/check-similar` | Oui | Vérifier duplicata (même banque/montant/count/24h) |
| GET | `/api/bordereaux` | Oui | Liste historique (tri par date DESC) |
| GET | `/api/bordereaux/:id` | Oui | Détail d'un bordereau |
| GET | `/api/bordereaux/:id/pdf` | Oui | Télécharger le PDF + incrémenter download_count |
| GET | `/api/bordereaux/:id/excel` | Oui | Télécharger l'Excel + incrémenter download_count |
| POST | `/api/bordereaux/:id/email` | Oui | Envoyer par email + incrémenter email_count |

### Vérification — `/api/verification`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/verification/:hash` | **Non** | Page publique — vérifier authenticité par UUID |

### Settings — `/api/settings`

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/settings` | Oui | admin+ | Tous les paramètres |
| PUT | `/api/settings/duplicates` | Oui | admin+ | Config doublons (colonnes + opérateur) |
| GET | `/api/bank-emails` | Oui | admin+ | Liste emails des banques |
| PUT | `/api/bank-emails/:bank` | Oui | admin+ | Modifier email d'une banque |

### Roles — `/api/roles`

| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/roles` | Oui | admin+ | Liste des rôles customs |
| POST | `/api/roles` | Oui | admin+ | Créer un rôle + permissions |
| PUT | `/api/roles/:id` | Oui | admin+ | Modifier rôle + permissions |
| DELETE | `/api/roles/:id` | Oui | admin+ | Supprimer un rôle custom |
| GET | `/api/permissions` | Oui | admin+ | Liste des permissions disponibles |

---

## RÈGLES MÉTIER CRITIQUES

### Parsing Excel (colonnes 0-9)

| Index | Champ | Type |
|-------|-------|------|
| 0 | *(ignoré)* | — |
| 1 | brenet | string |
| 2 | nomsEtPrenoms | string |
| 3 | netAPayer | number (parsing spécial) |
| 4 | codePeriode | string |
| 5 | typeRelation | string |
| 6 | nomMere | string |
| 7 | nature | string |
| 8 | banque | string |
| 9 | rib | string |

**Parsing netAPayer :**
1. Si vide/null → 0
2. Convertir en string
3. Supprimer tous les espaces (`/\s+/g`)
4. Supprimer caractères non-numériques sauf `.,- ` (`/[^\d,.-]/g`)
5. Si virgule SANS point → virgule = séparateur décimal → remplacer par point
6. Sinon → virgules = séparateurs de milliers → supprimer
7. `parseFloat()`, si NaN → 0

**Règles :** Tous les onglets sont parsés. Ligne 1 = header (ignorée). Lignes sans `row[1]` ignorées. Numérotation `no` globale auto-incrémentée.

### Détection des doublons

**Config :** colonnes sélectionnées (min 1) + opérateur (AND/OR). Par défaut : `['nomsEtPrenoms', 'netAPayer']` + AND.

**Algorithme AND :**
- Clé = concaténation `toLowerCase().trim()` de toutes les colonnes sélectionnées, séparées par `|||`
- Map<clé, indices[]> → si indices.length > 1 → doublon
- Marquage : `isDuplicate = true`, `duplicateGroup = groupId++`

**Algorithme OR :**
- Pour CHAQUE colonne : Map<valeur, indices[]> → collecter les indices en doublon
- Union de tous les indices trouvés
- Regrouper par clé combinée (même que AND)
- Marquer les groupes

**Comparaison :** insensible casse (`toLowerCase()`), trim des espaces, null → chaîne vide.

### Calculs des montants

```
totalAmount = Σ(netAPayer) pour TOUS les enregistrements

amountOnePerGroup = Σ(netAPayer) en comptant 1 seul enregistrement par groupe de doublons
  → non-doublons : toujours comptés
  → doublons : seul le PREMIER du groupe est compté (Set<groupId>)

amountWithoutDuplicates = Σ(netAPayer) WHERE isDuplicate = false

écartOnePerGroup = totalAmount - amountOnePerGroup
écartSansDoublons = totalAmount - amountWithoutDuplicates

assures = count WHERE typeRelation.toLowerCase().includes('assuré')
conjoints = count WHERE typeRelation.toLowerCase().includes('conjoint')
```

### Référence Journal

```typescript
function generateRefJournal(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const xx = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${yy}${mm}${dd}${xx}`;
}
// Préfixé "NUM" → "NUM26030442"
```

### Détection bordereau similaire (anti-duplicata)

Un bordereau est similaire si :
1. Même `bankName`
2. Même `totalAmount`
3. Même `recordCount`
4. Est un `isOriginal = true`
5. `validationDate` dans les dernières 24h (< 86400 secondes)

→ Si similaire trouvé : créer un duplicata (`isOriginal = false`, `originalBordereauId` = id trouvé)
→ Sinon : créer un original

### Enregistrements purifiés

```typescript
const cleanRecords = records.filter(r => !r.isDuplicate);
// Le montant du bordereau = calculateAmountOnePerGroup (pas la somme des cleanRecords)
```

### Conversion nombre en lettres françaises

Règles spécifiques :
- 70-79 = SOIXANTE-DIX à SOIXANTE-DIX-NEUF (60+10 à 60+19)
- 80 = QUATRE-VINGTS (avec S final quand pas suivi)
- 81-89 = QUATRE-VINGT-UN à QUATRE-VINGT-NEUF (sans S)
- 90-99 = QUATRE-VINGT-DIX à QUATRE-VINGT-DIX-NEUF (80+10 à 80+19)
- 100 = CENT, 200 = DEUX-CENTS (S si pas suivi), 201 = DEUX-CENT-UN (sans S)
- 1000 = MILLE (jamais "UN MILLE"), 2000 = DEUX MILLE
- 1000000 = UN MILLION, 2000000 = DEUX MILLIONS

---

## BORDEREAU PDF — FORMAT OFFICIEL

**Orientation :** Paysage A4. **Biblio :** jsPDF + jspdf-autotable.

```
┌─────────────────────────────────────────────────────────┐
│ [Logo CNSS 60x17mm]   REPUBLIQUE DE DJIBOUTI   [QR 40mm]│
│                       Unité-Egalité-Paix                 │
│          CAISSE NATIONALE DE SECURITE SOCIALE             │
│                                                          │
│ Réf Journal: NUM26030442                                 │
│ Nombre d'enregistrements: 156                            │
│ Montant total: 12 345 678 DJF                            │
│ Date de validation: 04/03/2026 à 08:30:15                │
│                                                          │
│          BORDEREAU DE VIREMENT FINAL ET VALIDÉ           │
│                                                          │
│ Adressé à Monsieur le Directeur de la Banque BCIMR       │
│                                                          │
│ La CNSS titulaire du compte 570436 262 002 20 invite     │
│ la BCIMR à créditer la somme s'élevant à :               │
│                                                          │
│ DOUZE MILLIONS TROIS-CENT-QUARANTE-CINQ MILLE            │
│ SIX-CENT-SOIXANTE-DIX-HUIT DJF                          │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ N° │ Brevet │ Nom (max 20) │ Net │ Période │ ...  │  │
│ │ En-tête : fond #1E40AF, texte blanc                 │  │
│ │ Lignes alternées : fond #F5F7FA                     │  │
│ └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**QR Code :** URL `{baseUrl}/verification/{bordereauId}`, couleur `#1E40AF`, taille 200px.
**Numéro de compte CNSS :** `570436 262 002 20`

---

## EMAIL — FORMAT OFFICIEL

- **From :** `CNSS Djibouti <noreply@cnss.djib-data-ai.com>`
- **To :** Email de la banque (depuis table `bank_emails`)
- **Sujet :** `Bordereau de virement NUM{refJournal} - {banque}`
- **Pièces jointes :** PDF + Excel en base64
- **Corps :** HTML avec en-tête CNSS, référence au compte `570436 262 002 20`, détails du bordereau

---

## DASHBOARD — 11 KPI

| # | KPI | Source |
|---|-----|--------|
| 1 | Total enregistrements | `stats.totalRecords` |
| 2 | Montant total | `stats.totalAmount` DJF |
| 3 | Montant (1/groupe) | `calculateAmountOnePerGroup()` DJF |
| 4 | Montant sans doublons | `calculateAmountWithoutDuplicates()` DJF |
| 5 | Écart Total vs 1/groupe | `totalAmount - amountOnePerGroup` DJF |
| 6 | Écart Total vs Sans doublons | `totalAmount - amountWithoutDuplicates` DJF |
| 7 | Assurés | count + pourcentage |
| 8 | Doublons (occurrences) | count + pourcentage |
| 9 | Groupes de doublons | `stats.duplicateGroups` |
| 10 | Conjoints | count + pourcentage |
| 11 | Banques uniques | `stats.uniqueBanks` |

### 7 Graphiques

1. Répartition par banque — Camembert (top 6)
2. Assurés vs Conjoints — Camembert (2 segments)
3. Top 6 banques détails — Bar/Line toggle (enregistrements + montants)
4. Distribution par période — Bar/Line toggle (top 6)
5. Distribution des montants — Bar/Line toggle (5 tranches)
6. Répartition par nature — Bar/Line toggle (top 5)
7. Comparaison Assurés vs Conjoints — Bar/Line toggle (montant, count, moyenne)

---

## STOCKAGE MinIO

```
Bucket: bordereaux (privé)
Structure: {bordereau_uuid}/{fileName}_purifie_{refJournal}.pdf
           {bordereau_uuid}/{fileName}_purifie_{refJournal}.xlsx
```

Seuls les originaux (`isOriginal = true`) uploadent des fichiers. Les duplicatas réutilisent les chemins de l'original.

---

## DOCKER COMPOSE — SERVICES

| Service | Image | Ports | Volume |
|---------|-------|-------|--------|
| postgres | postgres:16-alpine | 5432 | pgdata (persistant) |
| minio | minio/minio:latest | 9000 (API) + 9001 (console) | miniodata (persistant) |
| api | Build local (NestJS) | 3000 | — |
| frontend | Build local (Vite→Nginx) | 80 interne | — |
| nginx | nginx:alpine | 80 + 443 | certs, logs |

---

## PHASES DE DÉVELOPPEMENT

### PHASE 1 — Socle & Infrastructure (Semaines 1–2) 🔵

**Objectif :** Socle sécurité et administration prêt en production interne (auth, RBAC dynamique, profil utilisateur, observabilité de base).

**Backend (réellement implémenté) :**
- [x] Monorepo PNPM workspaces opérationnel (`backend`, `frontend`, `shared`)
- [x] NestJS 10 strict + `ConfigModule` global + Prisma + `class-validator`
- [x] Schéma Prisma en place : `Role`, `Permission`, `RolePermission`, `User`, `Profile`, `RefreshToken`, `AuditLog`
- [x] Seed initial : rôles système (`OWNER`, `ADMIN`, `AGENT`), permissions par défaut, compte owner
- [x] Module Auth complet :
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `PATCH /api/auth/me`
  - `POST /api/auth/me/avatar`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/change-password`
- [x] JWT strategy + guard global + décorateur `@Public()`
- [x] Contrôle d’accès par permissions (`@RequirePermission`) + cache permissions + garde dédiée
- [x] Décorateur `@CurrentUser()` disponible et utilisé dans les handlers auth
- [x] Module Users : liste paginée, détail, création, modification, désactivation (soft delete), changement de rôle
- [x] Modules Roles/Permissions : CRUD rôles, attribution/retrait de permissions, gestion permissions custom
- [x] Middleware sécurité global : CORS, Helmet, cookies HTTP-only, throttling global + role-based rate limit, validation pipe stricte
- [x] Config centralisée : DB, JWT, MinIO (avatars + audit archives), SMTP, Redis, sécurité

**Frontend (réellement implémenté) :**
- [x] React + TypeScript + Vite + React Router + Tailwind + composants UI
- [x] Layout applicatif (`MainLayout`) avec navigation protégée
- [x] Pages Auth : login, mot de passe oublié, reset password, changement de mot de passe
- [x] `AuthContext` + client API axios (Bearer token + refresh cookie)
- [x] `ProtectedRoute` avec protection par niveau (`minLevel`) et routes admin dédiées
- [x] Dashboard opérationnel de base
- [x] Page profil (infos + sécurité) avec upload avatar
- [x] Pages administration : utilisateurs, rôles, audit

**Shared :**
- [x] Package partagé actif (`@sirap/shared`)
- [x] Types : `CNSSRecord`, `CNSSStats`, `AppRole`, DTOs auth (`LoginDto`, `RefreshTokenDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `ChangePasswordDto`, `UpdateProfileDto`)
- [x] Types communs pagination (`PaginationDto`, `PaginatedResult`)
- [x] Constantes : `ROLE_PRIORITY`, `BANKS`, `AMOUNT_RANGES` (+ constantes techniques existantes)
- [x] Utilitaires : `formatAmount`, `numberToFrenchWords`

**Validation (état actuel) :** Un owner peut se connecter, voir le dashboard et se déconnecter; un owner peut créer un utilisateur avec un rôle; la navigation est filtrée selon le niveau de rôle; les routes protégées redirigent vers `/auth` si non connecté; le refresh token fonctionne (session persistante), avec rotation et cookie HTTP-only.

---

### PHASE 2 — Import & Traitement (Semaines 3–4) 🟢

**Objectif :** Import Excel, parsing multi-onglets, détection doublons configurable.

**Backend :**
- [ ] Module Upload : endpoint multipart/form-data pour fichier Excel
- [ ] Service ExcelParser : SheetJS, mapping 10 colonnes, parsing netAPayer
- [ ] Module Duplicates : DuplicatesService avec algorithmes AND et OR
- [ ] Module Settings : CRUD table Setting (clé `duplicate_columns`, `duplicate_operator`)
- [ ] Schéma Prisma : modèle Setting → migration
- [ ] Tests unitaires : parsing montants (tous les cas), détection doublons AND/OR

**Frontend :**
- [ ] Page Upload : zone drag & drop, sélection fichier, progression, validation format
- [ ] Parsing client SheetJS (même logique que backend — choix hybride)
- [ ] Stockage sessionStorage : `cnssData` (JSON records), `cnssFileName`
- [ ] Redirection → /dashboard après parsing réussi
- [ ] Gestion erreurs : format invalide, fichier vide

**Validation :** Fichier Excel multi-onglets parsé correctement. Montants français parsés. Doublons AND et OR détectés. Config modifiable par admin.

---

### PHASE 3 — Dashboard & Analyse (Semaines 5–6) 🔵

**Objectif :** 11 KPI, 7 graphiques, module analyse avec filtres et pagination.

**Backend :**
- [ ] Module Dashboard : DashboardService → calcul 11 KPI
- [ ] Fonctions : calculateAmountOnePerGroup, calculateAmountWithoutDuplicates
- [ ] Agrégations : par banque, période, nature, tranche, type relation
- [ ] Endpoints export PDF et Excel
- [ ] Dashboard Admin : stats depuis table bordereaux

**Frontend :**
- [ ] Page Dashboard : 11 cartes KPI (formatage DJF avec séparateur milliers)
- [ ] 7 graphiques Recharts avec toggle bar/line
- [ ] Dashboard Admin (owner toggle / admin auto)
- [ ] Page Analyse : table complète avec toutes les colonnes
- [ ] Filtres : recherche texte, type relation, banque, doublons only
- [ ] 9 cartes statistiques de synthèse
- [ ] Pagination : 10/20/50/100, navigation précédent/suivant
- [ ] Export PDF (rapport analytique avec logo) et Excel (3 onglets)

**Validation :** 11 KPI corrects selon les formules. Écarts calculés. Graphiques interactifs. Filtres et pagination fonctionnels. Exports générés.

---

### PHASE 4 — Purification & Export (Semaines 7–8) 🟠

**Objectif :** Bordereau PDF officiel, Excel purifié, QR code, MinIO, anti-duplicata.

**Backend :**
- [ ] Module Bordereaux : BordereauxService + controller
- [ ] Schéma Prisma : modèle Bordereau complet → migration
- [ ] Config MinIO : connexion, création bucket `bordereaux`, upload/download
- [ ] Service PDF : jsPDF (logo, QR, en-tête officiel, tableau, montant en lettres)
- [ ] Service Excel : fichier Excel purifié
- [ ] Service QR Code : génération avec URL vérification
- [ ] Détection bordereau similaire (même banque/montant/count/24h)
- [ ] Gestion original vs duplicata (isOriginal, originalBordereauId)
- [ ] Incrémentation compteurs : download_count, email_count
- [ ] Génération ref journal : NUMyymmddxx

**Frontend :**
- [ ] Page Purifier : 9 métriques de purification
- [ ] Dialog sélection banque (5 banques hardcodées)
- [ ] Génération PDF client (format officiel complet)
- [ ] numberToFrenchWords (montant en lettres)
- [ ] Téléchargement PDF + Excel
- [ ] Export PDF des doublons (rapport séparé)
- [ ] Gestion duplicatas (avertissement utilisateur)

**Validation :** PDF respecte le format officiel. QR code fonctionne. Fichiers stockés dans MinIO. Duplicatas détectés. Montant = calculateAmountOnePerGroup.

---

### PHASE 5 — Communication & Historique (Semaines 9–10) 🟢

**Objectif :** Email SMTP, historique bordereaux, vérification publique QR.

**Backend :**
- [ ] Module Email : Nodemailer + config SMTP
- [ ] Template HTML email CNSS (en-tête, corps officiel, pièces jointes PDF+Excel)
- [ ] Table BankEmail : CRUD (admin)
- [ ] Module Historique : liste, détail, téléchargement
- [ ] Module Vérification : GET public `/verification/:hash` → infos bordereau
- [ ] Incrémentation auto download_count et email_count

**Frontend :**
- [ ] Dialog envoi email avec confirmation
- [ ] Page Historique : tableau avec colonnes (réf, banque, type badge, montant, enreg, downloads, emails, date, actions)
- [ ] Actions : télécharger PDF/Excel, vérifier
- [ ] Page Vérification (publique, pas de auth) : ✅ authentique ou ❌ non valide
- [ ] Affichage détails + liste complète bénéficiaires si valide

**Validation :** Email envoyé avec bonnes pièces jointes. Historique complet trié par date. Compteurs incrémentés. Page vérification accessible sans connexion. QR scanné = infos affichées.

---

### PHASE 6 — Administration (Semaine 11) 🔵

**Objectif :** Gestion utilisateurs avancée, rôles customs, permissions, audit.

**Backend :**
- [ ] Module Roles : CRUD CustomRole
- [ ] Module Permissions : CRUD Permission, attribution RolePermission
- [ ] Attribution UserCustomRole
- [ ] Module Audit : AuditService (log toutes les actions critiques)
- [ ] Module Settings complet : thème, doublons, emails banques

**Frontend :**
- [ ] Page Utilisateurs : liste, création (nom/email/password/rôle), modification rôles
- [ ] Page Rôles : gestion rôles customs + permissions
- [ ] Page Paramètres : config doublons (colonnes + opérateur), emails banques, thème
- [ ] Journal d'audit (optionnel V1)

**Validation :** Admin crée/modifie/supprime utilisateurs. Rôles customs fonctionnent. Paramètres doublons en base et appliqués globalement.

---

### PHASE 7 — Production & Docker (Semaines 11–12) 🔴

**Objectif :** Déploiement on-premise complet, sécurisé, documenté.

**Tâches :**
- [ ] Dockerfile backend : multi-stage build (builder → runner)
- [ ] Dockerfile frontend : Vite build → Nginx static
- [ ] docker-compose.yml : 5 services (postgres, minio, api, frontend, nginx)
- [ ] Nginx : reverse proxy, SSL (cert interne ou Let's Encrypt), headers sécurité
- [ ] .env.production : tous les secrets documentés
- [ ] Script backup.sh : pg_dump + minio mirror
- [ ] Script deploy.sh : build + up + migration
- [ ] Health checks : tous les services
- [ ] Logging : volumes Docker centralisés
- [ ] Documentation exploitation (installation, maintenance, restauration, mise à jour)

**Validation :** `docker compose up -d` lance tout. HTTPS fonctionne. Backups testés. Restauration documentée et testée.

---

## VARIABLES D'ENVIRONNEMENT

```env
# Base de données
DATABASE_URL=postgresql://cnss:password@postgres:5432/cnss_db

# JWT
JWT_SECRET=<secret-64-chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=cnss-admin
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=bordereaux
MINIO_USE_SSL=false

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@cnss.dj
SMTP_PASS=<secret>
SMTP_FROM=CNSS Djibouti <noreply@cnss.dj>

# Frontend
VITE_API_URL=http://localhost:3000/api

# App
APP_URL=https://cnss.dj
NODE_ENV=production
PORT=3000
```

---

## MATRICE DES DÉPENDANCES

| Phase | Dépend de | Bloque |
|-------|-----------|--------|
| 1 - Socle | Aucune | Phases 2–6 |
| 2 - Import | Phase 1 | Phases 3–5 |
| 3 - Dashboard | Phase 2 | Aucune |
| 4 - Purification | Phase 2 | Phase 5 |
| 5 - Communication | Phase 4 | Aucune |
| 6 - Administration | Phase 1 | Aucune |
| 7 - Docker | Phases 1–6 | Aucune |

> Les phases 3, 5 et 6 peuvent partiellement se chevaucher.

---

## COMMANDES UTILES

```bash
# Développement
npm run dev                    # Lance backend + frontend en parallèle
npm run dev:backend            # Backend seul (NestJS watch)
npm run dev:frontend           # Frontend seul (Vite dev)

# Base de données
npm run db:migrate             # Appliquer les migrations Prisma
npm run db:seed                # Peupler la base (owner initial)
npm run db:studio              # Ouvrir Prisma Studio (GUI)

# Docker
docker compose up -d           # Lancer tous les services
docker compose down            # Arrêter tous les services
docker compose build           # Rebuild les images
docker compose logs -f api     # Logs du backend

# Backup
./scripts/backup.sh            # Backup DB + MinIO
./scripts/deploy.sh            # Déploiement complet
```