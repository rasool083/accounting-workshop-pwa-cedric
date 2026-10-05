# تحلیل جامع پروژه | Comprehensive Project Analysis

## 📋 خلاصه اجمالی | Executive Summary

**تاریخ تحلیل:** 1405/07/14 (2026-10-05)
**محیط کار:** `rasool083/accounting-workshop-pwa-cedric` (Cedric Working Copy)
**ریپوزیتوری های مرجع:** 
- `rasool083/accounting-workshop-pwa` (اصلی | Base)
- `rasool083/accounting-workshop-pwa-aistudio` (AI Studio Version)

---

## 🏗️ معماری پروژه | Project Architecture

### 📁 ساختار دایرکتوری | Directory Structure

```
accounting-workshop-pwa-cedric/
├── client/                          # React PWA Frontend
│   ├── src/
│   │   ├── components/             # React UI Components (Radix UI + Shadcn)
│   │   ├── pages/                  # Main Pages (Home, VendorDirectory, NotFound)
│   │   ├── lib/                    # Business Logic & Utilities
│   │   │   ├── accounting.ts       # حسابداری - Accounting Core Logic
│   │   │   ├── vendorDirectory.ts  # Vendor Management System
│   │   │   ├── backup.ts           # Backup & Restore Utilities
│   │   │   ├── security.ts         # Encryption & Local Security
│   │   │   ├── googleDrive.ts      # Google Drive Integration
│   │   │   ├── dropbox.ts          # Dropbox Integration (CEDRIC R6)
│   │   │   ├── buildIdentity.ts    # Build & Version Tracking
│   │   │   └── *.test.ts           # Unit Tests
│   │   ├── hooks/                  # Custom React Hooks
│   │   ├── contexts/               # React Context (Theme)
│   │   └── main.tsx                # Entry Point
│   ├── public/                     # Static Assets & PWA
│   │   ├── manifest.webmanifest    # PWA Configuration
│   │   └── sw.js                   # Service Worker
│   └── index.html
├── server/                          # Express Backend
│   └── index.ts                    # Server Configuration
├── shared/                         # Shared Constants
│   └── const.ts                   # Cookie Names, Time Constants
├── android/                        # Capacitor Android Build
├── scripts/                        # Build & Patch Scripts
│   ├── apply-cedric-patches.mjs   # CEDRIC Custom Patches
│   └── audit-*.ts                 # Audit & Validation Scripts
├── cedric-patches/                # CEDRIC-Specific Modifications
│   ├── 01-vite_config_ts.patch
│   ├── 02-backup_ts.patch
│   ├── 03-googleDrive_ts.patch
│   ├── 04-vendorDirectory_ts.patch
│   ├── 05-08-accounting_tests.patch
│   ├── 09-11-Home_tsx.patch
│   └── manifest.json
├── patches/                       # Standard Patches
│   └── wouter@3.7.1.patch        # Routing Library Patch
├── docs/                         # Documentation
├── vite.config.ts               # Vite Configuration
├── package.json                 # Dependencies
└── capacitor.config.ts          # Capacitor Configuration
```

### 🔧 مشخصات فنی | Technical Specifications

**تکنولوژی اصلی:**
- **Frontend:** React 19.2.1 + TypeScript 5.6.3
- **UI Framework:** Shadcn UI (Radix UI Components)
- **Styling:** TailwindCSS 4.1.14
- **Build Tool:** Vite 7.1.7
- **Backend:** Express.js 4.21.2
- **Form Management:** React Hook Form 7.64.0 + Zod 4.1.12
- **State Management:** localStorage (Local-First Architecture)
- **Package Manager:** pnpm 10.15.1
- **Mobile:** Capacitor 8.5.2 (Android Support)
- **Testing:** Vitest 2.1.4

**Languages:**
- TypeScript: ~85%
- HTML/CSS: ~15%
- Persian (فارسی): RTL Support
- Solar Hijri Calendar: تقویم شمسی

---

## 📊 تحلیل مودول‌های کلیدی | Key Modules Analysis

### 1️⃣ حسابداری | Accounting Module (`client/src/lib/accounting.ts`)

**مسئولیت‌ها:**
- حفظ وضعیت حسابداری کل PWA
- محاسبات مالی (درآمد، هزینه، سود/زیان)
- رشته‌های چندجنسیتی
- معاملات و ثبت‌های تاریخی

**ویژگی‌های اصلی:**
```typescript
- AppState: ریشه حالت اپلیکیشن
- Transaction: معاملات (درآمد/هزینه)
- Account: حسابها
- Report: گزارش‌های مالی
- Currency Support: دسترسی‌پذیری چندجنسیتی
```

**توابع حیاتی:**
- `loadAccounting()` - بار‌گیری از localStorage
- `saveAccounting()` - ذخیره‌سازی
- `exportPayload()` - صادرات کاملاً مشخص‌شده
- `importPayload()` - درونریزی ایمن

