// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- plain Node script over untyped export data
// @ts-nocheck
// Builds src/lib/content/articles.json from the Telegram export in data/result.json.
//
//   pnpm content
//   pnpm content path/to/another-export.json
//
// Vite also runs this on start and whenever data/result.json changes.
// Entries without a "sourceId" were written by hand and are never overwritten,
// and a "highlight" or "themes" added to an imported entry survive a re-import.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT_PATH = resolve(root, 'data/result.json');
const OUTPUT_PATH = resolve(root, 'src/lib/content/articles.json');

const CHALLENGE_TAG = '#30daywritingprompt';
const SPLIT_POST_WINDOW_SECONDS = 60;
const SPLIT_POST_MIN_LENGTH = 200;

const plainText = (message) =>
	Array.isArray(message.text)
		? message.text.map((part) => (typeof part === 'string' ? part : part.text)).join('')
		: (message.text ?? '');

/** Keeps Telegram's bold and italic as **bold** and _italic_, and drops the sign-off tags. */
function markedText(message) {
	return (message.text_entities ?? [])
		.map(({ type, text }) => {
			if (!text.trim()) return text;
			const wrap = type === 'bold' ? '**' : type === 'italic' ? '_' : '';
			if (!wrap) return text;
			const [, before, inner, after] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
			return `${before}${wrap}${inner}${wrap}${after}`;
		})
		.join('');
}

function stripSignOff(text) {
	return text
		.replace(/#day\s*\d+/gi, '')
		.replace(new RegExp(CHALLENGE_TAG, 'gi'), '')
		.replace(/@thepenanddreamss/gi, '')
		.trim();
}

const tidyPrompt = (prompt) => prompt.replace(/\s+/g, ' ').trim();

function readPrompts(messages) {
	const list = messages.find(
		(m) => plainText(m).startsWith('30 days writing challenge') && plainText(m).includes('Day 30:')
	);
	if (!list) return [];
	return [...plainText(list).matchAll(/^Day\s+(\d+):\s*(.+)$/gm)].map((match) => ({
		day: Number(match[1]),
		prompt: tidyPrompt(match[2])
	}));
}

/** The longest post carrying the day's tag is the essay; shorter ones are reminders. */
function findEssays(messages) {
	const byDay = new Map();
	messages.forEach((message, index) => {
		const text = plainText(message);
		const tag = text.match(/#day\s*(\d+)/i);
		if (!tag || !text.toLowerCase().includes(CHALLENGE_TAG)) return;
		if (text.startsWith('30 days writing challenge')) return;
		const day = Number(tag[1]);
		const current = byDay.get(day);
		if (!current || text.length > plainText(current.message).length) {
			byDay.set(day, { message, index });
		}
	});
	return byDay;
}

/** Long essays were posted as consecutive messages; only the last one has the tags. */
function collectParts(messages, index) {
	const parts = [messages[index]];
	for (let i = index - 1; i >= 0; i--) {
		const previous = messages[i];
		const gap = Number(parts[0].date_unixtime) - Number(previous.date_unixtime);
		if (
			previous.type !== 'message' ||
			gap > SPLIT_POST_WINDOW_SECONDS ||
			plainText(previous).length < SPLIT_POST_MIN_LENGTH ||
			/#day\s*\d+/i.test(plainText(previous))
		) {
			break;
		}
		parts.unshift(previous);
	}
	return parts;
}

/** A heading is either "Day 4: Something" or a short first line with no sentence ending. */
function splitHeading(text, prompt) {
	const [firstLine, ...rest] = text.split('\n');
	const line = firstLine.replace(/\*\*/g, '').trim();
	const dayHeading = line.match(/^Day\s+\d+:\s*(.+)$/i);
	if (dayHeading) return { title: tidyPrompt(dayHeading[1]), body: rest.join('\n').trim() };
	if (line.length > 0 && line.length <= 70 && !/[.,!?:;]$/.test(line) && !/^\d+\./.test(line)) {
		return { title: line, body: rest.join('\n').trim() };
	}
	return { title: prompt, body: text };
}

export function importArticles(exportPath = EXPORT_PATH) {
	if (!existsSync(exportPath)) return { skipped: true };

	const exported = JSON.parse(readFileSync(exportPath, 'utf8'));
	const messages = exported.messages;
	const previous = existsSync(OUTPUT_PATH)
		? JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
		: { articles: [] };
	const previousByDay = new Map(previous.articles.map((article) => [article.day, article]));

	const prompts = readPrompts(messages);
	const promptFor = (day) => prompts.find((p) => p.day === day)?.prompt ?? `Day ${day}`;

	const imported = [...findEssays(messages)].map(([day, { index }]) => {
		const parts = collectParts(messages, index);
		const text = stripSignOff(parts.map(markedText).join('\n\n'));
		const prompt = promptFor(day);
		const { title, body } = splitHeading(text, prompt);
		const { highlight, themes } = previousByDay.get(day) ?? {};
		return {
			day,
			prompt,
			title,
			date: messages[index].date.slice(0, 10),
			time: messages[index].date.slice(11, 16),
			...(highlight ? { highlight } : {}),
			...(themes ? { themes } : {}),
			sourceId: messages[index].id,
			body
		};
	});

	const importedDays = new Set(imported.map((article) => article.day));
	const handWritten = previous.articles.filter((article) => !article.sourceId);
	const articles = [
		...imported.filter((article) => !handWritten.some((own) => own.day === article.day)),
		...handWritten
	].sort((a, b) => a.day - b.day);

	const next = {
		prompts: prompts.length ? prompts : (previous.prompts ?? []),
		articles
	};

	const serialised = JSON.stringify(next, null, '\t') + '\n';
	const changed = !existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, 'utf8') !== serialised;
	if (changed) {
		mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
		writeFileSync(OUTPUT_PATH, serialised);
	}
	return { changed, count: articles.length, importedDays: [...importedDays] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const result = importArticles(process.argv[2] && resolve(process.argv[2]));
	if (result.skipped) console.log('No export found, keeping articles.json as it is.');
	else
		console.log(`${result.count} articles ${result.changed ? 'written' : 'already up to date'}.`);
}
