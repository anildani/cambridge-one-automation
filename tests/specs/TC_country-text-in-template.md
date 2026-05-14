# TC: Country Text in Spreadsheet Template — Bulk Institution Requests

> **GitHub Issue:** [#1 — [BUG] Country text appears in downloaded spreadsheet template](https://github.com/anildani/cambridge-one-automation/issues/1)
> **Status:** OPEN | **Filed:** 2026-05-14 | **Assigned:** @anildani | **CC:** @ankurcompro

---

## Story
Country text should **NOT** appear in the downloaded spreadsheet template for Bulk Institution Requests.

---

## Environments

| Environment | Base URL | Last Run | Result |
|-------------|----------|----------|--------|
| micro-nemo  | https://micro-nemo.comprodls.com/ | 2026-05-14 | ❌ FAIL |
| Higher env  | _TBD — update when available_ | — | Not tested |

---

## Pre-requisites
- A Support Admin account is available and active
- Access to `/support-admin/tools/dashboard`

---

## Test Credentials

| Field | Value |
|-------|-------|
| Role | Support Admin |
| Username | `adani@cambridge.org` |
| Password | `Compro11` |

> ⚠️ Update credentials per environment before running.

---

## Test Cases

### TC001 — Navigate to Login Page
| | |
|---|---|
| **Steps** | Open `<BASE_URL>/login` |
| **Expected** | Login page loads with Username and Password fields visible |
| **Last Result** | ✅ PASS |

---

### TC002 — Login as Support Admin
| | |
|---|---|
| **Steps** | 1. Enter username `adani@cambridge.org` <br> 2. Enter password `Compro11` <br> 3. Click **"Log in"** |
| **Expected** | Authenticated and redirected to `/support-admin/dashboard` |
| **Last Result** | ✅ PASS |

> **Note:** Credential typo was found in original story — domain is `cambridge.org` not `campbridge.org`.

---

### TC003 — Navigate to Tools Dashboard
| | |
|---|---|
| **Steps** | Navigate to `<BASE_URL>/support-admin/tools/dashboard` |
| **Expected** | Tools dashboard loads; **"Bulk Institution Requests"** tile with **"Create Institution Requests"** button is visible |
| **Last Result** | ✅ PASS |

---

### TC004 — Click "Create Institution Requests" Button
| | |
|---|---|
| **Steps** | Click the **"Create Institution Requests"** button on the Tools Dashboard |
| **Expected** | Navigated to `/support-admin/tools/bulk-institution-requests-form` with step-by-step instructions and a **"spreadsheet template"** link |
| **Last Result** | ✅ PASS |

---

### TC005 — Download Spreadsheet Template
| | |
|---|---|
| **Steps** | Click the **"spreadsheet template"** hyperlink in Step 2 of the instructions |
| **Expected** | File `bulk-institution-requests-template.xlsx` is downloaded successfully |
| **Last Result** | ✅ PASS |

---

### TC006 — Verify "Country" Text Absent in Template ⚠️ KEY CHECK
| | |
|---|---|
| **Steps** | 1. Open downloaded `bulk-institution-requests-template.xlsx` <br> 2. Inspect all column headers in Row 1 <br> 3. Search for word **"country"** (case-insensitive) across all cells |
| **Expected** | The word **"country"** does NOT appear in any column header or cell |
| **Last Result** | ❌ **FAIL** |

**Defect found — columns containing "country":**

| Column | Header Text | Action Needed |
|--------|-------------|---------------|
| **E** | `Country` | Remove or rename |
| **L** | `Telephone Number Country Code` | Rename to remove "Country" |

---

## Full Column Headers (as of last run — 2026-05-14)

| Col | Header | Status |
|-----|--------|--------|
| A | School Name | ✅ |
| B | School Type | ✅ |
| C | School Type, Other Description (Optional) | ✅ |
| D | Number of Teachers | ✅ |
| **E** | **Country** | ❌ |
| F | Building name / number | ✅ |
| G | Street Address 1 | ✅ |
| H | Street Address 2 (Optional) | ✅ |
| I | City / Town | ✅ |
| J | Region / State / Province (Optional) | ✅ |
| K | Postal / ZIP code | ✅ |
| **L** | **Telephone Number Country Code** | ❌ |
| M | Telephone Number | ✅ |
| N | Website or social media page (Optional) | ✅ |
| O | Admin SAP-CDC ID | ✅ |
| P | Administrator (Optional) | ✅ |

---

## Re-Run Instructions

### After fix is deployed (same env)
1. Confirm the fix is deployed on the target environment
2. Run **TC005** to download the latest template
3. Run **TC006** — search for "country" in all column headers
4. **Pass condition:** zero occurrences of "country" (case-insensitive) in any header
5. If PASS → close [GitHub Issue #1](https://github.com/anildani/cambridge-one-automation/issues/1) with a comment

### Re-run on a higher environment
1. Update `BASE_URL` in the credentials table above
2. Confirm credentials are valid for that environment (or update them)
3. Run all 6 TCs in order
4. If TC006 still fails → file a new GitHub issue referencing this document

### Running with Claude Code (automated)
Tell Claude:
> "Re-run the country text verification test on `<ENV_URL>` using credentials `<username>` / `<password>`"

Claude will execute all 6 TCs in the browser, check the downloaded template, and report results.

---

## Screenshots
Captured during automated test run on 2026-05-14:

**TC002 — Login Success**
![TC002](../qa-assets/screenshots/tc002-login-success.png)

**TC003 — Tools Dashboard**
![TC003](../qa-assets/screenshots/tc003-tools-dashboard.png)

**TC004 — Bulk Institution Request Form**
![TC004](../qa-assets/screenshots/tc004-create-institution-page.png)

**TC005 — Template Download**
![TC005](../qa-assets/screenshots/tc005-template-link.png)

---

## Test Summary

| Metric | Value |
|--------|-------|
| Total TCs | 6 |
| Passed | 5 |
| Failed | 1 (TC006) |
| Browser | Chrome 148 |
| OS | Windows 11 |
| Executed by | @anildani |
| Tool | Claude Code + Playwright |