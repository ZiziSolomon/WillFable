# WillFable cron trigger (Cloudflare Worker)

Drives the WillFable GitHub Actions workflow on a reliable 10-minute cadence,
because GitHub's own `schedule` cron throttles high-frequency jobs and can slip
to once every few hours. This Worker runs on Cloudflare's cron and calls
GitHub's `workflow_dispatch` API, which fires reliably.

## One-time setup

1. **Create a fine-grained GitHub PAT**
   - https://github.com/settings/personal-access-tokens/new
   - Resource owner: your account; Repository access: **Only select repositories → `ZiziSolomon/WillFable`**
   - Permissions → Repository → **Actions: Read and write**
   - Set an expiry you're comfortable with (e.g. 90 days) and copy the token.

2. **Install Wrangler and log in** (needs Node):
   ```
   npm install -g wrangler
   wrangler login
   ```

3. **From this `cron-worker/` directory, store the PAT as a secret and deploy:**
   ```
   wrangler secret put GH_PAT      # paste the token when prompted
   wrangler deploy
   ```

## Test it

- Visit the deployed Worker URL in a browser — it triggers one run and prints
  `dispatched`. Then check the repo's Actions tab for a new `workflow_dispatch` run.
- Or wait for the next `*/10` tick.

## Retiring the local watchdog

Once the Worker is deployed and you've confirmed runs are appearing every
10 min, the local `watchdog.py` is no longer needed — stop it. The Worker
posts even when your laptop is off.

## Notes

- The PAT lives only in Cloudflare (as a Worker secret), never in this repo.
- GitHub's `schedule:` trigger stays in `willfable.yml` as a free fallback;
  it just can't be relied on for tight cadence.
- Rotate the PAT before expiry: create a new one, `wrangler secret put GH_PAT`
  again, redeploy.
