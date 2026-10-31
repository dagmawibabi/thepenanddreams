// Server-only, so the essays reach the browser one page at a time instead of all at once.
import asideData from '../content/asides.json';
import data from '../content/articles.json';
import {
	excerpt,
	parseBody,
	readingMinutes,
	type Article,
	type Aside,
	type DayCard,
	type DayList
} from '../content.ts';

const CHALLENGE_LENGTH = 30;
const ONE_DAY = 86_400_000;

export const articles: Article[] = data.articles;

export const articleFor = (day: number) => articles.find((article) => article.day === day);

const dayCount = Math.max(
	CHALLENGE_LENGTH,
	data.prompts.length,
	...articles.map((article) => article.day)
);

/** Every day of the challenge, whether or not it has been written yet. */
export const dayCards: DayCard[] = Array.from({ length: dayCount }, (_, index) => {
	const day = index + 1;
	const article = articleFor(day);
	const prompt = data.prompts.find((entry) => entry.day === day)?.prompt;
	return {
		day,
		prompt: prompt ?? article?.prompt ?? `Day ${day}`,
		title: article?.title,
		line: article && excerpt(article),
		time: article?.time,
		minutes: article && readingMinutes(article),
		themes: article?.themes
	};
});

export const asides: Aside[] = asideData.map(({ day, text }) => ({ day, text }));

/** A day whose essay is a numbered list, as plain lines. */
export function dayList(day: number): DayList | undefined {
	const article = articleFor(day);
	const list = article && parseBody(article).find((block) => block.type === 'list');
	if (!article || !list || list.type !== 'list') return undefined;
	const items = list.items.map((parts) =>
		parts
			.map((part) => part.text)
			.join('')
			.trim()
	);
	const start = items.findIndex((item) => article.highlight && item.includes(article.highlight));
	return { day, title: article.title, items, start: Math.max(0, start) };
}

/** True while every day so far was posted on the calendar day after the one before it. */
export const noDayMissed = articles.every((article, index) => {
	if (index === 0) return true;
	const previous = articles[index - 1];
	const gap = Date.parse(article.date) - Date.parse(previous.date);
	return article.day === previous.day + 1 && gap === ONE_DAY;
});
