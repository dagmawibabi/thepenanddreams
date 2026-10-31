import { error } from '@sveltejs/kit';
import { formatDate, parseBody, readingMinutes } from '#lib/content.ts';
import { articleFor, articles, dayCards } from '#lib/server/articles.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () =>
	articles.map((article) => ({ day: String(article.day) }));

const neighbour = (day: number) => {
	const article = articleFor(day);
	return article && { day: article.day, title: article.title };
};

export const load: PageServerLoad = ({ params }) => {
	const article = articleFor(Number(params.day));
	if (!article) error(404, 'This page hasn’t been written yet.');

	return {
		day: article.day,
		title: article.title,
		prompt: article.prompt,
		date: formatDate(article.date),
		minutes: readingMinutes(article),
		blocks: parseBody(article),
		previous: neighbour(article.day - 1),
		next: neighbour(article.day + 1),
		ruler: dayCards.map(({ day, title }) => ({ day, title }))
	};
};
