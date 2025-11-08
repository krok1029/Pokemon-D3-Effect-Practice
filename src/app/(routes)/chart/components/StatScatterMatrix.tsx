'use client';

import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AverageStatKey } from '@/core/application/dto/AverageStatsDto';

import {
  PokemonScatterPointViewModel,
  PokemonStatsMatrixViewModel,
} from '../view-models/pokemonStatsMatrixViewModel';
import { translateType } from '../view-models/typeAverageStatsViewModel';

type StatScatterMatrixProps = {
  viewModel: PokemonStatsMatrixViewModel;
};

const PLOT_WIDTH = 720;
const PLOT_HEIGHT = 520;
const PLOT_MARGIN = { top: 32, right: 24, bottom: 60, left: 60 };

const sanitizePokemonName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '_');
const buildPokemonSelectionKey = (
  pokemon: Pick<PokemonScatterPointViewModel, 'id' | 'name'>,
) => `${pokemon.id}-${sanitizePokemonName(pokemon.name)}`;

export function StatScatterMatrix({ viewModel }: StatScatterMatrixProps) {
  const statKeys = useMemo(
    () => viewModel.statOptions.map((option) => option.key),
    [viewModel.statOptions],
  );

  const statLabelByKey = useMemo(
    () => new Map(viewModel.statOptions.map((option) => [option.key, option.label])),
    [viewModel.statOptions],
  );

  const defaultXKey = statKeys[1] ?? statKeys[0] ?? 'hp';
  const defaultYKey = statKeys[0] ?? 'hp';

  const [xKey, setXKey] = useState<AverageStatKey>(defaultXKey);
  const [yKey, setYKey] = useState<AverageStatKey>(
    defaultXKey === defaultYKey ? (statKeys[2] ?? defaultYKey) : defaultYKey,
  );
  const [selectedPokemonKeys, setSelectedPokemonKeys] = useState<string[]>([]);

  useEffect(() => {
    const nextX = statKeys[1] ?? statKeys[0] ?? 'hp';
    const nextYCandidate = statKeys[0] ?? 'hp';
    const nextY =
      nextX === nextYCandidate
        ? (statKeys.find((key) => key !== nextX) ?? nextYCandidate)
        : nextYCandidate;

    setXKey(nextX);
    setYKey(nextY);
    setSelectedPokemonKeys([]);
  }, [statKeys]);

  const handleXKeyChange = useCallback(
    (key: AverageStatKey) => {
      if (key === yKey) {
        const fallback = statKeys.find((candidate) => candidate !== key) ?? key;
        setYKey(fallback);
      }
      setXKey(key);
      setSelectedPokemonKeys([]);
    },
    [statKeys, yKey],
  );

  const handleYKeyChange = useCallback(
    (key: AverageStatKey) => {
      if (key === xKey) {
        const fallback = statKeys.find((candidate) => candidate !== key) ?? key;
        setXKey(fallback);
      }
      setYKey(key);
      setSelectedPokemonKeys([]);
    },
    [statKeys, xKey],
  );

  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => {
    const innerWidth = PLOT_WIDTH - PLOT_MARGIN.left - PLOT_MARGIN.right;
    const innerHeight = PLOT_HEIGHT - PLOT_MARGIN.top - PLOT_MARGIN.bottom;

    const xValues = viewModel.pokemons.map((pokemon) => pokemon.stats[xKey]);
    const yValues = viewModel.pokemons.map((pokemon) => pokemon.stats[yKey]);

    const [xMin, xMax] = d3.extent(xValues) as [number, number];
    const [yMin, yMax] = d3.extent(yValues) as [number, number];

    const xPadding = Math.max((xMax - xMin) * 0.05, 1);
    const yPadding = Math.max((yMax - yMin) * 0.05, 1);

    const xScale = d3
      .scaleLinear()
      .domain([xMin - xPadding, xMax + xPadding])
      .range([0, innerWidth]);
    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    return {
      width: PLOT_WIDTH,
      height: PLOT_HEIGHT,
      innerWidth,
      innerHeight,
      xScale,
      yScale,
    };
  }, [viewModel.pokemons, xKey, yKey]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    const selectedSet = new Set(selectedPokemonKeys);

    const root = d3.select(svgElement);
    root.selectAll('*').remove();

    root.attr('viewBox', `0 0 ${layout.width} ${layout.height}`).attr('width', '100%');

    const plot = root
      .append('g')
      .attr('transform', `translate(${PLOT_MARGIN.left}, ${PLOT_MARGIN.top})`);

    const xAxis = d3.axisBottom(layout.xScale).ticks(6).tickSize(-layout.innerHeight);
    const yAxis = d3.axisLeft(layout.yScale).ticks(6).tickSize(-layout.innerWidth);

    plot
      .append('g')
      .attr('transform', `translate(0, ${layout.innerHeight})`)
      .call(xAxis)
      .call((selection) => {
        selection.selectAll('line').attr('stroke', 'var(--border)').attr('stroke-opacity', 0.4);
        selection.selectAll('path').attr('stroke', 'var(--border)');
        selection.selectAll('text').attr('fill', 'var(--muted-foreground)').attr('font-size', 12);
      });

    plot
      .append('g')
      .call(yAxis)
      .call((selection) => {
        selection.selectAll('line').attr('stroke', 'var(--border)').attr('stroke-opacity', 0.4);
        selection.selectAll('path').attr('stroke', 'var(--border)');
        selection.selectAll('text').attr('fill', 'var(--muted-foreground)').attr('font-size', 12);
      });

    plot
      .append('text')
      .attr('x', layout.innerWidth / 2)
      .attr('y', layout.innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--foreground)')
      .attr('font-size', 14)
      .attr('font-weight', 600)
      .text(statLabelByKey.get(xKey) ?? xKey.toUpperCase());

    plot
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(layout.innerHeight / 2))
      .attr('y', -46)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--foreground)')
      .attr('font-size', 14)
      .attr('font-weight', 600)
      .text(statLabelByKey.get(yKey) ?? yKey.toUpperCase());

    plot
      .append('g')
      .attr('class', 'dots')
      .selectAll('circle.dot')
      .data(viewModel.pokemons)
      .join('circle')
      .attr(
        'class',
        (pokemon) =>
          `dot ${pokemon.id}_pokemon_name_${pokemon.name.split(' ').join('_').toLowerCase()}`,
      )
      .attr('cx', (pokemon) => layout.xScale(pokemon.stats[xKey]))
      .attr('cy', (pokemon) => layout.yScale(pokemon.stats[yKey]))
      .attr('r', 4)
      .attr('fill', (pokemon) => pokemon.color)
      .attr('fill-opacity', (pokemon) =>
        selectedSet.size === 0
          ? 0.75
          : selectedSet.has(buildPokemonSelectionKey(pokemon))
            ? 1
            : 0.15,
      )
      .attr('stroke', (pokemon) =>
        selectedSet.has(buildPokemonSelectionKey(pokemon)) ? '#ffffff' : 'transparent',
      )
      .attr('stroke-width', (pokemon) =>
        selectedSet.has(buildPokemonSelectionKey(pokemon)) ? 1.4 : 0,
      )
      .append('title')
      .text((pokemon) => `${pokemon.name}（${translateType(pokemon.primaryType)}）`);

    const brush = d3
      .brush() // 建立 D3 brush 行為
      .extent([
        [0, 0], // brush 左上角
        [layout.innerWidth, layout.innerHeight], // brush 右下角（限制在繪圖區域）
      ])
      .on('end', (event) => {
        const selection = event.selection as [[number, number], [number, number]] | null;
        if (!selection) {
          setSelectedPokemonKeys([]);
          return;
        }

        const [[x0, y0], [x1, y1]] = selection; // 使用者選框的起點與終點（像素）
        const clampedX = [
          Math.max(0, Math.min(layout.innerWidth, Math.min(x0, x1))), // clamp X 最小值
          Math.max(0, Math.min(layout.innerWidth, Math.max(x0, x1))), // clamp X 最大值
        ];
        const clampedY = [
          Math.max(0, Math.min(layout.innerHeight, Math.min(y0, y1))), // clamp Y 最小值
          Math.max(0, Math.min(layout.innerHeight, Math.max(y0, y1))), // clamp Y 最大值
        ];

        const dataXMin = Math.min(
          layout.xScale.invert(clampedX[0]),
          layout.xScale.invert(clampedX[1]),
        );
        const dataXMax = Math.max(
          layout.xScale.invert(clampedX[0]),
          layout.xScale.invert(clampedX[1]),
        );
        const dataYMin = Math.min(
          layout.yScale.invert(clampedY[0]),
          layout.yScale.invert(clampedY[1]),
        );
        const dataYMax = Math.max(
          layout.yScale.invert(clampedY[0]),
          layout.yScale.invert(clampedY[1]),
        );
        const ids = viewModel.pokemons
          .filter((pokemon) => {
            const xValue = pokemon.stats[xKey];
            const yValue = pokemon.stats[yKey];
            return (
              xValue >= dataXMin && xValue <= dataXMax && yValue >= dataYMin && yValue <= dataYMax
            ); // 判斷點是否落在選框內
          })
          .map((pokemon) => buildPokemonSelectionKey(pokemon));

        setSelectedPokemonKeys(ids); // 更新選取結果
      });

    plot.append('g').attr('class', 'brush').call(brush);
  }, [layout, selectedPokemonKeys, statLabelByKey, viewModel.pokemons, xKey, yKey]);

  const pokemonByKey = useMemo(
    () => new Map(viewModel.pokemons.map((pokemon) => [buildPokemonSelectionKey(pokemon), pokemon])),
    [viewModel.pokemons],
  );

  const selectedPokemons = useMemo(() => {
    if (selectedPokemonKeys.length === 0) {
      return [];
    }
    return selectedPokemonKeys
      .map((key) => pokemonByKey.get(key))
      .filter((pokemon): pokemon is PokemonScatterPointViewModel => Boolean(pokemon));
  }, [pokemonByKey, selectedPokemonKeys]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <AxisSelector
            label="X 軸"
            value={xKey}
            options={viewModel.statOptions}
            onChange={handleXKeyChange}
          />
          <AxisSelector
            label="Y 軸"
            value={yKey}
            options={viewModel.statOptions}
            onChange={handleYKeyChange}
          />
        </div>

        <div className="border-border bg-background overflow-auto rounded-lg border p-4 shadow-sm">
          <svg ref={svgRef} className="max-h-[600px] min-w-full" />
        </div>
        <p className="text-muted-foreground text-xs">
          提示：可切換兩個能力作為橫軸與縱軸，並拖曳散佈圖進行框選以檢視右側詳細資料。
        </p>
      </div>

      <SelectionPanel
        selectedPokemons={selectedPokemons}
        statOptions={viewModel.statOptions}
        selectionCount={selectedPokemonKeys.length}
      />
    </div>
  );
}

