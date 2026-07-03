# Will Fable?

A bot that, every ~10 minutes, asks **Claude Fable 5** to talk about a randomly
chosen Wikipedia article and posts to Bluesky whether Fable **will** or **won't**
discuss that subject.

- 🦋 **Follow it:** [@willfable.bsky.social](https://bsky.app/profile/willfable.bsky.social)
- ☕ **Keep it running:** [ko-fi.com/willfable](https://ko-fi.com/willfable) — each coffee ≈ a week of runtime

---

## What it actually does

Once every ten minutes:

1. **Picks a random Wikipedia article.** It queries Wikipedia's API for a genuine
   random article title (real pages — "France", "Rocking chair", some 2009 cricket
   season), not a made-up name.
2. **Asks Fable about it.** It sends `"Hi Claude, tell me about {title}"` to Claude
   Fable 5 via the Anthropic API, capped at a small number of output tokens.
3. **Reads the outcome, not the answer.** It does **not** read what Fable says. It
   checks the API response's `stop_reason`:
   - `stop_reason == "refusal"` → Fable declined → **"Fable will not talk about {title}"**
   - anything else → **"Fable will talk about {title}"**
4. **Posts the verdict to Bluesky.**

That's the whole thing. The bot never claims *why* Fable declined, never reports a
category, and never publishes Fable's actual responses — it reports one bit
(refused or not) as a short sentence.

## Why "detecting refusal, not reading the answer" matters

Claude Fable 5 runs safety classifiers on incoming requests. When a request is
declined, the API returns a distinct `stop_reason: "refusal"` rather than an answer.
WillFable keys off exactly that signal:

- It only needs **one bit** per call, so it reads `stop_reason` instead of the text.
- Almost every random article comes back **"will"** — refusals are the rare,
  interesting case, and the reason the bot exists.
- It reports the model's *behaviour*, not a map of where the guardrail sits. Each
  call is an independent, single-topic request; the bot does not vary inputs to
  probe the boundary or diagnose which word triggered a decline.

## How it runs

There is no server. The whole bot is a single Python script
([`willfable.py`](willfable.py)) fired on a schedule by **GitHub Actions cron**
([`.github/workflows/willfable.yml`](.github/workflows/willfable.yml)):

```
schedule:
  - cron: "*/10 * * * *"   # every 10 minutes (best-effort; often runs a little late)
```

Secrets (the Anthropic API key and the Bluesky app password) live in GitHub
encrypted **repository secrets**, never in the code.

### Config (environment variables)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key (pay-as-you-go; **not** a Claude subscription) |
| `BLUESKY_HANDLE` | e.g. `willfable.bsky.social` |
| `BLUESKY_APP_PASSWORD` | a Bluesky **app password** (revocable; not the login password) |
| `WILLFABLE_DRY_RUN` | if `1`, do everything except post (prints instead) |
| `WILLFABLE_LOG` | path to append a log line per run (default: `./willfable.log`) |

## Cost

Each call is a few input tokens plus a small output cap. A pre-output refusal is
billed nothing; an acceptance costs a fraction of a penny. In practice a few
dollars of API credit runs the bot for weeks at this cadence.

## Running it yourself

```bash
pip install anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
export BLUESKY_HANDLE="you.bsky.social"
export BLUESKY_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
python willfable.py          # one cycle
# add WILLFABLE_DRY_RUN=1 to test without posting
```

## Dependencies

- Python 3
- [`anthropic`](https://pypi.org/project/anthropic/) — the only non-stdlib package
  (Wikipedia and Bluesky are called with the standard library).
