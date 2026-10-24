import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('csv', () => {
	it('parses quoted fields, escaped quotes and CRLF', () => {
		expect(parseCsv('a,"b,c","say ""hi"""\r\nd,,e\r\n')).toEqual([
			['a', 'b,c', 'say "hi"'],
			['d', '', 'e']
		]);
	});

	it('accepts a missing final newline', () => {
		expect(parseCsv('a,b\nc,d')).toEqual([
			['a', 'b'],
			['c', 'd']
		]);
	});

	it('round-trips', () => {
		const rows = [
			['id', 'nom'],
			['1', 'O"Neil, Jr'],
			['2', 'Dupont']
		];
		expect(parseCsv(toCsv(rows))).toEqual(rows);
		expect(toCsv(rows)).toBe('id,nom\n1,"O""Neil, Jr"\n2,Dupont\n');
	});

	it('rejects an unterminated quote', () => {
		expect(() => parseCsv('a,"b\n')).toThrow(/unterminated/);
	});
});
