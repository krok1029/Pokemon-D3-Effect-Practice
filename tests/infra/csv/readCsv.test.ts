import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readCsvFile } from '@/infra/csv/readCsv';

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

const fsModule = await import('node:fs/promises');
const readFileMock = fsModule.default.readFile as unknown as ReturnType<typeof vi.fn>;

describe('readCsvFile', () => {
  beforeEach(() => {
    readFileMock.mockReset();
  });

  it('reads and parses CSV content with headers and trimming', async () => {
    const csv = 'Name,HP,Legendary\n Pikachu ,35,false\n';
    readFileMock.mockResolvedValue(csv);

    const records = await readCsvFile('/path/to/data.csv');

    expect(readFileMock).toHaveBeenCalledWith('/path/to/data.csv', 'utf8');
    expect(records).toEqual([{ Name: 'Pikachu', HP: '35', Legendary: 'false' }]);
  });

  it('removes a leading UTF-8 BOM without changing quoted field values', async () => {
    const csv = '\uFEFFNumber,Name,Notes\n025," Pikachu ","keeps \uFEFF inside"\n';
    readFileMock.mockResolvedValue(csv);

    const records = await readCsvFile('/path/to/bom.csv');

    expect(records).toEqual([{ Number: '025', Name: ' Pikachu ', Notes: 'keeps \uFEFF inside' }]);
  });
});
