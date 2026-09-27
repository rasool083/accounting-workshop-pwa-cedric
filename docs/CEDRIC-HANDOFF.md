# CEDRIC HANDOFF: accounting-workshop-pwa-cedric

Last updated: 2026-09-28 (1405-07-06), code revision **r6.1**, committed to `main` by Cedric (AI teammate) for Rasool Ghoddoosi.
Purpose: anyone (AI or person) can continue from exactly this point.

## 1. Repositories and rules
- Original: `rasool083/accounting-workshop-pwa`, READ-ONLY, never modify. Stays installed in Chrome.
- Working copy: `rasool083/accounting-workshop-pwa-cedric`. ALL code and docs changes go here. Owner granted Cedric standing permission to commit here (2026-09-27, repeated 2026-09-28).
- History: `89eb14c` Initial commit (tree identical to original main `b518fd3`) > `9a534f7` handoff doc r5 > `4c7da92` r6 > r6.1 (Dropbox error messages + scopes, this doc).
- Goal: a second, independent install (another browser) with its own storage keys, cache and backups.
- At the end of every session, update this file.

## 2. How code is committed (patch method)
- Cedric's GitHub connection cannot send `client/src/pages/Home.tsx` (~435 KB) or `client/src/lib/accounting.ts` (~118 KB) whole, and has no `workflow` scope.
- So large-file changes live as small unified diffs in `cedric-patches/` (each < 6 KB), applied at build time by `scripts/apply-cedric-patches.mjs`.
- `cedric-patches/manifest.json` lists, per target file, the git hash BEFORE and AFTER all its patches. The script: hash == after -> skip (already patched); hash == before -> apply patches, then verify the after-hash; anything else -> exit 1 and stop the build (no half-patched deploy).
- `package.json` runs the script before `dev`, `build`, `check` and `test`. Running it twice changes nothing (verified).
- Small/new files (dropbox.ts, sw.js, manifest, tests, docs) are committed as whole files and are NOT in the manifest, so they can be edited directly.
- To edit a patched file later: run `node scripts/apply-cedric-patches.mjs` locally, edit, then EITHER commit the full file (and delete its patches + manifest entry) OR regenerate the patch and the after-hash.
- Commits are made with the Git Data API (blobs > tree > commit > ref); every blob sha is compared with the sandbox-tested file before the commit.

## 3. GitHub Pages
- Enabled, source = GitHub Actions. URL: https://rasool083.github.io/accounting-workshop-pwa-cedric/
- White page root cause (before r6): `vite.config.ts` base was `/accounting-workshop-pwa/` (the original repo path), so JS/CSS 404ed on the -cedric site. Fixed in patch 01 (base `/accounting-workshop-pwa-cedric/`).
- r6 deploy (run 36348033532, commit 4c7da92) finished **success**: patches applied and `vite build` passed in CI. The owner then used the site and connected Dropbox, so the white page is fixed.
- Both sites share the origin `rasool083.github.io`, so r6 also uses separate storage keys, service-worker cache name and manifest id/scope (buildIdentity.ts, sw.js, manifest.webmanifest). Never ship the base fix alone: old code would read/write the Chrome install's data.

## 4. Owner decisions (binding)
- Negative raw-material stock during production is INTENDED. Do not block it.
- A check's invoice allocation changes ONLY when the check is voided (باطل), replaced (جایگزین) or returned-to-owner (عودت). Bounced (برگشتی) and spent (خرج‌شده) checks keep their allocation. So "partner bounced check" and "supplier balance with bounced checks" are NOT bugs.
- Collection delay (دیرکرد وصول) is informational only: days from due date to collectedDate (or today). No cost.
- Sub-assembly (بسته) price comes from its own formula at latest prices with unit conversion, not the price list.
- Batch price update: user enters a quantity; that quantity gets a new price row at latest prices, rest keeps old price; batch actual consumption (waste, actual weight) preserved; each invoice's profit uses the price row valid on the invoice date.
- Backups: new names `cedric-backup-*`; old `backup-*` files still restore (format unchanged).
- Storage: Dropbox instead of Google Drive (one authorization, refresh token). Drive kept for restoring old backups only.
- Landscape print must work in Chrome, Edge and Firefox.

