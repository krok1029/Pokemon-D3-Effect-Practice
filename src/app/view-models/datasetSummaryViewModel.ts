export type DatasetSummaryViewModel = {
  sampleCountLabel: string;
  speciesCountLabel: string;
  numberRangeLabel: string;
};

export function buildDatasetSummaryViewModel(
  entries: readonly { id: number }[],
): DatasetSummaryViewModel {
  const ids = [...new Set(entries.map((entry) => entry.id))].sort((a, b) => a - b);

  return {
    sampleCountLabel: entries.length.toLocaleString('zh-TW'),
    speciesCountLabel: ids.length.toLocaleString('zh-TW'),
    numberRangeLabel: ids.length > 0 ? `#${ids[0]}–#${ids[ids.length - 1]}` : '目前沒有資料',
  };
}
