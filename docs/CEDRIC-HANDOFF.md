# CEDRIC HANDOFF: accounting-workshop-pwa-cedric

Last updated: 2026-09-27 (1405-07-05), code revision **r5** (not yet in the repo). Author: Cedric (AI teammate) for Rasool Ghoddoosi.
Purpose: anyone (AI or person) can continue from exactly this point.

## 1. Repositories and rules
- Original: `rasool083/accounting-workshop-pwa`, READ-ONLY, never modify. Stays installed in Chrome.
- Working copy: `rasool083/accounting-workshop-pwa-cedric`, all work here. Starts from "Initial commit" 89eb14c (tree identical to original main b518fd3). No history (created from a temporary template flag on the original, flag removed after ~6 s).
- Goal: a second, independent install (another browser) with its own storage, cache and backups.
- Owner granted permission (2026-09-27) for Cedric to upload/commit and to enable Pages.
- At the end of every session, update this file.

## 2. Connection limits (why code is uploaded by hand)
- Cedric's GitHub connection cannot send `client/src/pages/Home.tsx` (~435 KB) or `client/src/lib/accounting.ts` (~118 KB) through the API.
- A helper workflow that applies the files was refused: the connection has no `workflow` scope.
- So code revisions are delivered as a zip of changed files with repo paths. Owner: unzip, then drag `client/`, `docs/` and `vite.config.ts` into GitHub "Add file > Upload files". Do NOT upload the zip itself (GitHub does not extract it).
- Small files (like this doc) Cedric commits directly.

## 3. GitHub Pages
- Already enabled, source = GitHub Actions. URL: https://rasool083.github.io/accounting-workshop-pwa-cedric/
- Until r5 is uploaded, the site runs the initial code whose storage keys equal the Chrome install. Do not enter data there before r5.
- After the upload commit, the Pages workflow deploys automatically.

## 4. Owner decisions (binding)
- Negative raw-material stock during production is INTENDED. Do not block it.
- A check's invoice allocation changes ONLY when the check is voided (باطل), replaced (جایگزین) or returned-to-owner (عودت). Bounced (برگشتی) and spent (خرج‌شده) checks keep their allocation.
- Therefore "partner bounced check" and "supplier balance with bounced checks" are NOT bugs.
- Collection delay (دیرکرد وصول) is informational only: days from due date to collectedDate (or today if not collected). No cost.
- Sub-assembly (بسته) price comes from its own formula at latest prices with unit conversion, not the price list.
- Batch price update: user enters a quantity; that quantity gets a new price row at latest prices, rest keeps old price; batch actual consumption (waste, actual weight) preserved; each invoice's profit uses the price row valid on the invoice date.
- Backups: new names `cedric-backup-*`; old `backup-*` files still restore (internal format unchanged).
- Storage: Dropbox instead of Google Drive (one authorization, refresh token, no repeated consent). Drive kept for restoring old backups only.
- Landscape print must work in Chrome, Edge and Firefox.

## 5. Bugs, root causes, fixes (all in r5)
| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| 1 | Sub-assembly cost 0 in parent | parent read price list | `accounting.ts`: cost from same production run > estimate from sub-assembly formula (latest prices, unit conversion, recursive) > last production cost > price list. Same in formula form (`Home.tsx` ~9047). |
| 2 | Nested production reversal wrong | reversed in production order | reverse in reverse order (child first, then parent). |
| 3 | Actual-weight ratio wrong for multi-piece formulas | piece weight compared to whole-batch weight | per-piece reference weight, else formula weight / pieces. |
| 4 | Bounced/spent checks released invoice allocation | FIFO exclusion list contained them | FIFO excludes only void/replaced/returned (`accounting.ts` ~2129). |
| 5 | Person statement: returned check debit-only, replaced check credited twice | statement lines (`Home.tsx` ~8242) | returned and replaced removed from statement; bounced stays credited until void/replaced. |
| 6 | Backup numbering duplicates | only knew `backup-` (`Home.tsx` ~257) | recognizes `cedric-backup-` and `backup-`. |
| 7 | sw.js deleted all same-origin caches incl. original app's | broad cleanup | deletes only its own `accounting-workshop-pwa-cedric` caches. |
| 8 | Landscape print Chrome-only | `@page` rule; print styles removed 1.5 s after click | explicit landscape A4 at print time; cleanup on `afterprint`. |

