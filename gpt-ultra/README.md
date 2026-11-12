# GPT ULTRA

A standalone Arabic-first AI chat interface added without changing the existing Noor Al-Islam homepage.

## Deploy on Netlify
1. Keep the repository's existing site files unchanged.
2. Netlify detects the function in `netlify/functions/chat.mjs`.
3. In Netlify site settings, add an environment variable named `OPENAI_API_KEY`.
4. Redeploy the site.
5. Open `/gpt-ultra/`.

**Important:** Never put an API key in browser JavaScript or commit it to GitHub. API usage may incur charges. An adult account owner should manage any paid API account and billing.

## Files
- `gpt-ultra/index.html`: responsive Arabic chat UI.
- `netlify/functions/chat.mjs`: server-side proxy; keeps the API key off the browser.
