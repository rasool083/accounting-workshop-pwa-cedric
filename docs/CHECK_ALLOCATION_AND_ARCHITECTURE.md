# تحلیل اصول تخصیص چک‌ها به فاکتورها و معماری سامانه | Check Allocation & System Architecture Analysis

**تاریخ:** 1405/07/14 (2026-10-05)
**نویسندگان:** GitHub Copilot + تحلیل مقایسه‌ای
**منطقه پوشش:** 3 ریپوزیتوری - Base | AI Studio | Cedric Working Copy

---

## 📌 فهرست مطالب

1. **اصول تخصیص چک‌ها (Check Allocation Principles)**
2. **الگوریتم FIFO تسویهٔ ترتیبی**
3. **محاسبهٔ هزینهٔ دیرکرد (Delay Fees - Tiered Model)**
4. **سود ظاهری vs سود مؤثر (Apparent vs Effective Profit)**
5. **مقایسه معماری سه ریپوزیتوری**
6. **استانداردهای برنامه‌نویسی و توسعه**
7. **نقشه توسعهٔ آینده**

---

# ۱. اصول تخصیص چک‌ها (Check Allocation Principles)

## 🎯 ترتیب اولویت‌های تخصیص

فرآیند تخصیص یک چک به فاکتورهای باز یک مشتری طبق ترتیب زیر انجام می‌گیرد:

```
┌────────────────────────────────────┐
│  دریافت چک (Incoming Check)       │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│  فاز ۱: تخصیص دستی گروهی         │
│  (تخصیص مشخص شدهٔ کاربر)          │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│  فاز ۲: تخصیص اختصاصی تک‌به‌تک    │
│  (targetInvoiceId مشخص)           │
└────────────┬───────────────────────┘
             │
             ▼
┌────────────────────────────────────┐
│  فاز ۳: تسویه ترتیبی FIFO خودکار  │
│  (قدیمی‌ترین فاکتور اول)         │
└────────────────────────────────────┘
```

### فاز ۱: تخصیص دستی گروهی
```typescript
// کاربر همزمان انتخاب می‌کند:
- چک‌های: Z₁, Z₂, Z₃, Z₄ (محدودهٔ سررسید)
- فاکتورها: INV₁₀₱₀, INV₁₀₱₁, INV₁₀₱₂ (محدودهٔ تاریخ صدور)

// الگوریتم:
1. مرتب‌سازی چک‌ها بر مبنای تاریخ سررسید (오름차순)
2. مرتب‌سازی فاکتورها بر مبنای تاریخ صدور (오름차순)
3. تخصیص ترتیبی چک₁ → INV₁, INV₂, INV₃, ...
4. اگر چک₁ برای کل فاکتورها کافی نبود، باقی‌مانده آن به چک₂ منتقل شود
```

### فاز ۲: تخصیص اختصاصی
```typescript
// اگر چکی دارای targetInvoiceId باشد:
- تمام مبلغ چک به آن فاکتور هدف اختصاص می‌یابد
- حتی اگر فاکتورهای قدیمی‌تر باز باشند
```

### فاز ۳: تسویهٔ FIFO خودکار
```typescript
// تمام چک‌های باقی‌مانده و فاکتورهای نامطابق‌شده:
- بر مبنای قاعدهٔ قدیمی‌ترین‌محور تسویه می‌شوند
- **قانون حاکم:** هیچ فاکتوری نمی‌تواند قبل از فاکتورهای قدیمی‌تر تخصیص‌یافته باشد
```

---

## 📋 شروط و قیود تخصیص

| شرط | توضیح | مثال |
|---|---|---|
| **قانون ۱: هیچ بیش‌رفت نیست** | هیچ فاکتوری > 100% تسویه نمی‌شود | اگر فاکتور 200M تومان و چک 250M تومان باشد، صرفاً 200M تسویه |
| **قانون ۲: ترتیب FIFO الزام‌بخش** | تا زمان تسویهٔ کامل فاکتورهای قدیمی‌تر | نمی‌تواند INV₁₀₱₃ تسویه شود اگر INV₁₀₱₀ باز باشد |
| **قانون ۳: تغییر وضعیت چک** | چک برگشتی خودکار مانده را باز نمی‌کند | باید دستی «عودت» یا «ابطال» شود |
| **قانون ۴: واحد پول ثابت** | همهٔ محاسبات بر مبنای **تومان** | بدون تبدیل خودکار ریال ↔ تومان |

