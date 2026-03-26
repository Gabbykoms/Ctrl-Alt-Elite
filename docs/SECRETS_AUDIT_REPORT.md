# Secrets & Hardcoded Environment Variables Audit Report

**Branch:** `secrets-fix`
**Date:** March 1, 2026
**Scope:** Full codebase audit for hardcoded secrets, API keys, passwords, tokens, and environment variables

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Was Fixed](#what-was-fixed)
3. [Remaining Issues](#remaining-issues)
4. [Git History Exposure](#git-history-exposure)
5. [Testing Guide (Without .env Files)](#testing-guide-without-env-files)
6. [Pre-Merge Checklist](#pre-merge-checklist)
7. [Recommendations](#recommendations)
8. [Summary Scorecard](#summary-scorecard)

---

## Executive Summary

The `secrets-fix` branch successfully removed hardcoded credentials from the two most critical Kubernetes secret manifests (`AI_Intergration_Service/kubernetes/secret.yaml` and `tracking-service/kubernetes/secrets.yaml`), replacing them with environment variable references and adding Kustomize `secretGenerator` blocks. However, **3 files still contain hardcoded sensitive values** that should be addressed before merging to `main`. Additionally, all previously exposed credentials exist in git history and must be rotated.

| Severity | Count | Description |
|----------|-------|-------------|
| **Fixed** | 7 | Files properly remediated on this branch |
| **Critical** | 1 | Tracked file with real database password |
| **High** | 1 | CI workflow with hardcoded Mapbox API token |
| **Medium** | 2 | Template/config files with real infrastructure URLs |
| **Low** | 1 | Dummy test values in CI (acceptable) |

---

## What Was Fixed

These changes were introduced in commit `0ce442b5`:

### 1. AI Service Kubernetes Secret (`AI_Intergration_Service/kubernetes/secret.yaml`)

**Before:** Contained 6 plaintext secrets — Supabase connection string, Supabase URL, Supabase anon key (JWT), database password, OpenAI API key, and OpenWeather API key.

**After:** All values replaced with environment variable references:
```yaml
stringData:
  AI_DATABASE_URL: ${AI_DATABASE_URL}
  AI_SUPABASE_URL: ${AI_SUPABASE_URL}
  AI_SUPABASE_KEY: ${AI_SUPABASE_KEY}
  AI_DB_PASSWORD: ${AI_DB_PASSWORD}
  AI_OPENAI_API_KEY: ${AI_OPENAI_API_KEY}
  OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY}
```

### 2. Tracking Service Kubernetes Secret (`tracking-service/kubernetes/secrets.yaml`)

**Before:** Contained hardcoded database username (`postgres`) and password (`Vr8Ba5zUku`).

**After:** Replaced with variable references:
```yaml
stringData:
  db-username: ${DB_USER}
  db-password: ${DB_PASSWORD}
```

### 3. Kustomize Secret Generators

Added `secretGenerator` blocks to both services' `kustomization.yaml` files so secrets are loaded from local `.env` files at deploy time:

- `AI_Intergration_Service/kubernetes/kustomization.yaml` — generates `ai-service-secrets` from `.env.secret`
- `tracking-service/kubernetes/kustomization.yaml` — generates `tracking-secrets` from `.env`

### 4. Gitignore Updates

- `AI_Intergration_Service/.gitignore` — added `.env.secrets`
- `tracking-service/.gitignore` — added `.env` and `.env.local`

### 5. Example Environment File

- Created `AI_Intergration_Service/.env.secrets.example` with placeholder values for all required secrets

### 6. Verified Not Tracked

The following sensitive files are confirmed **not tracked** in git:
- `AI_Intergration_Service/.env.secrets` — properly gitignored
- `tracking-service/.env` — properly gitignored

---

## Remaining Issues

### Issue 1: CRITICAL — `tracking-service/kubernetes/init-db-job.yaml` (Line 18)

**Status:** Tracked in git with a real database password.

```yaml
env:
- name: PGPASSWORD
  value: "Vr8Ba5zUku"
- name: PGUSER
  value: "postgres"
```

**Risk:** Anyone with repo access can see the production database password.

**Fix:** Reference a Kubernetes Secret instead of hardcoding:
```yaml
env:
- name: PGPASSWORD
  valueFrom:
    secretKeyRef:
      name: tracking-secrets
      key: db-password
- name: PGUSER
  valueFrom:
    secretKeyRef:
      name: tracking-secrets
      key: db-username
```

---

### Issue 2: HIGH — `.github/workflows/frontend-ci-cd.yml` (Lines 59, 109)

**Status:** Mapbox API token hardcoded in two places within the CI workflow.

**Location 1 — Build check step (line 59):**
```yaml
env:
  VITE_MAPBOX_TOKEN: pk.eyJ1IjoiZ2FiYnlrb21zIiwiYSI6ImNtaGgz...
```

**Location 2 — Docker build args (line 109):**
```yaml
build-args: |
  VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZ2FiYnlrb21zIiwiYSI6ImNtaGgz...
```

A comment was added acknowledging this needs to be fixed, but the token is still exposed.

**Fix:** Replace both occurrences with:
```yaml
VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}
```
Then add `VITE_MAPBOX_TOKEN` as a GitHub repository secret.

---

### Issue 3: MEDIUM — `gke-secrets.env.template` (Lines 17, 50–51)

**Status:** Template file contains real Supabase project IDs and URLs.

```
SUPABASE_URL=https://iarrtqyfimoukixvcizb.supabase.co          # Line 17
AI_DATABASE_URL=postgresql://postgres.bwijyokpoqewpwbwwfso:...  # Line 50
AI_SUPABASE_URL=https://bwijyokpoqewpwbwwfso.supabase.co       # Line 51
```

**Risk:** Exposes real Supabase project identifiers. Templates should contain only placeholder values.

**Fix:** Replace with generic placeholders:
```
SUPABASE_URL=https://your-project-id.supabase.co
AI_DATABASE_URL=postgresql://postgres.your-project-id:${AI_DB_PASSWORD}@your-region.pooler.supabase.com:6543/postgres
AI_SUPABASE_URL=https://your-project-id.supabase.co
```

---

### Issue 4: MEDIUM — `frontend/.env.cluster` (Tracked in Git)

**Status:** Contains production infrastructure URLs.

```
VITE_API_BASE_URL=https://shuttle.javajon-gke.duckdns.org/api
VITE_SOCKET_URL=https://shuttle.javajon-gke.duckdns.org
VITE_AI_SERVICE_URL=https://shuttle.javajon-gke.duckdns.org/api/ai
```

**Risk:** Reveals production domain and infrastructure layout. Not a secret, but provides reconnaissance information.

**Fix:** Consider adding `frontend/.env.cluster` to `.gitignore` and providing a `.env.cluster.example` with placeholder URLs.

---

### Issue 5: LOW — `.github/workflows/docker-build.yml` (Lines 46–47)

**Status:** Contains dummy test values used in CI.

```yaml
env:
  AI_DATABASE_URL: "postgresql://user:pass@localhost:5432/test_db"
  AI_OPENAI_API_KEY: "dummy-key-for-testing"
```

**Risk:** Minimal. These are obviously fake values used for unit test environments. Acceptable practice.

**Action:** No change required.

---

## Git History Exposure

Removing secrets from the current branch does **not** remove them from git history. The following credentials were committed in previous commits and are recoverable by anyone with repository access:

| Secret | Original File | Commit |
|--------|--------------|--------|
| OpenAI API Key (`sk-proj-5PKH6z0p...`) | `AI_Intergration_Service/kubernetes/secret.yaml` | Pre-fix commits |
| Supabase JWT Token (`eyJhbGciOiJIUz...`) | `AI_Intergration_Service/kubernetes/secret.yaml` | Pre-fix commits |
| AI Database Password (`ctrl-alt-elite`) | `AI_Intergration_Service/kubernetes/secret.yaml` | Pre-fix commits |
| OpenWeather API Key (`0b5f5afbeda3...`) | `AI_Intergration_Service/kubernetes/secret.yaml` | Pre-fix commits |
| Tracking DB Password (`Vr8Ba5zUku`) | `tracking-service/kubernetes/secrets.yaml` | Pre-fix commits |
| Tracking DB Password (`Vr8Ba5zUku`) | `tracking-service/kubernetes/init-db-job.yaml` | Still in current code |

### Required Actions

1. **Rotate all exposed credentials immediately** — assume they are compromised
2. **Consider git history rewriting** using BFG Repo-Cleaner or `git filter-repo`:
   ```bash
   # Using BFG (recommended for simplicity)
   bfg --replace-text passwords.txt repo.git
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
3. If this is a public or widely-shared repository, consider creating a fresh repo

---

## Testing Guide (Without .env Files)

Since you cloned the repo on a different machine and are missing `.env` files, follow these steps to validate the `secrets-fix` branch before merging.

### Step 1: Verify No Secrets in Tracked Files

Run these commands to search all tracked files for known credential values:

```bash
# Search for known passwords and keys
git grep -i "Vr8Ba5zUku"                    # Tracking DB password
git grep -i "ctrl-alt-elite"                 # AI DB password
git grep "sk-proj-"                          # OpenAI API keys
git grep "0b5f5afbeda38b9b780a3d9258b7d0ba"  # OpenWeather key
git grep "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI"  # Supabase JWT
```

**Expected results:**
- `Vr8Ba5zUku` will still appear in `tracking-service/kubernetes/init-db-job.yaml` (remaining issue)
- All others should return no results in current tracked files

### Step 2: Verify Kubernetes Manifests Use Variable References

```bash
cat AI_Intergration_Service/kubernetes/secret.yaml
# Expected: all values should be ${VARIABLE_NAME} placeholders

cat tracking-service/kubernetes/secrets.yaml
# Expected: ${DB_USER} and ${DB_PASSWORD} placeholders
```

### Step 3: Verify .gitignore Coverage

```bash
# These files should NOT appear in tracked files
git ls-files --cached | grep -E '(tracking-service/\.env$|AI_Intergration_Service/\.env\.secrets$)'
# Expected: no output (means they are properly ignored)

# Verify the gitignore entries exist
grep "\.env\.secrets" AI_Intergration_Service/.gitignore
grep "^\.env$" tracking-service/.gitignore
# Expected: both should print the matching gitignore rule
```

### Step 4: Create Local .env Files from Templates

```bash
# Tracking service
cp tracking-service/.env.example tracking-service/.env
# Then edit tracking-service/.env with your local database credentials

# AI service
cp AI_Intergration_Service/.env.secrets.example AI_Intergration_Service/.env.secrets
# Then edit with your real API keys and database credentials

# Frontend
cp frontend/.env.example frontend/.env
# Then edit with your Mapbox token and API URLs

# Backend
cp backend/.env.example backend/.env
# Then edit with your Supabase credentials and JWT secret
```

### Step 5: Validate Kustomize Builds

```bash
# Test that kustomize can parse the manifests (structure validation)
cd tracking-service/kubernetes && kubectl kustomize . 2>&1 | head -50
cd ../../AI_Intergration_Service/kubernetes && kubectl kustomize . 2>&1 | head -50
```

Note: The `secretGenerator` blocks require the `.env` / `.env.secret` files to exist locally. Create them from the example files first.

### Step 6: Run an Automated Secret Scan

```bash
# Option A: detect-secrets (Python)
pip install detect-secrets
detect-secrets scan --all-files \
  --exclude-files '\.env\.example$|\.env\.secrets\.example$|\.env\.template$'

# Option B: trufflehog (Go)
trufflehog filesystem --directory=. --exclude-paths=.gitignore

# Option C: Simple grep-based check
git grep -l -E '(sk-proj-|sk-live-|pk\.eyJ|eyJhbGciOi|mongodb\+srv://|amqp://.*:.*@)' -- ':!*.example' ':!*.template' ':!*.md'
```

### Step 7: Validate CI Workflow Syntax

```bash
# Check that modified workflow files are valid YAML
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/frontend-ci-cd.yml')); print('Valid YAML')"
```

### Step 8: Run Existing Tests (If Dependencies Are Available)

```bash
# Frontend (requires Node.js)
cd frontend && npm ci && npm run lint && npm test

# Backend (requires Node.js)
cd backend && npm ci && npm test

# AI Service (requires Python 3.12)
cd AI_Intergration_Service && pip install -r requirements.txt && python -m pytest tests/test_basic.py -v

# Tracking Service (requires Java 21 + Gradle)
cd tracking-service && ./gradlew test
```

---

## Pre-Merge Checklist

- [ ] Fix `tracking-service/kubernetes/init-db-job.yaml` — replace hardcoded `PGPASSWORD` with Secret reference
- [ ] Fix `.github/workflows/frontend-ci-cd.yml` — replace hardcoded Mapbox token with `${{ secrets.VITE_MAPBOX_TOKEN }}`
- [ ] Add `VITE_MAPBOX_TOKEN` as a GitHub repository secret
- [ ] Fix `gke-secrets.env.template` — replace real Supabase project IDs with generic placeholders
- [ ] Consider gitignoring `frontend/.env.cluster`
- [ ] Run `git grep` checks from Step 1 above and confirm no real credentials in tracked files
- [ ] Run automated secret scan (Step 6)
- [ ] Rotate all exposed credentials (OpenAI key, Supabase JWT, DB passwords, OpenWeather key)
- [ ] After merge, consider using BFG Repo-Cleaner to remove secrets from git history

---

## Recommendations

### Short-Term (Before Merge)
1. Fix the 3 remaining files listed above
2. Rotate all compromised credentials
3. Add `VITE_MAPBOX_TOKEN` to GitHub Secrets

### Medium-Term (After Merge)
1. Clean git history with BFG Repo-Cleaner
2. Set up GitHub secret scanning alerts (Settings > Code security)
3. Add a pre-commit hook using `detect-secrets` to prevent future leaks

### Long-Term
1. Adopt a secret management solution (HashiCorp Vault, AWS Secrets Manager, or Sealed Secrets for K8s)
2. Implement secret rotation policies
3. Use Kubernetes External Secrets Operator to sync secrets from a vault

---

## Summary Scorecard

| Area | Status |
|------|--------|
| AI Service K8s secrets | Fixed |
| Tracking Service K8s secrets | Fixed |
| Kustomize secret generators | Added |
| .gitignore updates | Done |
| Example env templates | Created |
| `init-db-job.yaml` password | **NOT FIXED** |
| Frontend CI Mapbox token | **NOT FIXED** |
| `gke-secrets.env.template` real URLs | **NOT FIXED** |
| `frontend/.env.cluster` exposure | **NOT FIXED** |
| Git history cleanup | **NOT DONE** |
| Credential rotation | **NOT DONE** |

---

*Report generated from full codebase audit of the `secrets-fix` branch.*


## Questions and ToDos

- Can I delete teh secrets.yaml from k8s in tracking-service now that the secret is automatically created by kustomization.yaml?
- Tell Gabriel to put mapbox token in github secrets so we can change it from frontend-ci-cd.yaml in line 59 and line 109
- Tried running the following command
  ```bash
  # Frontend (requires Node.js)
  cd frontend && npm ci && npm run lint && npm test
  ```
  However we would have to make a lot of changes to have run npm run lint command, so decided to just run 
  ```bash
  # Frontend (requires Node.js)
  cd frontend && npm ci && npm run lint && npm test
  ```
  However no test files found
- No test file for backend, so no test could be run

