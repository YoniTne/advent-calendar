const longDate = new Intl.DateTimeFormat('fr-FR', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	timeZone: 'Europe/Paris'
});

/** "jeudi 5 décembre" */
export const formatDay = (ms: number) => longDate.format(ms);