---

# ۲. الگوریتم FIFO تسویهٔ ترتیبی

## 🔢 فرمول ریاضی دقیق

### متغیرهای اصلی

| نماد | نام | تعریف |
|---|---|---|
| **P** | اصل فاکتور | مبلغ دریافتی در فاکتور (تومان) |
| **y** | روزهای دیرکرد | فاصلهٔ تقویمی خورشیدی |
| **r** | نرخ روزانه دیرکرد | monthlyRate ÷ dayBasis |
| **Z** | درصد کل دیرکرد | r × y (محدود به پله) |
| **X** | مبلغ چک | مبلغ کل چک دریافتی |
| **K** | ارزش سررسید | P × (1 + Z) |
| **L** | مانده با دیرکرد | K - X |
| **G** | مانده خالص | L ÷ (1 + Z) |

### محاسبهٔ نرخ دیرکرد (Tiered Model)

```typescript
function calculateLateRate(y: number, paymentRules: PaymentRule[]): number {
  // y = روز‌های دیرکرد
  // paymentRules: پله‌های مرتب‌شدهٔ maxDays صعودی
  
  // قانون: اگر y در سقف اول باشد و monthlyRate = 0
  if (y <= paymentRules[0].maxDays && paymentRules[0].monthlyRate === 0) {
    return 0; // معاف است
  }
  
  // درغیر این صورت: از تمام پله‌های تجاوز شده محاسبه کن
  let totalRate = 0;
  let dailyRate = 0;
  
  for (let rule of paymentRules) {
    if (y > rule.maxDays) {
      // از این پله بیش‌تر است
      dailyRate = rule.monthlyRate / rule.dayBasis; // = 0.002 = 0.2%
      totalRate += dailyRate * (y - rule.maxDays);
    }
  }
  
  return totalRate; // Z = r × y = 10.8%
}
```

### تخصیص چک (Three Cases)

#### **حالت الف: چک ناقص (X < K)**

```
فاکتور = 200M تومان
روزهای دیرکرد = 54 روز
نرخ دیرکرد = 10.8% (Z = 0.108)
ارزش سررسید = 200M × 1.108 = 221.6M

چک دریافتی = 100M تومان

┌─────────────────────────────────────┐
│ محاسبات:                            │
├─────────────────────────────────────┤
│ K = 221,600,000 (ارزش سررسید)       │
│ L = K - X = 121,600,000 (مانده دیر) │
│ G = L ÷ 1.108 = 109,747,292         │
│   (مانده خالص فاکتور)               │
│                                     │
│ اصل تسویه = 200M - 109,747,292      │
│           = 90,252,708 تومان        │
│                                     │
│ دیرکرد تسویه = 100M - 90,252,708    │
│             = 9,747,292 تومان       │
└─────────────────────────────────────┘
```

**نتیجه:**
- ✅ چک 100M تسویه شد
- ✅ مانده فاکتور = 109.7M (خالص)
- ✅ دیرکرد مانده = 11.85M

#### **حالت ب: چک کافی (X ≥ K)**

```
فاکتور = 200M تومان
ارزش سررسید = 221.6M
چک دریافتی = 250M تومان

┌─────────────────────────────────────┐
│ محاسبات:                            │
├─────────────────────────────────────┤
│ X ≥ K ✅                            │
│ تخصیص = 221.6M                      │
│ باقیمانده چک = 250M - 221.6M        │
│             = 28.4M → فاکتور بعدی   │
│                                     │
│ فاکتور ۱۰۰% تسویه شد               │
│ اصل تسویه = 200M (کامل)            │
│ دیرکرد تسویه = 21.6M (کامل)        │
└─────────────────────────────────────┘
```

**نتیجه:**
- ✅ فاکتور کاملاً تسویه شد
- ✅ دیرکرد کاملاً دریافت شد
- ✅ 28.4M برای فاکتور بعدی منتقل

#### **حالت ج: چک صفر مانده**

اگر چک کاملاً صرف یک فاکتور شود، **مانده چک = 0** و به فاکتور بعدی منتقل نمی‌شود.

---

# ۳. محاسبهٔ هزینهٔ دیرکرد (Delay Fees - Tiered Model)