---

### 2️⃣ فهرست تامین‌کننده‌ها | Vendor Directory (`client/src/lib/vendorDirectory.ts`)

**مسئولیت‌ها:**
- مدیریت تامین‌کننده‌ها و فروشندگان
- نگهداری قیمت‌های نقل‌شده
- تاریخ معتبر و وضعیت

**ساختار داده:**
```typescript
- Vendor: {id, name, kind, contactName, phone, email, location, ...}
- VendorQuote: {id, vendorId, materialName, price, currency, ...}
- VendorKind: "تولیدکننده" | "واردکننده" | "بازرگانی" | "نماینده" | "سایر"
- QuoteStatus: "معتبر" | "منقضی" | "بررسی نشده"
```

---

### 3️⃣ پشتیبان‌گیری و بازیابی | Backup & Recovery (`client/src/lib/backup.ts`)

**قالب‌های پشتیبانی:**
- **UNIFIED_BACKUP_FORMAT** (v1): دارای حسابداری + فهرست تامین‌کننده‌ها
- **تخمین‌های بازیابی محلی:** localStorage snapshot trail
- **انتقال‌های امن:** checksum بررسی

**مواردی که حفاظت می‌شوند:**
```typescript
- Accounting State
- Vendor Directory
- Metadata: {backupId, createdAt, currency, checksums}
- Counts: تعداد ثبت‌ها
```

---

### 4️⃣ امنیت و رمزنگاری | Security & Encryption (`client/src/lib/security.ts`)

**ویژگی‌های حفاظتی:**
- **PBKDF2 Key Derivation:** 120,000 iterations
- **SHA-256 Hashing:** Web Crypto API
- **رمز عبور:** حداقل 8 کاراکتر
- **PIN:** 4-8 رقمی

**توابع:**
```typescript
- createCredential(value: string) → StoredCredential
- verifyCredential(value: string, credential) → boolean
- hasLocalCredential(settings) → boolean
- validatePassword/validatePin()
```

---

### 5️⃣ Google Drive Integration (`client/src/lib/googleDrive.ts`)

**ویژگی‌های OAuth2:**
- **Client ID:** عام (بدون Secret)
- **Scope:** `drive.file`
- **پوشه مخصص:** `PROJECT_BACKUPS_FOLDER_ID`

**توابع:**
```typescript
- listBackups() → DriveBackupFile[]
- uploadBackup(filename, payload)
- downloadBackup(fileId)
```

---

### 6️⃣ Dropbox Integration (CEDRIC R6) (`client/src/lib/dropbox.ts`)

**ویژگی‌های OAuth2 + PKCE:**
- **بدون Client Secret** (PKCE امن)
- **Offline Token:** بازتازی خودکار
- **Folder Structure:** `/Apps/[app-name]/backups/[year]/[MM-month]/`
- **تاریخ تقویم شمسی** (Solar Hijri)

**توابع:**
```typescript
- persianYearMonth(date) → {year, month}
- dropboxBackupFolder(filename, now?)
- dropboxApiArg(value) → escaped header
```

---

## 🔄 جریان کاری اصلی | Primary Workflows

### 1️⃣ ورود و تصدیق | Login & Authentication

```
┌─────────────────────────────────────────┐
│ User Opens PWA (client/src/main.tsx)    │
├─────────────────────────────────────────┤
│ Check OAuth Callback (server/index.ts)  │
├─────────────────────────────────────────┤
│ Load Accounting + Vendor Directory      │
│ from localStorage                       │
├─────────────────────────────────────────┤
│ Check Local Credential (Security)       │
│ (Password/PIN if enabled)               │
├─────────────────────────────────────────┤
│ Render Home Page (client/src/pages)     │
└─────────────────────────────────────────┘
```

### 2️⃣ صادرات پشتیبان‌گیری | Backup Export

```
┌──────────────────────────────────────────┐
│ User Triggers Export                     │
├──────────────────────────────────────────┤
│ Create UnifiedBackupEnvelope             │
│ ├─ Accounting Payload                    │
│ ├─ Vendor Directory Payload              │
│ ├─ Checksums (FNV-1a Hash)              │
│ └─ Metadata (ID, Timestamp, Currency)    │
├──────────────────────────────────────────┤
│ Save to Google Drive OR Dropbox          │
│ (selectByBackupTarget)                   │
├──────────────────────────────────────────┤
│ Store Local Restore Snapshot             │
│ (localStorage Trail)                     │
└──────────────────────────────────────────┘
```

### 3️⃣ درونریزی پشتیبا��‌گیری | Backup Import

