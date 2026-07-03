# WillFable — project notes

A novelty Twitter/Bluesky bot that, on an interval, sends a random Wikipedia page
title to Claude Fable 5 via the API and tweets **"Fable will talk about {title}"**
or **"Fable will not talk about {title}"** — based purely on whether the request
is refused.

## Settled mechanism

Bare `/v1/messages` call — no system prompt, no wrapper around the title:

```python
r = client.messages.create(
    model="claude-fable-5",
    max_tokens=1,
    messages=[{"role": "user", "content": title}],   # bare title
)
verb = "will not" if r.stop_reason == "refusal" else "will"
post(f"Fable {verb} talk about {title}")
```

- Branch on `stop_reason`: `"refusal"` → "will not", anything else → "will".
- **Reporting only** — the tweet never states *why* or the category. This keeps it
  clear of Anthropic's AUP guardrail-circumvention clause and away from looking
  like systematic probing.
- Per Anthropic docs: a pre-output refusal is HTTP 200, empty content, **billed
  nothing**. Accepts cost only a few input tokens.
- The Fable guardrail is lexical (keyword-matching), so only the title's own
  vocabulary trips it — not how the ask is phrased.

## Cost basis (being verified)

`fable_test.py` prints the full `usage` block. Expected on the bare script:
- `input_tokens`: single digits
- `cache_creation_input_tokens` / `cache_read_input_tokens`: **0**

The ~30k "cw1h" cache-write cost seen earlier was the **Claude Code harness**
system prompt, NOT anything the bare script incurs. A standalone script sends no
`system` and no `cache_control`, so there is no prefix to cache.

## Constraints / context

- API access is a **separate pay-as-you-go product** from the Pro subscription
  ($5 top-up, no enterprise account, doesn't touch the Pro plan).
- Automating the **consumer app** was ruled out — ToS-risky, and it lacks
  `stop_reason` / `max_tokens` / free-refusal accounting.
- Bot "runs a week unless self-funding."

## Housekeeping

- `api_key.txt` is a **leak risk** — prefer the `ANTHROPIC_API_KEY` env var (which
  `fable_test.py` already reads). Covered by `.gitignore`; delete it once the env
  var is confirmed working.
- This project's **first session's transcripts are in the parent dir**
  (`C:\Users\Ezekiel\Documents\Claude`), not under `WillFable\`.

## To do

- [ ] Run the cost test, confirm `usage` matches expectations above
- [ ] Write the full loop: Wikipedia random-article API → Fable call → post to
      Bluesky and/or Twitter (platform not yet chosen, auth scaffolding needed)