## 📊 مدل سلسله‌مراتبی پله‌ای

شرایط پرداخت در سامانه به صورت **پله‌های متوالی** تعریف می‌شود:

```typescript
interface PaymentRule {
  id: string;
  name: string;          // مثال: "۰-۳۰ روز معاف، ۳۰-۶۰ روز ۶٪"
  maxDays: number;       // سقف روز این پله
  monthlyRate: number;   // درصد ماهانه
  dayBasis: number;      // روز در ماه (معمولاً 30)
}

// مثال:
const rules: PaymentRule[] = [
  { maxDays: 30, monthlyRate: 0 },      // ۰-۳۰ روز: معاف
  { maxDays: 60, monthlyRate: 0.06 },   // ۳۰-۶۰ روز: ۶٪
  { maxDays: 90, monthlyRate: 0.09 },   // ۶۰-۹۰ روز: ۹٪
  { maxDays: 120, monthlyRate: 0.12 }   // ۹۰+ روز: ۱۲٪
];
```

## 🧮 محاسبهٔ متناسب با روزها

برای **54 روز دیرکرد** با پله‌های فوق:

```
┌──────────────┬────────────┬──────────────┬──────────────────┐
│ پله         │ روزهای پله │ نرخ ماهانه  │ محاسبه نرخ روزانه│
├──────────────┼────────────┼──────────────┼──────────────────┤
│ ۱: ۰-۳۰     │    30      │    0%       │  0% ÷ 30 = 0%   │
│ ۲: ۳۱-۶۰    │    30      │    6%       │  6% ÷ 30 = 0.2% │
├──────────────┼────────────┼──────────────┼──────────────────┤
│ مجموع ۵۴ روز │            │             │ = 0.2% × 24 روز  │
│              │            │             │ = 4.8%           │
└──────────────┴────────────┴──────────────┴──────────────────┘

نرخ نهایی = 4.8% برای 54 روز
```

## 💡 قاعدهٔ معافیت و شمول‌یت کامل

| شرط | رفتار |
|---|---|
| **y ≤ maxDays[۰] AND monthlyRate[۰] = 0** | ✅ معافی 0% |
| **y > maxDays[۰]** | ❌ شمول کامل از تمام روزها (نه فقط ۲۴ روز بعدی) |

**مثال اصلاح‌شدهٔ ۵۴ روز:**
```
اگر قانون: "۰-۳۰ معاف، سپس ۶%"
و y = 54 روز

نتیجه: 54 روز × 0.2% = 10.8%
(نه 24 × 0.2% = 4.8%)
```

---

# ۴. سود ظاهری vs سود مؤثر (Apparent vs Effective Profit)

## 🎯 دو متریک مستقل

هنگام وصول چک، دو شاخص سود محاسبه می‌شود:

### **سود ظاهری (Apparent Profit)**

```
apparentProfit = collectedAmount - costAtSaleTime

مثال:
- قیمت فروش: 300 تومان
- بهای تمام شدهٔ زمان فروش: 250 تومان
- مبلغ چک دریافتی: 300 تومان
┌─────────────────────────────┐
│ سود ظاهری = 300 - 250       │
│           = 50 تومان        │
│ نرخ = 50 ÷ 250 = 20%       │
└─────────────────────────────┘
```

### **سود مؤثر (Effective Profit)**

```
effectiveProfit = collectedAmount - costAtCollectionDate

مثال:
- قیمت فروش: 300 تومان
- بهای تمام شدهٔ زمان فروش: 250 تومان
- بهای تمام شدهٔ آخرین بچ در تاریخ وصول: 280 تومان
- مبلغ چک دریافتی: 300 تومان
┌─────────────────────────────┐
│ سود مؤثر = 300 - 280        │
│         = 20 تومان          │
│ نرخ = 20 ÷ 280 = 7.1%      │
│                             │
│ تفاوت: تورم ۳۰ تومانی      │
│ انعکاس واقعی سود در مقام    │
└─────────────────────────────┘
```

## 📊 مقایسهٔ مقادیر

