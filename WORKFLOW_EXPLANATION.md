# GitHub Actions Workflow - How It Works

## 1. The `failure()` Function

The `failure()` function is a **built-in GitHub Actions function** (not something we set). It's used in job-level `if` conditions to check if a previous job failed.

### Where it's used:

```yaml
preview-rollback:
  name: Rollback Preview Deployment
  runs-on: ubuntu-latest
  needs: preview-deploy  # This job depends on preview-deploy
  if: failure() && (github.event_name == 'pull_request' && github.event.action != 'closed')
```

**Explanation:**
- `failure()` - Returns `true` if any of the jobs listed in `needs` have failed
- `needs: preview-deploy` - This job depends on `preview-deploy` job
- `if: failure()` - This job ONLY runs if `preview-deploy` job failed

### Other Built-in Functions:
- `success()` - Returns `true` if all previous jobs succeeded
- `failure()` - Returns `true` if any previous job failed
- `cancelled()` - Returns `true` if workflow was cancelled
- `always()` - Always runs regardless of job status

---

## 2. How Messages Are Set

Messages are constructed using **bash variables** and **GitHub Actions context variables**. Here's the breakdown:

### Step 1: Collect Information

```yaml
run: |
  PREVIEW_URL="${{ steps.preview-url.outputs.url }}"
  WORKER_NAME="${{ steps.preview-url.outputs.worker-name }}"
  PR_NUMBER="${{ github.event.pull_request.number }}"
  PR_TITLE="${{ github.event.pull_request.title }}"
  PR_AUTHOR="${{ github.event.pull_request.user.login }}"
  COMMIT_SHA="${{ github.sha }}"
  COMMIT_SHORT=$(echo "$COMMIT_SHA" | cut -c1-7)
  WORKFLOW_RUN_URL="${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

**Variables explained:**
- `${{ steps.preview-url.outputs.url }}` - Output from previous step named `preview-url`
- `${{ github.event.pull_request.number }}` - PR number from the GitHub event
- `${{ github.sha }}` - Full commit SHA
- `${{ github.run_id }}` - Workflow run ID
- `COMMIT_SHORT` - First 7 characters of commit SHA (bash command)

### Step 2: Build JSON Message (Slack Block Kit Format)

```yaml
curl -X POST -H 'Content-type: application/json' \
  --data "{
    \"text\": \"🚀 Preview Deployment Successful\",
    \"blocks\": [
      {
        \"type\": \"header\",
        \"text\": {
          \"type\": \"plain_text\",
          \"text\": \"🚀 Preview Deployment Successful\"
        }
      },
      {
        \"type\": \"section\",
        \"fields\": [
          {
            \"type\": \"mrkdwn\",
            \"text\": \"*PR:* <${{ github.event.pull_request.html_url }}|#$PR_NUMBER: $PR_TITLE>\"
          },
          ...
        ]
      }
    ]
  }"
```

**What's happening:**
- `curl -X POST` - HTTP POST request
- `-H 'Content-type: application/json'` - Sets content type header
- `--data "{...}"` - JSON payload with Slack Block Kit format
- `\"text\"` - Escape quotes for bash
- `$PR_NUMBER` - Bash variable substitution
- `${{ github.event.pull_request.html_url }}` - GitHub Actions context variable

---

## 3. How Messages Are Sent Through Webhooks

### The Webhook URL:

```yaml
"${{ secrets.SLACK_WEBHOOK_URL }}"
```

This is stored as a GitHub Secret:
1. Go to repository → Settings → Secrets and variables → Actions
2. Create secret named `SLACK_WEBHOOK_URL`
3. Value is the Slack webhook URL from Slack API

### The Complete Flow:

```yaml
- name: Send Slack notification - Preview Deployment Success
  if: success()  # Only run if job succeeded
  run: |
    # 1. Collect data
    PREVIEW_URL="${{ steps.preview-url.outputs.url }}"
    ...
    
    # 2. Send HTTP POST to Slack webhook
    curl -X POST -H 'Content-type: application/json' \
      --data "{...JSON payload...}" \
      "${{ secrets.SLACK_WEBHOOK_URL }}"
  continue-on-error: true  # Don't fail workflow if Slack fails
```

### How Slack Webhook Works:

1. **You create a webhook in Slack:**
   - Go to api.slack.com → Create App → Enable Incoming Webhooks
   - Slack provides you with a webhook URL (format: workspace_id/channel_id/webhook_token)

2. **You store it in GitHub:**
   - Add as secret `SLACK_WEBHOOK_URL`

3. **GitHub Actions sends POST request:**
   ```
   POST [YOUR_SLACK_WEBHOOK_URL_FROM_SECRETS]
   Content-Type: application/json
   
   {
     "text": "🚀 Preview Deployment Successful",
     "blocks": [...]
   }
   ```

4. **Slack receives and displays:**
   - Slack's servers receive the POST request
   - They parse the JSON
   - They format it according to Block Kit
   - They post it to your configured channel

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   preview-deploy job                   │
        │   - Deploy worker                      │
        │   - Health check                       │
        └───────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
            ✅ success()      ❌ failure()
                    │                │
                    ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ Send Slack:      │  │ Rollback job     │
        │ ✅ Success msg   │  │ runs             │
        └──────────────────┘  └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ Send Slack:      │
                          │ ⚠️ Rollback msg  │
                          └──────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────┐
        │   curl POST request                    │
        │   to Slack Webhook URL                 │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Slack API Server                     │
        │   - Receives POST                     │
        │   - Parses JSON                       │
        │   - Formats message                   │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   Your Slack Channel                   │
        │   📢 Message appears!                  │
        └───────────────────────────────────────┘
```

---

## Key GitHub Actions Context Variables Used

| Variable | Description | Example |
|----------|-------------|---------|
| `${{ github.event.pull_request.number }}` | PR number | `123` |
| `${{ github.event.pull_request.title }}` | PR title | `"Add feature"` |
| `${{ github.event.pull_request.html_url }}` | PR URL | `https://github.com/.../pull/123` |
| `${{ github.sha }}` | Full commit SHA | `abc123def456...` |
| `${{ github.run_id }}` | Workflow run ID | `1234567890` |
| `${{ github.repository }}` | Repo name | `owner/repo` |
| `${{ github.ref_name }}` | Branch name | `main` |
| `${{ steps.step-id.outputs.key }}` | Output from previous step | Step output value |
| `${{ secrets.SECRET_NAME }}` | Secret value | (hidden) |

---

## Summary

1. **`failure()` function**: Built-in GitHub Actions function that checks if a job failed
2. **Messages are set**: Using bash variables and GitHub Actions context variables, constructed as JSON
3. **Sent through webhooks**: Via `curl` HTTP POST requests to Slack's webhook URL (stored as GitHub Secret)

The workflow automatically sends rich formatted messages to Slack based on deployment status!