```
┌──────────────────────────────────────────┐
│ User Selects Backup File                 │
├──────────────────────────────────────────┤
│ Download & Parse JSON                    │
├──────────────────────────────────────────┤
│ Verify Checksums                         │
├──────────────────────────────────────────┤
│ Merge or Replace State:                  │
│ ├─ Accounting Data                       │
│ └─ Vendor Directory Data                 │
├──────────────────────────────────────────┤
│ Save to localStorage                     │
├──────────────────────────────────────────┤
│ Reload Application State                 │
└──────────────────────────────────────────┘
```

---

## 🔍 تفاوت‌های نسخه‌های مختلف | Version Differences

### **Base** (`accounting-workshop-pwa`)
- ✅ حسابداری پایه
- ✅ فهرست تامین‌کننده‌ها
- ✅ Google Drive Backup
- ✅ UI Components

### **AI Studio** (`accounting-workshop-pwa-aistudio`)
- ✅ همه ویژگی‌های Base
- ✅ (احتمالی) مدل‌های AI برای پیش‌بینی
- ✅ (احتمالی) خودکارسازی

### **Cedric Working Copy** (`accounting-workshop-pwa-cedric`)
- ✅ همه ویژگی‌های Base
- ✅ **Dropbox Integration (R6)** ← نوظهور
- ✅ **بهبودهای Security**
- ✅ **تعمیمات Vendor Directory**
- ✅ **Patch System** (`cedric-patches/`)
- ✅ **مستند‌سازی گسترده‌تر**

---

## 📝 فایل‌های مستند‌سازی موجود | Existing Documentation

### در دایرکتوری `docs/`:
1. **PROJECT-REFERENCE.md** - راهنمای پروژه
2. **CEDRIC-HANDOFF.md** - تحویل CEDRIC
3. **CHANGELOG.md** - تاریخچه تغییرات
4. **CHAT-CONTINUITY-PROTOCOL.md** - پروتکل ادامه‌ی گفتگو
5. **VENDOR-DIRECTORY-DESIGN.md** - طراحی فهرست تامین‌کننده‌ها
6. **DEEP-AUDIT-*.md** - ��ررسی‌های عمیق
7. **APK-AND-CUSTOMER-APP-ARCHITECTURE.md** - معماری APK
8. **EMERGENCY-RECOVERY.md** - بازیابی اضطراری
9. و بیش از 20 سند دیگر...

---

## 🎯 نقاط قوت کنونی | Current Strengths

1. ✅ **معماری Local-First:** داده‌ها محلی ذخیره می‌شوند
2. ✅ **پشتیبان‌گیری چند‌منصبی:** Google Drive + Dropbox
3. ✅ **RTL Support:** پشتیبانی کامل فارسی
4. ✅ **امنیت رمزنگاری:** PBKDF2 + Web Crypto API
5. ✅ **PWA Ready:** Service Worker + manifest
6. ✅ **تست‌شده:** Vitest + واحد تست‌ها
7. ✅ **Patch System:** مدیریت سفارشی‌سازی‌ها
8. ✅ **مستند‌سازی:** سندهای تفصیلی

---

## ⚠️ نقاط قابل بهبود | Areas for Improvement

1. ⚠️ **ظاهر UI:** طراحی می‌تواند بصری‌تر و جذاب‌تر شود
2. ⚠️ **تجربه کاربر:** برخی جریان‌های کاری پیچیده‌اند
3. ⚠️ **Performance:** بهینه‌سازی بار‌گیری‌ها
4. ⚠️ **Error Handling:** بهبود پیام‌های خطا
5. ⚠️ **Accessibility:** بهتری‌ دسترسی‌پذیری
6. ⚠️ **Testing Coverage:** افزایش پوشش تست‌ها

---

## 📋 وظایف بعدی | Next Steps

### Phase 1: بررسی عمیق | Deep Review
- [ ] تحلیل کامل فایل‌های `client/src/` خط به خط
- [ ] بررسی تفاوت‌های AI Studio version
- [ ] فهم نسخه‌ای شدن‌های موجود

### Phase 2: مقایسه | Comparison
- [ ] مقایسه تفاوت‌های Cedric vs Base vs AI Studio
- [ ] شناسایی ویژگی‌های جدید
- [ ] تحلیل بهبودهای Cedric

### Phase 3: بهبود | Enhancement
- [ ] بهبود UI/UX
- [ ] افزایش پوشش تست‌ها
- [ ] بهینه‌سازی performance
- [ ] بهتری‌ مستند‌سازی

---

## 🔗 منابع مهم | Important Resources

- **Google Drive Folder:** `1Qrql348yLKgkKNEzRDYUwLAa1ylbEx8h`
- **Backups Folder:** `12qwZHYKcI7Zsg-m5gYOCCkzQc8Ynpthx`
- **Last Verified Backup:** `backup-1405-06-26`
- **OAuth Portal:** Environment Variable: `VITE_OAUTH_PORTAL_URL`

---

**نوشتار:** GitHub Copilot
**تاریخ:** 1405/07/14 (2026-10-05)
**وضعیت:** 🟢 تحلیل شروع شده
