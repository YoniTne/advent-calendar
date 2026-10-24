import { describe, expect, it } from 'vitest';
import { prepareParticipants } from './prepare';

const HEADER = 'Horodateur,Prénom,Nom,E-mail\n';

describe('prepareParticipants', () => {
	it('numbers participants in registration order and cleans fields', () => {
		const out = prepareParticipants(
			'﻿' +
				HEADER +
				'02/11/2026 10:00:00,  Ada ,Love  lace,ada@example.test\r\n' +
				'01/11/2026 09:30:00,Alan,Turing,alan@example.test\r\n' +
				'01/11/2026 09:30:00,Grace,Hopper,grace@example.test\r\n'
		);
		expect(out).toBe(
			'id,prenom,nom,email\n' +
				'1,Alan,Turing,alan@example.test\n' +
				'2,Grace,Hopper,grace@example.test\n' +
				'3,Ada,Love lace,ada@example.test\n'
		);
	});

	it('normalizes accents to NFC', () => {
		const out = prepareParticipants(HEADER + '01/11/2026 09:30:00,Léa,D,lea@example.test\n');
		expect(out).toContain('1,Léa,D,');
	});

	it('ignores blank rows', () => {
		expect(prepareParticipants(HEADER + ',,,\n01/11/2026 09:30:00,A,B,a@example.test\n')).toBe(
			'id,prenom,nom,email\n1,A,B,a@example.test\n'
		);
	});

	it('fails on duplicate e-mails, case-insensitively, with line numbers', () => {
		const text =
			HEADER +
			'01/11/2026 09:30:00,A,B,a@example.test\n' +
			'01/11/2026 09:31:00,C,D,c@example.test\n' +
			'01/11/2026 09:32:00,A,B,A@Example.test\n';
		expect(() => prepareParticipants(text)).toThrow('duplicate e-mails on lines: 2 & 4');
	});

	it('fails on an empty field or a bad timestamp', () => {
		expect(() => prepareParticipants(HEADER + '01/11/2026 09:30:00,A,,a@example.test\n')).toThrow('line 2: empty field');
		expect(() => prepareParticipants(HEADER + '2026-11-01 09:30,A,B,a@example.test\n')).toThrow(/timestamp/);
	});

	it('fails on an unexpected header', () => {
		expect(() => prepareParticipants('Timestamp,First,Last,Email\n')).toThrow(/header/);
	});
});