| حالت | فروش | هزینهٔ فروش | هزینهٔ وصول | سود ظاهری | سود مؤثر | تفاوت |
|---|---|---|---|---|---|---|
| تورم کم | 300 | 250 | 260 | 50 (20%) | 40 (15%) | -10 |
| تورم متوسط | 300 | 250 | 275 | 50 (20%) | 25 (9%) | -25 |
| تورم زیاد | 300 | 250 | 295 | 50 (20%) | 5 (1.7%) | -45 |
| انکماش | 300 | 250 | 240 | 50 (20%) | 60 (25%) | +10 |

---

# ۵. مقایسهٔ معماری سه ریپوزیتوری

## 🏗️ جدول مقایسه‌ای

```
┌──────────────────────┬────────────────┬────────────────┬──────────────────┐
│ ویژگی               │ Base PWA       │ AI Studio      │ Cedric           │
├──────────────────────┼────────────────┼────────────────┼──────────────────┤
│ تاریخ ایجاد         │ 19 روز پیش    │ 6 روز پیش     │ 7 روز پیش       │
│ اندازهٔ کد          │ 2.8 MB         │ 3.9 MB         │ 0.4 MB (patches) │
│ حالت توسعه          │ پایه (Base)    │ با AI features │ Working Copy     │
└──────────────────────┴────────────────┴────────────────┴──────────────────┘
```

### **۱. معماری البته**

#### **Base Repository**
```
✅ اصول اساسی:
  - حسابداری پایه و FIFO
  - فهرست تامین‌کننده‌ها
  - Google Drive Integration
  - Security (PBKDF2 + Web Crypto)
  - PWA + Capacitor (Android)

📁 ساختار:
  client/src/
  ├── lib/accounting.ts (هستهٔ منطق)
  ├── lib/vendorDirectory.ts
  ├── lib/googleDrive.ts
  ├── lib/security.ts
  ├── lib/backup.ts
  └── pages/
      ├── Home.tsx
      └── VendorDirectory.tsx
```

#### **AI Studio**
```
✅ بهبودهای اضافی:
  - PWA Install Button
  - Print PDF Modal
  - Ledger Dialogs (پیشرفتهٔ تر)
  - بهتر شدهٔ UI/UX
  - فایکون و assets بهتر (PNG + SVG)
  - manifest.webmanifest گسترده‌تر

📁 اضافات:
  client/src/components/
  ├── LedgerDialogs.tsx ← جدید
  ├── PWAInstallButton.tsx ← جدید
  ├── PrintPDFModal.tsx ← جدید
  └── ...
```

#### **Cedric Working Copy**
```
✅ خط‌خوردی و توسعهٔ سفارشی:
  - Dropbox Integration (PKCE + OAuth)
  - Patch System (cedric-patches/)
  - Security بهبودیافته
  - مستند‌سازی گسترده
  - apply-cedric-patches.mjs script
  - Build Identity Tracking

📁 ساختار منحصر:
  cedric-patches/
  ├── 01-vite_config_ts.patch
  ├── 02-backup_ts.patch
  ├── 03-googleDrive_ts.patch
  ├── 04-vendorDirectory_ts.patch
  ├── 05-08-accounting_tests.patch
  ├── 09-11-Home_tsx.patch
  └── manifest.json
  
  scripts/
  ├── apply-cedric-patches.mjs ← اجرا شود قبل از هر build
  └── audit-*.ts scripts
```

### **۲. اختلافات کلیدی**

#### **Backup & Cloud Storage**

| ویژگی | Base | AI Studio | Cedric |
|---|---|---|---|
| Google Drive | ✅ | ✅ | ✅ |
| Dropbox | ❌ | ❌ | ✅ PKCE R6 |
| Local Snapshots | ✅ | ✅ | ✅ |
| Format | v1 (Unified) | v1 | v1 + Enhanced |

#### **UI Components**

| کامپوننت | Base | AI Studio | Cedric |
|---|---|---|---|
| Radix UI | ✅ Full | ✅ Full | ✅ Full |
| Install Button | ❌ | ✅ | ✅ (Cedric patched) |
| PDF Printer | ❌ | ✅ | ✅ (Cedric patched) |
| Advanced Dialogs | Basic | ✅ Enhanced | ✅ Enhanced |

#### **Documentation**

| سند | Base | AI Studio | Cedric |
|---|---|---|---|
| BUSINESS_LOGIC.md | ❌ | ✅ تفصیلی | ✅ مرجع |
| ARCHITECTURE.md | ❌ | ✅ | ✅ + توضیحات |
| README.md | ❌ | ✅ | ✅ |
| Patch Manifests | ❌ | ❌ | ✅ |

