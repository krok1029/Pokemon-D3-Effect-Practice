'use client';

import * as d3 from 'd3';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { AverageStatKey } from '@/core/application/dto/AverageStatsDto';

import type { TypeAverageStatsViewModel } from '../view-models/typeAverageStatsViewModel';

type TypeAverageStatsComparisonProps = {
  viewModel: TypeAverageStatsViewModel;
};

type ChartEntry = {
  type: string;
  iconPath: string;
  value: number;
  valueLabel: string;
  countLabel: string;
};

type TypeAverageStatsBarChartProps = {
  data: ChartEntry[];
  statLabel: string;
};

const DEFAULT_WIDTH = 760;
const DEFAULT_HEIGHT = 480;
const MIN_BAR_WIDTH = 64;
const MARGIN = { top: 32, right: 48, bottom: 140, left: 72 };

export function TypeAverageStatsComparison({ viewModel }: TypeAverageStatsComparisonProps) {
  const hasOptions = viewModel.statOptions.length > 0;

  const [selectedStatKey, setSelectedStatKey] = useState<AverageStatKey>(
    (hasOptions ? viewModel.statOptions[0].key : 'attack') as AverageStatKey,
  );

  useEffect(() => {
    if (!hasOptions) {
      return;
    }
    const exists = viewModel.statOptions.some((option) => option.key === selectedStatKey);
    if (!exists) {
      setSelectedStatKey(viewModel.statOptions[0].key);
    }
  }, [hasOptions, selectedStatKey, viewModel.statOptions]);

  if (!hasOptions) {
    return (
      <p className="text-sm text-muted-foreground">目前沒有符合條件的屬性資料可供比較。</p>
    );
  }

  const currentStat = viewModel.statOptions.find((option) => option.key === selectedStatKey);
  const currentStatLabel = currentStat?.label ?? '';

  const chartEntries = useMemo<ChartEntry[]>(() => {
    return viewModel.types
      .map<ChartEntry | null>((typeEntry) => {
        const stat = typeEntry.stats.find((entry) => entry.key === selectedStatKey);
        if (!stat) {
          return null;
        }
        return {
          type: typeEntry.type,
          iconPath: typeEntry.iconPath,
          value: stat.value,
          valueLabel: stat.valueLabel,
          countLabel: typeEntry.countLabel,
        };
      })
      .filter((entry): entry is ChartEntry => entry !== null)
      .sort((a, b) => b.value - a.value);
  }, [selectedStatKey, viewModel.types]);

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatKey(event.target.value as AverageStatKey);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">比較能力</p>
          <p className="text-xs text-muted-foreground">
            依照選擇的能力值，由高至低排列各屬性的平均表現。
          </p>
        </div>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-56"
          value={selectedStatKey}
          onChange={handleSelectChange}
        >
          {viewModel.statOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {chartEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">目前沒有符合條件的資料。</p>
      ) : (
        <div className="space-y-2">
          <TypeAverageStatsBarChart data={chartEntries} statLabel={currentStatLabel} />
          <p className="text-xs text-muted-foreground">
            每根直條代表該屬性在 {currentStatLabel} 的平均值，括號中顯示參與計算的寶可夢數量。
          </p>
        </div>
      )}
    </div>
  );
}

