# Thepenanddreams

The 30 day writing challenge from the Thepenanddreams Telegram channel, as a scrapbook you scroll through.

```sh
pnpm install
pnpm dev
```

## Adding new writing

Everything on the site comes from one file: `src/lib/content/articles.json`.
New days appear on the washing line, in the tally and in the day ruler on their own.

**From a new Telegram export.** Put the new export at `data/result.json`. That folder is local only and never committed, so commit the updated `articles.json` to publish. The dev server and `pnpm build` pick it up automatically, or run `pnpm content` yourself. Any post tagged `#dayN` and `#30daywritingprompt` becomes that day's article, and essays split across consecutive posts are joined back together.

**By hand.** Add an entry to `articles`:

```json
{
	"day": 29,
	"prompt": "Things that makes you happy",
	"title": "Things that makes you happy",
	"date": "2026-10-31",
	"highlight": "An exact phrase from the body to mark with the highlighter",
	"body": "First paragraph.\n\nSecond paragraph with **bold** and _italic_."
}
```

`highlight` and `themes` are optional. `themes` is a list of words such as `["Love"]`, and each new word adds a filter to the index. In `body`, a blank line starts a new paragraph, a line of just `—` draws a squiggle break, and lines starting `1.` become a numbered list.

Entries with no `sourceId` are yours: an import never overwrites them. A `highlight` or `themes` you add to an imported entry also survives re-imports.

The scraps on the homepage are in `src/lib/content/asides.json`, and are edited by hand.
