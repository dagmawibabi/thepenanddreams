import { asides, dayCards, dayList, noDayMissed } from '#lib/server/articles.ts';
import type { PageServerLoad } from './$types';

const FACTS_DAY = 13;
const HAPPY_DAY = 29;

export const load: PageServerLoad = () => ({
	days: dayCards,
	noDayMissed,
	asides,
	facts: dayList(FACTS_DAY),
	happy: dayList(HAPPY_DAY)
});
