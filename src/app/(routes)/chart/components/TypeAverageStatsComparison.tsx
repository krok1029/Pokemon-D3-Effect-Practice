'use client';

import * as d3 from 'd3';
import Image from 'next/image';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

import type { AverageStatKey } from '@/core/application/dto/AverageStatsDto';

import type { TypeAverageStatsViewModel } from '../view-models/typeAverageStatsViewModel';

type TypeAverageStatsComparisonProps = {
  viewModel: TypeAverageStatsViewModel;
};

type ChartEntry = {
  type: string;
  iconPath: string;
  typeLabel: string;
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
          typeLabel: typeEntry.typeLabel,
          value: stat.value,
          valueLabel: stat.valueLabel,
          countLabel: typeEntry.countLabel,
        };
      })
      .filter((entry): entry is ChartEntry => entry !== null)
      .sort((a, b) => b.value - a.value);
  }, [selectedStatKey, viewModel.types]);

  if (!hasOptions) {
    return <p className="text-muted-foreground text-sm">目前沒有符合條件的屬性資料可供比較。</p>;
  }

  const currentStat = viewModel.statOptions.find((option) => option.key === selectedStatKey);
  const currentStatLabel = currentStat?.label ?? '';

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatKey(event.target.value as AverageStatKey);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">比較能力</p>
            <p className="text-muted-foreground text-xs">
              依照選擇的能力值，由高至低排列各屬性的平均表現。
            </p>
          </div>
          <select
            className="border-border bg-background text-foreground focus-visible:outline-primary w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline focus-visible:outline-offset-2 sm:w-56"
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
          <p className="text-muted-foreground text-sm">目前沒有符合條件的資料。</p>
        ) : (
          <div className="space-y-2">
            <TypeAverageStatsBarChart data={chartEntries} statLabel={currentStatLabel} />
            <p className="text-muted-foreground text-xs">
              每根直條代表該屬性在 {currentStatLabel} 的平均值，括號中顯示參與計算的寶可夢數量。
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function TypeAverageStatsBarChart({ data, statLabel }: TypeAverageStatsBarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => {
    const width = Math.max(DEFAULT_WIDTH, data.length * MIN_BAR_WIDTH + MARGIN.left + MARGIN.right);
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

    const iconCenters = data.map((entry) => {
      const band = xScale(entry.type) ?? 0;
      return MARGIN.left + band + xScale.bandwidth() / 2;
    });

    return {
      width,
      height,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
      iconCenters,
    };
  }, [data]);

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

    const { width, height, innerWidth, innerHeight, xScale, yScale } = layout;

    const svg = root
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('role', 'img')
      .attr('aria-label', `${statLabel} 平均值直條圖`);

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

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

    const yAxis = d3.axisLeft(yScale).ticks(5).tickSizeOuter(0);
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

    chartGroup
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', borderColor.copy({ opacity: 0.5 }).formatRgb())
      .attr('stroke-width', 1);

    return () => {
      root.selectAll('*').remove();
    };
  }, [data, layout, statLabel]);

  return (
    <div className="relative w-full overflow-auto">
      <svg
        ref={svgRef}
        className="h-full"
        style={{ minWidth: `${layout.width}px`, height: layout.height }}
      />
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-full"
        style={{ minWidth: `${layout.width}px`, height: layout.height }}
      >
        {data.map((entry, index) => (
          <div
            key={entry.type}
            className="pointer-events-auto absolute flex translate-x-[-50%] flex-col items-center gap-2"
            style={{
              left: `${layout.iconCenters[index] ?? 0}px`,
              bottom: `${MARGIN.bottom / 2}px`,
            }}
          >
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="border-border bg-card flex h-12 w-12 items-center justify-center rounded-full border shadow">
                  <Image
                    src={entry.iconPath}
                    alt={`${entry.typeLabel}屬性圖示`}
                    width={36}
                    height={36}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">{entry.typeLabel}屬性</TooltipContent>
            </Tooltip>
            <span className="text-foreground text-center text-sm font-medium">
              {entry.typeLabel}
            </span>
            <span className="text-muted-foreground text-center text-xs">
              樣本：{entry.countLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
