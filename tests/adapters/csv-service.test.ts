import { describe, it, expect, vi, type Mock } from 'vitest';

import { readCsv, DataLoadError } from '@/adapters/csv/CsvService';

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

const readFileMock = (await import('node:fs/promises')).default.readFile as Mock;

describe('CsvService', () => {
  it('parses CSV rows when read succeeds', async () => {
    readFileMock.mockResolvedValueOnce('Name,Number\nPikachu,25');
    const rows = await readCsv('dummy.csv');
    expect(rows).toEqual([{ Name: 'Pikachu', Number: '25' }]);
  });

  it('wraps read errors in DataLoadError', async () => {
    readFileMock.mockRejectedValueOnce(new Error('boom'));
    await expect(readCsv('missing.csv')).rejects.toBeInstanceOf(DataLoadError);
  });
});
