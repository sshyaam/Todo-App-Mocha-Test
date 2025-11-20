# Slack Notifications Setup

This guide will help you set up Slack notifications for your GitHub Actions workflow.

## Step 1: Create a Slack Incoming Webhook

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name your app (e.g., "GitHub Actions Notifications") and select your workspace
4. Click **"Create App"**

## Step 2: Enable Incoming Webhooks

1. In your app settings, go to **"Incoming Webhooks"** in the left sidebar
2. Toggle **"Activate Incoming Webhooks"** to **On**
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., `#deployments`, `#ci-cd`)
5. Click **"Allow"**
6. **Copy the Webhook URL** (the URL will be provided by Slack - it's a long URL that starts with `https://hooks.slack.com/services/` followed by your workspace and channel identifiers)

## Step 3: Add Webhook URL to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `SLACK_WEBHOOK_URL`
5. Value: Paste the webhook URL you copied in Step 2
6. Click **"Add secret"**

## Step 4: Test the Integration

1. Push a commit or create a PR
2. The workflow will automatically send notifications to your Slack channel

## What Gets Notified?

The workflow sends Slack notifications for:

### ✅ **Preview Deployment Success**
- When a PR preview deployment succeeds
- Includes: PR number, author, preview URL, worker name

### ⚠️ **Preview Deployment Rollback**
- When a preview deployment fails health check and is rolled back
- Includes: PR info, rollback deployment ID, reason

### ✅ **Production Deployment Success**
- When a production deployment succeeds
- Includes: branch, commit info, production URL, worker name

### 🚨 **Production Deployment Rollback**
- When a production deployment fails health check and is rolled back
- Includes: branch, commit info, rollback deployment ID, reason

## Notification Format

Notifications include:
- **Header** with emoji indicating status
- **Fields** with key information (PR/branch, author, worker name, commit)
- **Links** to preview/production URLs and workflow runs
- **Context** about what happened

## Troubleshooting

### Notifications not appearing?

1. **Check the secret is set correctly:**
   - Go to Settings → Secrets → Actions
   - Verify `SLACK_WEBHOOK_URL` exists

2. **Check workflow logs:**
   - Go to Actions tab in GitHub
   - Check if the Slack notification step ran
   - Look for any error messages

3. **Verify webhook URL:**
   - Test the webhook URL manually:
     ```bash
     curl -X POST -H 'Content-type: application/json' \
       --data '{"text":"Test message"}' \
       YOUR_WEBHOOK_URL
     ```

4. **Check Slack channel:**
   - Make sure the webhook is configured for the correct channel
   - Check if the app has permission to post in that channel

### Notifications are too frequent?

- The notifications only trigger on:
  - Successful deployments
  - Failed deployments (rollbacks)
- They won't spam your channel with every workflow run

## Optional: Customize Notifications

You can modify the notification format in `.github/workflows/ci.yml` by editing the Slack notification steps. The format uses Slack's Block Kit for rich formatting.

