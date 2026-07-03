// WillFable cron trigger — Cloudflare Worker.
//
// GitHub Actions `schedule` throttles high-frequency crons unreliably, so we
// drive the workflow from Cloudflare's cron instead. On each tick this Worker
// calls GitHub's workflow_dispatch API, which fires reliably.
//
// Secrets (set via `wrangler secret put`, never committed):
//   GH_PAT   fine-grained PAT with Actions: read/write on ZiziSolomon/WillFable
//
// Config lives in wrangler.toml [vars]:
//   REPO     e.g. "ZiziSolomon/WillFable"
//   WORKFLOW e.g. "willfable.yml"
//   REF      branch to run on, e.g. "main"

async function dispatch(env) {
  const url = `https://api.github.com/repos/${env.REPO}/actions/workflows/${env.WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_PAT}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      // GitHub requires a User-Agent on all API requests.
      "User-Agent": "willfable-cron-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: env.REF }),
  });

  // A successful dispatch returns 204 No Content.
  if (res.status !== 204) {
    const text = await res.text();
    throw new Error(`dispatch failed: ${res.status} ${text}`);
  }
}

export default {
  // Fires on the cron schedule in wrangler.toml.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatch(env));
  },

  // Optional manual test: visit the Worker URL in a browser to trigger once.
  async fetch(request, env, ctx) {
    try {
      await dispatch(env);
      return new Response("dispatched\n", { status: 200 });
    } catch (e) {
      return new Response(`error: ${e.message}\n`, { status: 500 });
    }
  },
};
