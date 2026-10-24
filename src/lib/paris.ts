// Europe/Paris time helpers: business logic never relies on the machine's local time zone.

const TIME_ZONE = 'Europe/Paris';

const formatter = new Intl.DateTimeFormat('en-US', {
	timeZone: TIME_ZONE,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
});

function parisParts(ms: number) {
	const parts = Object.fromEntries(formatter.formatToParts(ms).map((p) => [p.type, Number(p.value)]));
	return parts as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
}

/** Offset of Paris from UTC at instant `ms`, in milliseconds. */
function parisOffset(ms: number): number {
	const p = parisParts(ms);
	return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

/** Parses `YYYY-MM-DD` strictly; throws on anything else. */
export function parseDate(date: string): [year: number, month: number, day: number] {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
	if (!match) throw new Error(`invalid date "${date}", expected YYYY-MM-DD`);
	const [year, month, day] = match.slice(1).map(Number);
	const check = new Date(Date.UTC(year, month - 1, day));
	if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error(`invalid date "${date}"`);
	return [year, month, day];
}

/** Unix time (seconds) of `date` at `time` (`HH:MM:SS`) Paris time. Not meant for times inside a DST gap. */
export function parisToUnix(date: string, time: string): number {
	const [year, month, day] = parseDate(date);
	const [hour, minute, second] = time.split(':').map(Number);
	const naive = Date.UTC(year, month - 1, day, hour, minute, second);
	// Second pass corrects the offset when the first guess lands on the other side of a DST switch.
	const guess = naive - parisOffset(naive);
	return (naive - parisOffset(guess)) / 1000;
}

/** The Paris calendar date (`YYYY-MM-DD`) at instant `ms`. */
export function parisDate(ms: number): string {
	const p = parisParts(ms);
	return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