type AxisSelectorProps = {
  label: string;
  value: AverageStatKey;
  options: PokemonStatsMatrixViewModel['statOptions'];
  onChange: (value: AverageStatKey) => void;
};

function AxisSelector({ label, value, options, onChange }: AxisSelectorProps) {
  return (
    <label className="text-muted-foreground flex w-full flex-col gap-1 text-xs font-medium sm:w-auto">
      <span>{label}</span>
      <select
        className="border-border bg-background text-foreground focus-visible:outline-primary w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline sm:w-48"
        value={value}
        onChange={(event) => onChange(event.target.value as AverageStatKey)}
      >
        {options.map((option) => (
          <option key={`${label}-${option.key}`} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type SelectionPanelProps = {
  selectedPokemons: PokemonScatterPointViewModel[];
  statOptions: PokemonStatsMatrixViewModel['statOptions'];
  selectionCount: number;
};

function SelectionPanel({ selectedPokemons, statOptions, selectionCount }: SelectionPanelProps) {
  return (
    <aside className="border-border bg-background w-full max-w-sm space-y-3 rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">選取寶可夢</h3>
        <span className="text-muted-foreground text-xs">共 {selectionCount} 隻</span>
      </div>

      {selectedPokemons.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          從散佈圖中拖曳滑鼠框選區域，以檢視符合條件的寶可夢能力明細。
        </p>
      ) : (
        <ul className="space-y-3 overflow-auto pr-1" style={{ maxHeight: 420 }}>
          {selectedPokemons.map((pokemon) => (
            <li
              key={`${pokemon.id}_pokemon_name_${pokemon.name.split(' ').join('_').toLowerCase()}`}
              className="border-border bg-card rounded-md border p-3 shadow-sm transition hover:shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    #{pokemon.id.toString().padStart(3, '0')} {pokemon.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {pokemon.typeLabel}
                    {pokemon.secondaryType ? `／${translateType(pokemon.secondaryType)}` : ''}
                  </p>
                </div>
                {pokemon.isLegendary ? (
                  <span className="text-xs font-semibold text-amber-500">傳說</span>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {statOptions.map((option) => (
                  <div key={`${pokemon.id}-${option.key}`} className="space-y-0.5">
                    <dt className="text-muted-foreground">{option.label}</dt>
                    <dd className="text-foreground font-semibold">
                      {pokemon.stats[option.key].toFixed(0)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