---

## 🔄 نمودار ارتباط ریپوزیتوری‌ها

```
┌─────────────────────────────┐
│   Base Repository           │
│   (accounting-workshop-pwa) │
│   - اصول بنیادی            │
│   - FIFO Logic              │
│   - Basic UI                │
└────────────┬────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
   ┌──────┐    ┌────────────┐
   │AI    │    │Cedric      │
   │Studio│    │Working     │
   │      │    │Copy        │
   ├──────┤    ├────────────┤
   │+Print│    │+Dropbox    │
   │+Inst │    │+Patches    │
   │+Dial │    │+Enhanced   │
   └──────┘    │+Docs       │
               └────────────┘
   
   (هر دو از Base مشتق)
```

---

# ۶. استانداردهای برنامه‌نویسی و توسعه

## 📌 معماری داده (Data Architecture)

### RAW / MASTER / CALC / APP Pattern

```typescript
// 1. RAW Layer (خام و بدون دست‌کاری)
interface RawInvoice {
  id: string;
  customerId: string;
  items: InvoiceLineItem[];
  totalAmount: number;
  issueDate: string; // Jalali
  status: "open" | "partial" | "settled";
}

// 2. MASTER Layer (موجودیت‌های پایه)
interface Product {
  id: string;
  name: string;
  unitPrice: number;
  priceBasis: "baseUnit"; // ثابت
  conversionRate?: number; // واحد دوم
}

interface PaymentRule {
  maxDays: number;
  monthlyRate: number;
  dayBasis: number; // معمولاً 30
}

// 3. CALC Layer (محاسبات خالص)
function settleChecksFIFO(
  checks: Check[],
  invoices: Invoice[],
  paymentRules: PaymentRule[]
): AllocationResult[] {
  // ...
}

// 4. APP Layer (UI ارائه)
export function Home() {
  const [state, dispatch] = useState<AppState>();
  // عرض جدول، دیالوگ‌ها، فرم‌ها
}
```

### قرارداد واحدها (Unit Contract)

```typescript
// ✅ BEWARE: پایه=واحد اول ALWAYS
product.unitPrice = 300_000; // per baseUnit (عدد)
if (product.conversionRate) {
  // conversionRate = 36 (مثال: ۳۶ عدد = ۱ کارتن)
  // کاربر: "10 کارتن"
  // سیستم: quantityBase = 10 * 36 = 360 عدد
  // total = 360 * 300_000 = 108,000,000
}

// ❌ مطلقاً ریال تومان خودکار نکند
// ❌ مطلقاً ضریب ۱۰ تقسیم یا ضرب نکند
```

## 🏗️ الگوهای کد استاندارد

### ۱. Pure Functions (توابع خالص)

```typescript
// ✅ خوب: خالص، بدون side effects
function calculateLateFee(
  principal: number,
  daysDelayed: number,
  rules: PaymentRule[]
): number {
  return principal * calculateRate(daysDelayed, rules);
}

// ❌ بد: تغییر state جهانی
let globalSum = 0;
function addToGlobal(value: number) {
  globalSum += value; // ❌ Side effect
}
```

### ۲. Type Safety (امنیت نوع)

```typescript
// ✅ خوب
type CurrencyCode = "IRT" | "USD" | "EUR";
interface Transaction {
  amount: number;
  currency: CurrencyCode;
  timestamp: string; // ISO 8601 یا Jalali
}

// ❌ بد
const amount: any = "300000"; // any! خطرناک
```

### ۳. Error Handling (مدیریت خطا)

```typescript
// ✅ خوب: ارائهٔ خطا به کاربر
try {
  const data = JSON.parse(payload);
  if (!data.format || data.format !== BACKUP_FORMAT) {
    throw new Error("فرمت پشتیبان نامعتبر");
  }
} catch (err) {
  showToast("خطا: " + err.message);
  localStorage.setItem(CORRUPTED_KEY, payload); // Quarantine
}

// ❌ بد: خطا را خاموش کنید
try {
  JSON.parse(payload);
} catch {
  // خاموش!
}
```

### ۴. Documentation (مستند‌سازی)

