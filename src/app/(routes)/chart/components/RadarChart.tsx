'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';

import type { AverageStatsViewModel } from '../view-models/averageStatsViewModel';

type RadarChartProps = {
  stats: AverageStatsViewModel['stats'];
  size?: number;
  levels?: number;
};

type RadarPoint = {
  angle: number;
  radius: number;
  label: string;
  value: number;
  x: number;
  y: number;
};

const DEFAULT_SIZE = 360;
const DEFAULT_LEVELS = 5;

export function RadarChart({
  stats,
  size = DEFAULT_SIZE,
  levels = DEFAULT_LEVELS,
}: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const numericStats = useMemo(
    () =>
      stats
        .map((stat) => ({
          label: stat.label,
          value: Number.parseFloat(stat.value),
        }))
        .filter((stat) => Number.isFinite(stat.value)),
    [stats],
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || numericStats.length === 0) {
      return;
    }

    const rootElement = svgRef.current;
    const rootSelection = d3.select(rootElement);
    const containerSelection = d3.select(containerRef.current);

    rootSelection.selectAll('*').remove();
    containerSelection.selectAll('.radar-tooltip').remove();

    const documentStyles = window.getComputedStyle(document.documentElement);
    const parseColor = (variable: string, fallback: string) => {
      const raw = documentStyles.getPropertyValue(variable).trim();
      const parsed = d3.color(raw);
      return parsed ?? d3.color(fallback);
    };

    const primaryColor = parseColor('--primary', '#2563eb')!;
    const borderColor = parseColor('--border', '#e4e4e7')!;
    const mutedForegroundColor = parseColor('--muted-foreground', '#6b7280')!;

    const fillColor = primaryColor.copy({ opacity: 0.15 }).formatRgb();
    const strokeColor = primaryColor.formatRgb();
    const gridColor = borderColor.copy({ opacity: 0.7 }).formatRgb();
    const axisLabelColor = mutedForegroundColor.formatRgb();

    const dimension = size;
    const viewBoxMargin = 60;
    const radius = dimension / 2 - viewBoxMargin;
    const angleSlice = (Math.PI * 2) / numericStats.length;
    const maximumValue = d3.max(numericStats, (d) => d.value) ?? 1;

    const radialScale = d3
      .scaleLinear()
      .domain([0, maximumValue || 1])
      .range([0, radius]);

    const svg = rootSelection
      .attr('viewBox', `0 0 ${dimension} ${dimension}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label', 'Average Pokemon stats radar chart');

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${dimension / 2}, ${dimension / 2})`);

    const angleForIndex = (index: number) => angleSlice * index - Math.PI / 2;

    const buildLevelPoints = (level: number) =>
      numericStats.map((_, index) => {
        const angle = angleForIndex(index);
        const levelRadius = (radius * level) / levels;
        return [levelRadius * Math.cos(angle), levelRadius * Math.sin(angle)] as [number, number];
      });

    const gridGroup = chartGroup.append('g').attr('class', 'radar-grid');
    const levelLine = d3
      .line<[number, number]>()
      .x((point) => point[0])
      .y((point) => point[1])
      .curve(d3.curveLinearClosed);

    for (let level = 1; level <= levels; level += 1) {
      gridGroup
        .append('path')
        .attr('d', levelLine(buildLevelPoints(level)))
        .attr('fill', 'none')
        .attr('stroke', gridColor)
        .attr('stroke-width', 0.5);
    }

    const axisGroup = chartGroup.append('g').attr('class', 'radar-axes');

    axisGroup
      .selectAll('.axis')
      .data(numericStats)
      .join('g')
      .attr('class', 'axis')
      .each(function axisFactory(axisData, index) {
        const angle = angleForIndex(index);
        const axisSelection = d3.select(this);
        const axisX = radius * Math.cos(angle);
        const axisY = radius * Math.sin(angle);

        axisSelection
          .append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', axisX)
          .attr('y2', axisY)
          .attr('stroke', gridColor)
          .attr('stroke-width', 0.5);

        const labelOffset = 5;
        const labelX = (radius + labelOffset) * Math.cos(angle);
        const labelY = (radius + labelOffset) * Math.sin(angle);

        axisSelection
          .append('text')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', Math.abs(labelX) < 4 ? 'middle' : labelX > 0 ? 'start' : 'end')
          .attr('dominant-baseline', labelY > 8 ? 'hanging' : labelY < -8 ? 'baseline' : 'middle')
          .attr('fill', axisLabelColor)
          .attr('font-size', 12)
          .text(axisData.label);
      });

    const radarPoints: RadarPoint[] = numericStats.map((stat, index) => {
      const angle = angleForIndex(index);
      const radiusValue = radialScale(stat.value);
      return {
        label: stat.label,
        value: stat.value,
        angle,
        radius: radiusValue,
        x: radiusValue * Math.cos(angle),
        y: radiusValue * Math.sin(angle),
      };
    });

    const radarLine = d3
      .line<RadarPoint>()
      .x((point) => point.x)
      .y((point) => point.y)
      .curve(d3.curveLinearClosed);

    chartGroup
      .append('path')
      .datum(radarPoints)
      .attr('d', radarLine)
      .attr('fill', fillColor)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2);

    const pointsSelection = chartGroup
      .append('g')
      .attr('class', 'radar-points')
      .selectAll<SVGCircleElement, RadarPoint>('circle')
      .data(radarPoints)
      .join('circle')
      .attr('cx', (point) => point.x)
      .attr('cy', (point) => point.y)
      .attr('r', 4)
      .attr('fill', strokeColor);

    pointsSelection.each(function appendTitle(point) {
      d3.select(this)
        .append('title')
        .text(`${point.label}: ${point.value.toFixed(1)}`);
    });

    const tooltip = containerSelection
      .append('div')
      .attr(
        'class',
        'radar-tooltip pointer-events-none absolute z-10 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground shadow',
      )
      .style('display', 'none')
      .style('opacity', '0')
      .style('transform', 'translate(-50%, calc(-100% - 10px))');

    const updateTooltipPosition = (point: RadarPoint) => {
      const svgRect = svgRef.current!.getBoundingClientRect();
      const containerRect = containerRef.current!.getBoundingClientRect();
      const scaleX = svgRect.width / dimension;
      const scaleY = svgRect.height / dimension;

      const centerX = dimension / 2;
      const centerY = dimension / 2;

      const pointX = (centerX + point.x) * scaleX;
      const pointY = (centerY + point.y) * scaleY;

      const offsetX = pointX + (svgRect.left - containerRect.left);
      const offsetY = pointY + (svgRect.top - containerRect.top);

      tooltip.style('left', `${offsetX}px`).style('top', `${offsetY}px`);
    };

    pointsSelection
      .on('mouseenter', (_, point) => {
        updateTooltipPosition(point);
        tooltip
          .style('display', 'block')
          .style('opacity', '1')
          .text(`${point.label}: ${point.value.toFixed(1)}`);
      })
      .on('mousemove', (_, point) => {
        updateTooltipPosition(point);
      })
      .on('mouseleave', () => {
        tooltip.style('display', 'none').style('opacity', '0');
      });
  }, [numericStats, levels, size]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  );
}
