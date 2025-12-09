# GitHub Actions Secrets Setup

This document explains how to configure secrets for the CI/CD pipeline to run automated tests and build Docker images.

## Required Secrets

The GitHub Actions workflows require two secrets to be configured in your repository settings:

### 1. `OPENAI_API_KEY`

Your OpenAI API key for running tests that validate chat and embedding generation.

**Setup:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create or copy your existing API key
3. In your GitHub repository: **Settings → Secrets and variables → Actions**
4. Click **New repository secret**
5. Name: `OPENAI_API_KEY`
6. Value: Paste your OpenAI API key
7. Click **Add secret**

**Format:** `sk_prod_...` or `sk_test_...`

---

### 2. `TEST_DATABASE_URL`

The database connection string for integration tests. This should point to a **test Supabase database** (separate from production).

**Setup:**

#### Option A: Use a Test Supabase Project (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use an existing test project)
3. In your project, go to **Settings → Database**
4. Copy the **Connection string** (JDBC URI or PostgreSQL format)
5. In GitHub: **Settings → Secrets and variables → Actions**
6. Click **New repository secret**
7. Name: `TEST_DATABASE_URL`
8. Value: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`
9. Click **Add secret**

**Format:** `postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres`

#### Option B: Use a Local Docker Database (For Testing Locally)

For local testing only:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/trinity_test"
```

---

## Steps to Add Secrets

### Via GitHub Web UI (Easiest)

1. Go to your repository: `https://github.com/Gabbykoms/Ctrl-Alt-Elite`
2. Click **Settings** (top tab)
3. In left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter secret name and value
6. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI: https://cli.github.com/

# Login to GitHub
gh auth login

# Add OpenAI API key
gh secret set OPENAI_API_KEY --body "sk_prod_your_key_here"

# Add test database URL
gh secret set TEST_DATABASE_URL --body "postgresql://postgres:password@db.supabase.co:5432/postgres"

# List all secrets
gh secret list
```

---

## Verifying Secrets Are Set

After adding secrets, you can verify they're configured:

```bash
gh secret list
```

You should see:
```
OPENAI_API_KEY          Updated 2025-12-06
TEST_DATABASE_URL       Updated 2025-12-06
```

---

## How Secrets Are Used in CI/CD

### Test Job (`test` job in `docker-build.yml`)

The workflow uses these secrets when running integration tests:

```yaml
- name: Run integration tests
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    pytest tests/ -v --tb=short --cov=app
```

This allows tests to:
- Connect to Supabase and run database tests
- Call OpenAI API to validate embeddings and chat
- Verify RAG functionality end-to-end

---

## Important Security Notes

⚠️ **Never commit secrets to Git!**
- `.env` files are in `.gitignore` for a reason
- Secrets on GitHub are encrypted and only visible to you
- They're injected at runtime and never logged

⚠️ **Protect your test database:**
- Use a separate Supabase project for CI tests (not production)
- Restrict database access to GitHub Actions IP range if possible
- Regenerate API keys periodically
- If a key is compromised, regenerate it immediately on the provider's website

✅ **What GitHub does:**
- Secrets are encrypted at rest
- Only visible to repository owners/admins
- Never printed in logs (GitHub redacts `***` automatically)
- Can be rotated at any time without code changes

---

## Troubleshooting

### Tests fail with "SECRET_NAME not found"
- Verify secret name matches exactly (case-sensitive)
- Check spelling in both the workflow file and GitHub settings
- Wait 30 seconds after adding secret before running workflow

### "Database connection refused"
- Verify `TEST_DATABASE_URL` format is correct
- Check that test Supabase project is running
- Ensure pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- Test connection locally: `psql postgresql://postgres:password@host:port/postgres`

### "Invalid OpenAI API key"
- Verify key format (should start with `sk_`)
- Check that key hasn't expired on platform.openai.com
- Confirm key has API usage credits remaining
- Regenerate key and update secret if needed

### Still have issues?
- Check workflow logs: **Actions → Latest workflow run → Test job → Logs**
- GitHub redacts secrets, but error messages usually indicate the problem
- For database issues, check Supabase logs in the dashboard
- For API issues, check OpenAI API status page

---

## Next Steps

1. ✅ Add the two secrets to your GitHub repository
2. ⏳ Push a commit to trigger the workflow
3. 📊 Watch the **Actions** tab to see tests run
4. 🎉 When tests pass, Docker image will automatically build and push

See the workflow file at `.github/workflows/docker-build.yml` for the complete pipeline.
