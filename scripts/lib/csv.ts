// Minimal RFC 4180 CSV reader/writer (quoted fields, "" escapes, LF or CRLF line endings).

export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	let fieldStart = true;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c !== '"') field += c;
			else if (text[i + 1] === '"') (field += '"'), i++;
			else quoted = false;
		} else if (c === '"' && fieldStart) {
			quoted = true;
		} else if (c === ',') {
			row.push(field);
			field = '';
			fieldStart = true;
			continue;
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
			fieldStart = true;
			continue;
		} else {
			field += c;
		}
		fieldStart = false;
	}
	if (quoted) throw new Error('csv: unterminated quoted field');
	if (field !== '' || row.length > 0) rows.push([...row, field]);
	return rows;
}

const quote = (field: string) => (/[",\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field);

/** Serializes rows with LF line endings and a final newline. */
export function toCsv(rows: string[][]): string {
	return rows.map((row) => row.map(quote).join(',') + '\n').join('');
}