## 5. Bugs, root causes, fixes (r5 + r6 + r6.1)
| # | Bug | Root cause | Fix |
|---|-----|-----------|-----|
| 1 | Sub-assembly cost 0 in parent | parent read price list | cost from same production run > sub-assembly formula (latest prices, unit conversion, recursive) > last production cost > price list (accounting.ts, patches 06-07; formula form in Home.tsx) |
| 2 | Nested production reversal wrong | reversed in production order | reverse child first, then parent |
| 3 | Actual-weight ratio wrong for multi-piece formulas | piece weight vs whole-batch weight | per-piece reference weight, else formula weight / pieces |
| 4 | Bounced/spent checks released invoice allocation | FIFO exclusion list contained them | FIFO excludes only void/replaced/returned |
| 5 | Person statement: returned check shown debit-only | missing reversing row | statement fix (patch 10) |
| 6 | White Pages site | wrong vite base | patch 01 |
| 7 | Landscape print broken outside Chrome | print CSS | fixed (patch 08) |
| 8 | Dropbox connected but "ذخیره در Dropbox" and "تازه‌سازی فهرست" both show "خواندن فهرست Dropbox ناموفق بود", no backup created (2026-09-28) | Sign-in works, but `files/list_folder` is refused. Save lists the folder first (for numbering), so both buttons fail at the same call. Most likely cause: the Dropbox app's Permissions tab lacks `files.metadata.read` (and write/read content) or they were enabled AFTER connecting; a token keeps the scopes it was issued with. Old `apiError` hid Dropbox's reason behind the generic text. | r6.1: `dropboxErrorMessage()` shows a clear Persian instruction for missing scope, and status + Dropbox's text for any other failure; sign-in now requests `DROPBOX_SCOPES` explicitly, so a missing permission is reported on Dropbox's consent page. Owner action: see section 7. |
| - | Batch price update, invoice price by date, collection delay display | new features per decisions | patches 09-10 |
| - | Dropbox backup | new | dropbox.ts + backup page card (patch 11), OAuth PKCE, no client secret |

Still open from the first review (not yet fixed): payment-rule dayBasis ignored; tier rate applied flat (needs owner decision); dashboard balance ignores cash events; month close (no lock, 8-month cards vs full CSV, duplicate closes, CSV escaping); cash sync misses date-only / item / qty changes; Delete All before download confirmed; Drive folder IDs hardcoded (googleDrive.ts); raw English error on corrupt backup; state saved twice per input.

## 6. Tests
- r6 sandbox run: 95/95 tests passed in 11 files (vitest), including dropbox.test.ts (PKCE, redirect URI on Pages, backup list filter/sort) and pwa.test.ts.
- r6 CI: `vite build` passed (Pages deploy success). Full `tsc` type check has not been run in CI (the workflow only builds).
- r6.1 adds one test (dropboxErrorMessage: missing scope as 400 text and 401 JSON, expired token, not_found, generic with status). Logic checked with node in the sandbox; full vitest not re-run for r6.1.

## 7. Dropbox setup (owner, one time)
1. Dropbox App Console > Create app > Scoped access > App folder.
2. Settings > OAuth 2 > Redirect URIs: `https://rasool083.github.io/accounting-workshop-pwa-cedric/` (exactly, with the trailing slash).
3. Permissions tab: tick `files.metadata.read`, `files.content.read`, `files.content.write` and press **Submit**. Do this BEFORE connecting; if changed later, reconnect.
4. Copy the App key (Settings tab) into the Dropbox card on the app's backup page and press connect; approve once on Dropbox.
5. If a Dropbox error appears after r6.1: press "قطع اتصال", then connect again, and read the new message (it now includes Dropbox's own reason and code).
6. Backups land in `/Apps/<app name>/` in the owner's Dropbox, named `cedric-backup-*.json`.

## 8. Next steps
1. Owner: after the r6.1 deploy, check Permissions (section 7 step 3), disconnect, reconnect, then press "ذخیره در Dropbox". If it still fails, send Cedric the exact new message.
2. Confirm a real backup appears in Dropbox and restores in the -cedric site.
3. Then fix the remaining open bugs (section 5), starting with Delete All before download confirmed (data-loss risk).
4. Add a `tsc --noEmit` step to CI when a token with `workflow` scope is available (owner edits the workflow file).