function TypeAverageStatsBarChart({ data, statLabel }: TypeAverageStatsBarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    const root = d3.select(svgElement);
    root.selectAll('*').remove();

    if (data.length === 0) {
      return;
    }

    const documentStyles = window.getComputedStyle(document.documentElement);
    const parseColor = (variable: string, fallback: string) => {
      const raw = documentStyles.getPropertyValue(variable).trim();
      const parsed = d3.color(raw);
      return parsed ?? d3.color(fallback);
    };

    const primaryColor = parseColor('--primary', '#2563eb')!;
    const borderColor = parseColor('--border', '#e4e4e7')!;
    const mutedColor = parseColor('--muted-foreground', '#6b7280')!;
    const foregroundColor = parseColor('--foreground', '#0f172a')!;

    const width = Math.max(
      DEFAULT_WIDTH,
      data.length * MIN_BAR_WIDTH + MARGIN.left + MARGIN.right,
    );
    const height = DEFAULT_HEIGHT;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const maxValue = d3.max(data, (entry) => entry.value) ?? 0;

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue || 1])
      .nice()
      .range([innerHeight, 0]);

    const xScale = d3
      .scaleBand<string>()
      .domain(data.map((entry) => entry.type))
      .range([0, innerWidth])
      .padding(0.25);

    const svg = root
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('role', 'img')
      .attr('aria-label', `${statLabel} 平均值直條圖`);

    const chartGroup = svg.append('g').attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

    const gridLines = chartGroup.append('g').attr('class', 'grid');

    gridLines
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (tick) => yScale(tick))
      .attr('y2', (tick) => yScale(tick))
      .attr('stroke', borderColor.copy({ opacity: 0.4 }).formatRgb())
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '4 4');

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSizeOuter(0);
    const yAxisGroup = chartGroup.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup.selectAll('text').attr('fill', mutedColor.formatRgb()).attr('font-size', 12);
    yAxisGroup.selectAll('path').attr('stroke', borderColor.formatRgb()).attr('stroke-width', 0.5);

    const barsGroup = chartGroup.append('g').attr('class', 'bars');

    const barGroups = barsGroup
      .selectAll('g')
      .data(data)
      .join('g')
      .attr('transform', (entry) => `translate(${xScale(entry.type) ?? 0}, 0)`);

    barGroups
      .append('rect')
      .attr('x', 0)
      .attr('y', (entry) => yScale(entry.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (entry) => innerHeight - yScale(entry.value))
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', primaryColor.copy({ opacity: 0.85 }).formatRgb())
      .append('title')
      .text(
        (entry) =>
          `${entry.type}：${entry.valueLabel}（${statLabel}，${entry.countLabel} 隻寶可夢）`,
      );

    barGroups
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', (entry) => yScale(entry.value) - 8)
      .attr('fill', foregroundColor.formatRgb())
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'auto')
      .text((entry) => entry.valueLabel);

    const xAxisGroup = chartGroup
      .append('g')
      .attr('class', 'type-axis')
      .attr('transform', `translate(0, ${innerHeight})`);

    const tickGroups = xAxisGroup
      .selectAll('g')
      .data(data)
      .join('g')
      .attr(
        'transform',
        (entry) => `translate(${(xScale(entry.type) ?? 0) + xScale.bandwidth() / 2}, 0)`,
      );

    const ICON_SIZE = 36;

    tickGroups
      .append('image')
      .attr('href', (entry) => entry.iconPath)
      .attr('width', ICON_SIZE)
      .attr('height', ICON_SIZE)
      .attr('x', -ICON_SIZE / 2)
      .attr('y', 16)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    tickGroups
      .append('text')
      .attr('y', 16 + ICON_SIZE + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', foregroundColor.formatRgb())
      .attr('font-size', 12)
      .attr('font-weight', 500)
      .text((entry) => entry.type);

    tickGroups
      .append('text')
      .attr('y', 16 + ICON_SIZE + 32)
      .attr('text-anchor', 'middle')
      .attr('fill', mutedColor.formatRgb())
      .attr('font-size', 11)
      .text((entry) => `樣本：${entry.countLabel}`);

    return () => {
      root.selectAll('*').remove();
    };
  }, [data, statLabel]);

  const dynamicWidth = Math.max(
    DEFAULT_WIDTH,
    data.length * MIN_BAR_WIDTH + MARGIN.left + MARGIN.right,
  );
  const dynamicHeight = DEFAULT_HEIGHT;

  return (
    <div className="relative w-full overflow-auto">
      <svg
        ref={svgRef}
        className="h-full"
        style={{ minWidth: `${dynamicWidth}px`, height: dynamicHeight }}
      />
    </div>
  );
}