## 6. Features added (r5)
- Separate install: storage keys (7 places), `vite.config.ts` base `/accounting-workshop-pwa-cedric/`, manifest name, short name "حسابداری کارگاه Cedric", cache name.
- Batch "بروزرسانی قیمت" button next to "ویرایش این بچ": shows current/new unit cost, asks quantity, stores price rows (date, qty, unit cost) on the production record; rows shown under the batch; batch edit preserves rows; invoice registration and profit report (`accounting.ts` ~2314) use the row valid on invoice date.
- Invoice print: under each allocated check, days and collection delay (informational). Profit and late fee stay hidden in customer print.

## 7. Changed files (vs 89eb14c)
client/public/manifest.webmanifest, client/public/sw.js, client/src/lib/accounting.ts, accounting.test.ts, backup.ts, buildIdentity.ts, googleDrive.ts, pwa.test.ts, vendorDirectory.ts, client/src/pages/Home.tsx, vite.config.ts, docs/CEDRIC-HANDOFF.md.
Delivered as `cedric-upload-r5.zip` (12 files, repo paths).

## 8. Verification (r5)
- Unit tests: 92/92 pass (10 files). New: bounced keeps allocation; void/replaced/returned release it; sub-assembly price from formula = 20 (not 0); parent formula = 50 per piece; batch price row chosen by invoice date. 3 tests updated to intended behavior (spent check, short name, cache name + never delete original cache).
- r4: `tsc --noEmit` clean; 6 project scripts pass (FIFO, audit-harness, risk-probes, price-unit-fixture, Jalali calendar, currency-dry-run). r5 changed tests and name strings only; re-run tsc before release.
- NOT yet run: full `pnpm build`. The Pages workflow will run it after upload; check the Actions tab.

## 9. Operating method
- Work on a sandbox copy (tgz revisions r1..r5); original repo never touched.
- Tests: vitest with minimal config (aliases `@` -> client/src, `@shared` -> shared, include `client/src/lib/**/*.test.ts`). `vite.config.ts` needs git for the version, so `git init` + commit before using the real config.
- `npm install --legacy-peer-deps` or pnpm (lockfile is pnpm). Run tests, tsc and build as separate steps (together they time out).

## 10. Dropbox plan (r6, in progress)
- New `client/src/lib/dropbox.ts`: OAuth 2 PKCE in the browser (no secret), `token_access_type=offline` for a refresh token, stored under a cedric storage key; auto refresh on 401.
- Owner creates one Dropbox app (App Console, scoped, App folder, permissions files.content.write/read, redirect URI = Pages URL) and pastes the App key into the backup page.
- Upload `cedric-backup-N.json` to the app folder, list, download for restore; numbering shared with Drive logic.
- Backup page: Dropbox is the default target; Drive remains for restoring old backups.

## 11. Remaining known issues (not fixed yet)
- Payment-rule dayBasis ignored (`accounting.ts` ~2822-2845).
- Tier rate applied flat to all overdue days (needs owner decision).
- Dashboard balance ignores cash events.
- Month close (`Home.tsx`): no lock, cards 8 months vs CSV all, month key slice(0,7) (~7611), duplicate closes, CSV not escaped.
- Cash sync: date-only change not propagated; item/qty change not detected.
- Delete All deletes before download is confirmed.
- Drive folder IDs hardcoded (`googleDrive.ts` 27-34).
- Raw English error on corrupt backup; state saved twice per input.

## 12. Next steps
1. Owner uploads r5 (see section 2). Check the Actions tab: build + Pages deploy must be green.
2. Open the site in the second browser; test sub-assembly production, nested reversal, bounced check, batch price update, landscape print (Firefox/Edge), backup/restore.
3. Cedric delivers r6 (Dropbox) as a zip; owner creates the Dropbox app and enters the App key.
4. Then work through section 11 with owner decisions.

## 13. Session log
- 2026-09-27: repo copy created; review; r1-r5 fixes and tests (92/92); Pages confirmed on; direct code commit blocked by connection limits (section 2); this doc committed directly.