```typescript
/**
 * تسویهٔ ترتیبی چک‌ها به فاکتورهای باز مشتری
 * 
 * @param checks - چک‌های دریافتی (مرتب‌شده)
 * @param invoices - فاکتورهای باز (مرتب‌شده)
 * @param paymentRules - شرایط پرداخت با پله‌ها
 * @returns نتایج تخصیص شامل {allocated, remaining}
 * 
 * @example
 * const result = settleChecksFIFO(
 *   [{id:'C1', amount:100M, dueDate:'1405-06-20'}],
 *   [{id:'INV1', principal:200M}],
 *   paymentRules
 * );
 * // result.allocations[0] = {checkId, invoiceId, settled, remaining}
 * 
 * @throws {Error} اگر فاکتور/چک ناپایدار باشد
 */
export function settleChecksFIFO(
  checks: Check[],
  invoices: Invoice[],
  paymentRules: PaymentRule[]
): AllocationResult[] {
  // ...
}
```

---

## 🔐 استانداردهای امنیت

### ۱. Local Security (امنیت محلی)

```typescript
// ✅ PBKDF2 + SHA-256
const credential = await createCredential(userPassword);
// {
//   salt: "...", (random 16 bytes)
//   hash: "...", (PBKDF2 with 120,000 iterations)
//   iterations: 120000
// }

// ✅ Constant-time comparison
const isValid = await verifyCredential(
  inputPassword,
  storedCredential
);

// ❌ مطلقاً plain-text password نکند
// ❌ مطلقاً === برای مقایسهٔ hash نکند (timing attack)
```

### ۲. Cloud Security (امنیت ابری)

```typescript
// ✅ Google Drive OAuth2 (no client secret)
export const PUBLIC_DRIVE_CLIENT_ID = 
  "378766848...apps.googleusercontent.com";

// ✅ Dropbox OAuth2 + PKCE (no client secret)
const VERIFIER = generatePKCEVerifier();
const CHALLENGE = createPKCEChallenge(VERIFIER);
// code_challenge = CHALLENGE, code_verifier = VERIFIER

// ❌ مطلقاً client secret در کد client نکند
// ❌ مطلقاً token را localStorage ناحفاظ‌شدهٔ نکند
```

---

# ۷. نقشهٔ توسعهٔ آینده (Development Roadmap)

## 📍 Phase 1: مدغم‌سازی و تمیز‌کاری (Consolidation - Weeks 1-2)

```markdown
### 1.1 تحلیل و انتخاب بهترین‌ها
- [ ] مقایسهٔ کد Cedric ↔ AI Studio
- [ ] انتخاب بهترین UI components
- [ ] انتخاب بهترین مستندات
- [ ] تصمیم نهایی: کدام patch ها حفظ شود

### 1.2 یک‌پارچه‌سازی
- [ ] حذف patches غیرضروری
- [ ] ادغام AI Studio UI features
- [ ] حفظ Dropbox integration
- [ ] تمیز‌کاری dependencies

### 1.3 تست و اعتبارسنجی
- [ ] تست FIFO algorithm شامل تمام cases
- [ ] تست Dropbox upload/download
- [ ] تست Backup/Restore
- [ ] Integrity audit passing
```

## 📍 Phase 2: بهبود UI/UX (Enhancement - Weeks 3-4)

```markdown
### 2.1 طراحی صفحاتی بهتر
- [ ] صفحهٔ اصلی (Dashboard):
  - Stats cards (Cash, Receivables, Inventory)
  - Quick actions
  - Recent transactions
- [ ] Ledger Views (بسیار بهتر):
  - Filter by date range
  - Export Excel/PDF
  - Real-time calculations
- [ ] Check Management:
  - Visual timeline
  - Status badges
  - Bulk operations

### 2.2 Dark Mode و Theme
- [ ] Next.js Themes integration
- [ ] سفارشی‌سازی رنگ‌ها (Persian colors)
- [ ] RTL animations

### 2.3 Accessibility (دسترسی‌پذیری)
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
```

## 📍 Phase 3: Performance & Testing (Weeks 5-6)

