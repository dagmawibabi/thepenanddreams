export interface Article {
	day: number;
	prompt: string;
	title: string;
	date: string;
	time?: string;
	body: string;
	highlight?: string;
	themes?: string[];
	sourceId?: number;
}

export interface Inline {
	text: string;
	bold?: boolean;
	italic?: boolean;
	marked?: boolean;
}

export type Block =
	| { type: 'paragraph'; inline: Inline[] }
	| { type: 'list'; items: Inline[][] }
	| { type: 'salutation'; text: string }
	| { type: 'note'; text: string }
	| { type: 'break' };

export interface DayCard {
	day: number;
	prompt: string;
	title?: string;
	line?: string;
	time?: string;
	minutes?: number;
	themes?: string[];
}

export interface Aside {
	day: number;
	text: string;
}

export interface DayList {
	day: number;
	title: string;
	items: string[];
	start: number;
}

const ONES =
	'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(
		' '
	);
const TENS = 'twenty thirty forty fifty sixty seventy eighty ninety'.split(' ');

export function numberWord(value: number) {
	if (value < 20) return ONES[value];
	if (value >= 100) return String(value);
	const tens = TENS[Math.floor(value / 10) - 2];
	return value % 10 ? `${tens}-${ONES[value % 10]}` : tens;
}

export function formatDate(iso: string) {
	return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

export function readingMinutes(article: Article) {
	return Math.max(1, Math.round(article.body.split(/\s+/).length / 220));
}

/** The line shown on the washing line card: the chosen highlight, or the opening sentence. */
export function excerpt(article: Article) {
	if (article.highlight) return article.highlight;
	const opening = article.body.replace(/\*\*|_/g, '').split(/(?<=[.!?።])\s/)[0];
	return opening.length > 90 ? `${opening.slice(0, 88).trimEnd()}…` : opening;
}

function parseInline(text: string, highlight?: string): Inline[] {
	const tokens: Inline[] = [];
	const pattern = /\*\*(.+?)\*\*|(?<![\w])_(.+?)_(?![\w])/gs;
	let cursor = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > cursor) tokens.push({ text: text.slice(cursor, match.index) });
		if (match[1]) tokens.push({ text: match[1], bold: true });
		else tokens.push({ text: match[2], italic: true });
		cursor = match.index + match[0].length;
	}
	if (cursor < text.length) tokens.push({ text: text.slice(cursor) });
	if (!highlight) return tokens;

	return tokens.flatMap((token) => {
		const at = token.text.indexOf(highlight);
		if (at === -1) return [token];
		return [
			{ ...token, text: token.text.slice(0, at) },
			{ ...token, text: highlight, marked: true },
			{ ...token, text: token.text.slice(at + highlight.length) }
		].filter((part) => part.text);
	});
}

/**
 * Turns the plain text in articles.json into blocks.
 * Blank lines separate paragraphs, a line of dashes is a section break,
 * "1. " lines make a list, and **bold** and _italic_ work inside paragraphs.
 */
export function parseBody(article: Article): Block[] {
	return article.body
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part): Block => {
			if (/^[—–-]+$/.test(part)) return { type: 'break' };

			const salutation = part.match(/^\*\*([^*]+)\*\*$/);
			if (salutation) return { type: 'salutation', text: salutation[1] };

			if (/^(\*_|_\*)/.test(part)) {
				return { type: 'note', text: part.replace(/^[*_\s]+|[*_\s]+$/g, '') };
			}

			const lines = part.split('\n');
			if (lines.length > 1 && lines.every((line) => /^\d+\.\s/.test(line.trim()))) {
				return {
					type: 'list',
					items: lines.map((line) =>
						parseInline(line.trim().replace(/^\d+\.\s+/, ''), article.highlight)
					)
				};
			}

			return { type: 'paragraph', inline: parseInline(part, article.highlight) };
		});
}
