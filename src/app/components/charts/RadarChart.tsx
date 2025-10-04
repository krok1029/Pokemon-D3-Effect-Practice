"use client";
import * as d3 from 'd3';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/app/components/ui/tooltip';
import { validateRadarE, maxFrom, pointsFor, ticksFor, type Point } from './utils/radar';

export type RadarChartProps = {
  labels: string[];
  values: number[]; // same length as labels
  maxValue?: number; // default auto from values
  size?: { width: number; height: number };
  levels?: number; // grid rings
  className?: string;
};

export default function RadarChart({
  labels,
  values,
  maxValue,
  size = { width: 420, height: 320 },
  levels = 5,
  className,
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Tooltip state (throttled with rAF)
  const [tipOpen, setTipOpen] = useState(false);
  const [tipText, setTipText] = useState('');
  const [tipPos, setTipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const pendingTipRef = useRef<{ text: string; x: number; y: number } | null>(null);

  const commitTip = useCallback(() => {
    if (!pendingTipRef.current) return;
    const { text, x, y } = pendingTipRef.current;
    setTipText(text);
    setTipPos({ x, y });
    setTipOpen(true);
    pendingTipRef.current = null;
    rafIdRef.current = null;
  }, []);

  type MouseLike = Pick<MouseEvent, 'clientX' | 'clientY'>;
  const scheduleTip = useCallback((text: string, e: MouseLike) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    pendingTipRef.current = {
      text,
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top + 10,
    };
    if (rafIdRef.current == null) {
      rafIdRef.current = requestAnimationFrame(commitTip);
    }
  }, [commitTip]);

  const hideTip = useCallback(() => {
    setTipOpen(false);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;
    const ok = validateRadarE(labels, values);
    if (ok._tag === 'Left') return;
    const { n } = ok.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 28;
    const w = size.width;
    const h = size.height;
    const r = Math.min(w, h) / 2 - margin;

    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('height', '100%');

    const g = svg.append('g').attr('transform', `translate(${w / 2}, ${h / 2})`);

    const max = maxFrom(values, maxValue);
    const scale = d3.scaleLinear().domain([0, max]).range([0, r]);

    // Grid circles
    for (let i = 1; i <= levels; i++) {
      g.append('circle')
        .attr('r', (r * i) / levels)
        .attr('fill', 'none')
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.15);
    }

    // Ring tick labels
    const tickVals = ticksFor(max, levels);
    g.selectAll('.grid-tick')
      .data(tickVals)
      .enter()
      .append('text')
      .attr('class', 'grid-tick')
      .attr('y', (d) => -scale(d))
      .attr('dy', -2)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.6)
      .text((d) => d3.format('.0f')(d));

    // Axes and labels
    const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2; // start top
    const axes = g.append('g').attr('class', 'axes');

    labels.forEach((label, i) => {
      const a = angle(i);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;

      axes
        .append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', x).attr('y2', y)
        .attr('stroke', 'currentColor')
        .attr('stroke-opacity', 0.25);

      const tx = Math.cos(a) * (r + 12);
      const ty = Math.sin(a) * (r + 12);
      axes
        .append('text')
        .attr('x', tx).attr('y', ty)
        .attr(
          'text-anchor',
          Math.abs(Math.cos(a)) < 0.15 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end'
        )
        .attr(
          'dominant-baseline',
          Math.abs(Math.sin(a)) < 0.15 ? 'middle' : Math.sin(a) > 0 ? 'hanging' : 'auto'
        )
        .attr('font-size', 12)
        .attr('fill', 'currentColor')
        .text(label);
    });

    // Data polygon
    type DataPoint = { p: Point; i: number };
    const points: Point[] = pointsFor(values, r, max);

    const line = d3
      .line<Point>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.12)
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2);

    // Data points + tooltips
    const baseR = 5;
    const hoverR = 8;

    g
      .selectAll<SVGCircleElement, DataPoint>('circle.data-point')
      .data(points.map((p, i) => ({ p, i })))
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('r', baseR)
      .attr('cx', (d) => d.p.x)
      .attr('cy', (d) => d.p.y)
      .attr('fill', 'currentColor')
      .attr('tabindex', 0)
      .on('mouseenter', function (event: MouseEvent, d) {
        scheduleTip(`${labels[d.i]}: ${values[d.i]}`, event);
        d3.select(this).attr('r', hoverR);
      })
      .on('mousemove', function (event: MouseEvent, d) {
        scheduleTip(`${labels[d.i]}: ${values[d.i]}`, event);
      })
      .on('mouseleave', function () {
        hideTip();
        d3.select(this).attr('r', baseR);
      })
      .on('focus', function (_event: FocusEvent, d) {
        const fake = { clientX: w / 2, clientY: h / 2 };
        scheduleTip(`${labels[d.i]}: ${values[d.i]}`, fake);
        d3.select(this).attr('r', hoverR);
      })
      .on('blur', function () {
        hideTip();
        d3.select(this).attr('r', baseR);
      });

    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      pendingTipRef.current = null;
    };
  }, [labels, values, maxValue, size.width, size.height, levels, scheduleTip, hideTip, commitTip]);

  return (
    <div ref={wrapRef} className={["relative text-emerald-400", className].filter(Boolean).join(" ") }>
      <svg ref={svgRef} role="img" aria-label="Radar chart" />
      <TooltipProvider>
        <Tooltip open={tipOpen} onOpenChange={(o) => setTipOpen(o)}>
          <TooltipTrigger asChild>
            <div
              style={{ left: tipPos.x, top: tipPos.y }}
              className="pointer-events-none absolute h-0.5 w-0.5"
            />
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>{tipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