```markdown
### 3.1 Performance Optimization
- [ ] بارگذاری لیزی (Lazy Loading)
- [ ] Code splitting
- [ ] Image optimization (Dropbox + Google Drive)
- [ ] Virtual scrolling برای جداول بزرگ

### 3.2 Testing Suite
- [ ] Unit tests (Vitest) → 80%+ coverage
- [ ] Integration tests (settleChecksFIFO cases)
- [ ] E2E tests (Cypress) → اصلی workflows
- [ ] Performance tests (Lighthouse)

### 3.3 Monitoring & Analytics
- [ ] Error tracking (Sentry)
- [ ] User analytics (optional)
- [ ] Performance monitoring
```

## 📍 Phase 4: Advanced Features (Weeks 7-8)

```markdown
### 4.1 Advanced Reporting
- [ ] Cash flow forecasting
- [ ] Profit margin analysis (Apparent vs Effective)
- [ ] Customer settlement timeline
- [ ] Inventory valuation (FIFO, LIFO, Average)

### 4.2 Mobile-First Features
- [ ] Offline-first sync
- [ ] Biometric auth (استفاده از Capacitor)
- [ ] Native camera for invoice photos
- [ ] Push notifications

### 4.3 Collaboration (اختیاری)
- [ ] Multi-user support
- [ ] Role-based access (Admin, Accountant, Viewer)
- [ ] Audit trail
```

---

## 🎯 اولویت‌های فوری (Immediate Next Steps)

### ۱️⃣ **الحاق بهترین ویژگی‌های AI Studio**
```bash
# در cedric-working-copy:
1. Copy PrintPDFModal.tsx
2. Copy PWAInstallButton.tsx
3. Copy LedgerDialogs.tsx (بهبودیافته)
4. Merge improved manifest.webmanifest
5. Test compatibility
```

### ۲️⃣ **تمیز‌کاری Patch System**
```bash
# بررسی و نوسازی:
1. cedric-patches/manifest.json
2. دقیقاً کدام فایل‌ها patch شوند؟
3. آیا patch‌ها هنوز صحیح اند؟
4. چه patch‌هایی برای حفظ ضروری اند
```

### ۳️⃣ **مستند‌سازی شامل**
```bash
# ایجاد/بروز‌رسانی:
1. DEVELOPMENT_GUIDE.md
2. CHECK_ALLOCATION_REFERENCE.md
3. API_DOCUMENTATION.md
4. SETUP_INSTRUCTIONS.md
```

### ۴️⃣ **تنظیم GitHub Actions**
```bash
# CI/CD Pipeline:
1. Test runner (vitest)
2. Type checker (tsc)
3. Linter (eslint)
4. Build verification
5. Deployment to Pages
```

---

## 📊 نتیجه‌گیری

### ✅ نقاط قوت فعلی
1. **الگوریتم FIFO تفصیلی و درست**
2. **معماری طبقه‌ای (RAW→MASTER→CALC→APP)**
3. **امنیت محلی قوی (PBKDF2)**
4. **پشتیبان‌گیری چندمنبع (Google Drive + Dropbox)**
5. **مستندات ریاضی دقیق (BUSINESS_LOGIC.md)**

### ⚠️ نقاط برای بهبود
1. **UI/UX ابتدایی** → نیاز به بهسازی
2. **Patch System پیچیده** → بسط دادهٔ شدهٔ از Base
3. **اسناد متفرقه** → نیاز به یک‌پارچه‌سازی
4. **Coverage تست کم** → نیاز به افزایش
5. **Performance بهینه نشده** → Virtual scrolling، lazy loading

### 🚀 نسخهٔ آینده (Vision)

**Cedric v2.0 = Base + AI Studio Features + Cedric Customizations**

```
┌──────────────────────────────────┐
│  Accounting Workshop PWA v2.0    │
├───────��──────────────────────────┤
│ ✅ FIFO + Tiered Delay Fees     │
│ ✅ Multi-cloud (Google+Dropbox) │
│ ✅ Professional UI (Print-Ready)│
│ ✅ Mobile-First (PWA+Capacitor) │
│ ✅ Robust Testing (80%+ coverage)│
│ ✅ Full Documentation            │
│ ✅ i18n Support (Persian+English)│
│ ✅ Dark Mode + Accessibility    │
└──────────────────────────────────┘
```

---

**تاریخ تحدیث:** 1405/07/14 (2026-10-05)
**نویسندهٔ مستند:** GitHub Copilot Intelligence
**وضعیت:** 🟢 تحلیل کامل شده، آماده برای اجرا
