'use client';

import * as d3 from 'd3';
import Image from 'next/image';
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
const buildPokemonSelectionKey = (pokemon: Pick<PokemonScatterPointViewModel, 'id' | 'name'>) =>
  `${pokemon.id}-${sanitizePokemonName(pokemon.name)}`;
const withAlphaColor = (color: string, alpha: number) => {
  const match = color.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) {
    return color;
  }
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function StatScatterMatrix({ viewModel }: StatScatterMatrixProps) {
  const statKeys = useMemo(
    () => viewModel.statOptions.map((option) => option.key),
    [viewModel.statOptions],
  );

  const statLabelByKey = useMemo(
    () => new Map(viewModel.statOptions.map((option) => [option.key, option.label])),
    [viewModel.statOptions],
  );

  const typeOptions = useMemo(() => {
    const typeMap = new Map<string, TypeLegendOption>();
    viewModel.pokemons.forEach((pokemon) => {
      if (!typeMap.has(pokemon.typeSlug)) {
        typeMap.set(pokemon.typeSlug, {
          slug: pokemon.typeSlug,
          label: pokemon.typeLabel,
          color: pokemon.color,
          iconPath: pokemon.iconPath,
        });
      }
    });
    return Array.from(typeMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant'));
  }, [viewModel.pokemons]);

  const allTypeSlugs = useMemo(() => typeOptions.map((option) => option.slug), [typeOptions]);

  const defaultXKey = statKeys[1] ?? statKeys[0] ?? 'hp';
  const defaultYKey = statKeys[0] ?? 'hp';

  const [xKey, setXKey] = useState<AverageStatKey>(defaultXKey);
  const [yKey, setYKey] = useState<AverageStatKey>(
    defaultXKey === defaultYKey ? (statKeys[2] ?? defaultYKey) : defaultYKey,
  );
  const [selectedPokemonKeys, setSelectedPokemonKeys] = useState<string[]>([]);
  const [visibleTypeSlugs, setVisibleTypeSlugs] = useState<string[]>(allTypeSlugs);

  useEffect(() => {
    setVisibleTypeSlugs(allTypeSlugs);
  }, [allTypeSlugs]);

  const visibleTypeSlugSet = useMemo(() => new Set(visibleTypeSlugs), [visibleTypeSlugs]);

  const filteredPokemons = useMemo(
    () => viewModel.pokemons.filter((pokemon) => visibleTypeSlugSet.has(pokemon.typeSlug)),
    [viewModel.pokemons, visibleTypeSlugSet],
  );

  const pokemonByKey = useMemo(
    () =>
      new Map(viewModel.pokemons.map((pokemon) => [buildPokemonSelectionKey(pokemon), pokemon])),
    [viewModel.pokemons],
  );

  useEffect(() => {
    setSelectedPokemonKeys((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = prev.filter((key) => {
        const pokemon = pokemonByKey.get(key);
        return pokemon && visibleTypeSlugSet.has(pokemon.typeSlug);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [pokemonByKey, visibleTypeSlugSet]);

  const handleTypeToggle = useCallback((slug: string) => {
    setVisibleTypeSlugs((prev) => {
      const hasSlug = prev.includes(slug);
      if (hasSlug) {
        return prev.filter((item) => item !== slug);
      }
      return [...prev, slug];
    });
  }, []);

  const handleTypeReset = useCallback(() => {
    setVisibleTypeSlugs(allTypeSlugs);
  }, [allTypeSlugs]);

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

  useEffect(() => {
    zoomTransformRef.current = d3.zoomIdentity;
  }, [xKey, yKey]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(
    null,
  );
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

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

  const activeScalesRef = useRef<{
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
  }>({
    x: layout.xScale,
    y: layout.yScale,
  });

  useEffect(() => {
    activeScalesRef.current = {
      x: layout.xScale,
      y: layout.yScale,
    };
  }, [layout]);

  const handleZoomBy = useCallback((scaleFactor: number) => {
    const svgSelection = svgSelectionRef.current;
    const zoomBehavior = zoomBehaviorRef.current;
    if (!svgSelection || !zoomBehavior) {
      return;
    }

    svgSelection.transition().duration(200).call(zoomBehavior.scaleBy, scaleFactor);
  }, []);

  const handleZoomInClick = useCallback(() => {
    handleZoomBy(1.2);
  }, [handleZoomBy]);

  const handleZoomOutClick = useCallback(() => {
    handleZoomBy(0.8);
  }, [handleZoomBy]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    const root = d3.select(svgElement);
    svgSelectionRef.current = root;
    root.selectAll('*').remove();
    root.attr('viewBox', `0 0 ${layout.width} ${layout.height}`).attr('width', '100%');
    root.on('.zoom', null);

    const plot = root
      .append('g')
      .attr('transform', `translate(${PLOT_MARGIN.left}, ${PLOT_MARGIN.top})`);

    const applyAxisStyles = (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      selection.selectAll('line').attr('stroke', 'var(--border)').attr('stroke-opacity', 0.4);
      selection.selectAll('path').attr('stroke', 'var(--border)');
      selection.selectAll('text').attr('fill', 'var(--muted-foreground)').attr('font-size', 12);
    };

    const xAxisGroup = plot.append('g').attr('transform', `translate(0, ${layout.innerHeight})`);
    const yAxisGroup = plot.append('g');

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

    const selectedSet = new Set(selectedPokemonKeys);
    const dotsGroup = plot.append('g').attr('class', 'dots');
    const dots = dotsGroup
      .selectAll('circle.dot')
      .data(filteredPokemons)
      .join('circle')
      .attr(
        'class',
        (pokemon) =>
          `dot ${pokemon.id}_pokemon_name_${pokemon.name.split(' ').join('_').toLowerCase()}`,
      )
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
      );

    dots
      .append('title')
      .text((pokemon) => `${pokemon.name}（${translateType(pokemon.primaryType)}）`);

    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [layout.innerWidth, layout.innerHeight],
      ])
      .on('end', (event) => {
        const selection = event.selection as [[number, number], [number, number]] | null;
        if (!selection) {
          setSelectedPokemonKeys((prev) => (prev.length === 0 ? prev : []));
          return;
        }

        const [[x0, y0], [x1, y1]] = selection;
        const clampedX = [
          Math.max(0, Math.min(layout.innerWidth, Math.min(x0, x1))),
          Math.max(0, Math.min(layout.innerWidth, Math.max(x0, x1))),
        ];
        const clampedY = [
          Math.max(0, Math.min(layout.innerHeight, Math.min(y0, y1))),
          Math.max(0, Math.min(layout.innerHeight, Math.max(y0, y1))),
        ];

        const currentXScale = activeScalesRef.current?.x ?? layout.xScale;
        const currentYScale = activeScalesRef.current?.y ?? layout.yScale;

        const dataXMin = Math.min(
          currentXScale.invert(clampedX[0]),
          currentXScale.invert(clampedX[1]),
        );
        const dataXMax = Math.max(
          currentXScale.invert(clampedX[0]),
          currentXScale.invert(clampedX[1]),
        );
        const dataYMin = Math.min(
          currentYScale.invert(clampedY[0]),
          currentYScale.invert(clampedY[1]),
        );
        const dataYMax = Math.max(
          currentYScale.invert(clampedY[0]),
          currentYScale.invert(clampedY[1]),
        );

        const ids = filteredPokemons
          .filter((pokemon) => {
            const xValue = pokemon.stats[xKey];
            const yValue = pokemon.stats[yKey];
            return (
              xValue >= dataXMin && xValue <= dataXMax && yValue >= dataYMin && yValue <= dataYMax
            );
          })
          .map((pokemon) => buildPokemonSelectionKey(pokemon));

        setSelectedPokemonKeys(ids);
      });

    const brushGroup = plot.append('g').attr('class', 'brush').call(brush);

    const applyTransform = (transform: d3.ZoomTransform) => {
      const nextXScale = transform.rescaleX(layout.xScale);
      const nextYScale = transform.rescaleY(layout.yScale);
      activeScalesRef.current = {
        x: nextXScale,
        y: nextYScale,
      };

      xAxisGroup.call(d3.axisBottom(nextXScale).ticks(6).tickSize(-layout.innerHeight));
      xAxisGroup.call(applyAxisStyles);

      yAxisGroup.call(d3.axisLeft(nextYScale).ticks(6).tickSize(-layout.innerWidth));
      yAxisGroup.call(applyAxisStyles);

      dots
        .attr('cx', (pokemon) => nextXScale(pokemon.stats[xKey]))
        .attr('cy', (pokemon) => nextYScale(pokemon.stats[yKey]));
    };

    const zoomExtent: [[number, number], [number, number]] = [
      [PLOT_MARGIN.left, PLOT_MARGIN.top],
      [PLOT_MARGIN.left + layout.innerWidth, PLOT_MARGIN.top + layout.innerHeight],
    ];

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .extent(zoomExtent)
      .translateExtent([
        [zoomExtent[0][0] - layout.innerWidth, zoomExtent[0][1] - layout.innerHeight],
        [zoomExtent[1][0] + layout.innerWidth, zoomExtent[1][1] + layout.innerHeight],
      ])
      .filter((event) => {
        if (event.type.startsWith('touch')) {
          return true;
        }
        if (event.type === 'wheel') {
          return false;
        }
        if (event.type === 'mousedown' || event.type === 'pointerdown') {
          return event.button === 1;
        }
        if (event.type === 'mousemove' || event.type === 'pointermove') {
          return (event.buttons & 4) === 4;
        }
        return false;
      })
      .on('start', (event) => {
        if (event.sourceEvent) {
          root.style('cursor', 'grabbing');
        }
      })
      .on('end', () => {
        root.style('cursor', 'default');
      })
      .on('zoom', (event) => {
        zoomTransformRef.current = event.transform;
        applyTransform(event.transform);
        if (event.sourceEvent) {
          brushGroup.call(brush.move, null);
          setSelectedPokemonKeys((prev) => (prev.length === 0 ? prev : []));
        }
      });

    zoomBehaviorRef.current = zoomBehavior;
    root.call(zoomBehavior);
    root.call(zoomBehavior.transform, zoomTransformRef.current);

    applyTransform(zoomTransformRef.current);

    return () => {
      root.on('.zoom', null);
    };
  }, [filteredPokemons, layout, selectedPokemonKeys, statLabelByKey, xKey, yKey]);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
          <ZoomControls onZoomIn={handleZoomInClick} onZoomOut={handleZoomOutClick} />
        </div>

        <TypeLegend
          options={typeOptions}
          activeSlugs={visibleTypeSlugs}
          onToggle={handleTypeToggle}
          onReset={handleTypeReset}
        />

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

type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
};

function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="border-border text-foreground hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md border text-lg font-semibold transition"
        aria-label="縮小"
        onClick={onZoomOut}
      >
        -
      </button>
      <button
        type="button"
        className="border-border text-foreground hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-md border text-lg font-semibold transition"
        aria-label="放大"
        onClick={onZoomIn}
      >
        +
      </button>
    </div>
  );
}

type TypeLegendOption = {
  slug: string;
  label: string;
  color: string;
  iconPath: string;
};

type TypeLegendProps = {
  options: TypeLegendOption[];
  activeSlugs: string[];
  onToggle: (slug: string) => void;
  onReset: () => void;
};

function TypeLegend({ options, activeSlugs, onToggle, onReset }: TypeLegendProps) {
  if (options.length === 0) {
    return null;
  }

  const isAllActive = activeSlugs.length === options.length;

  return (
    <section className="border-border bg-muted/20 rounded-lg border p-3 shadow-sm">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium">
        <span>屬性篩選</span>
        <button
          type="button"
          className="text-primary disabled:text-muted-foreground"
          onClick={onReset}
          disabled={isAllActive}
        >
          重設
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = activeSlugs.includes(option.slug);
          const buttonStyle = {
            borderColor: option.color,
            color: option.color,
            backgroundColor: isActive ? withAlphaColor(option.color, 0.18) : 'transparent',
          };
          return (
            <button
              key={option.slug}
              type="button"
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                isActive ? 'shadow-sm' : 'opacity-75 hover:opacity-100'
              }`}
              style={buttonStyle}
              aria-pressed={isActive}
              onClick={() => onToggle(option.slug)}
            >
              <Image
                width={16}
                height={16}
                src={option.iconPath}
                alt={option.label}
                className="h-4 w-4"
                style={{ filter: isActive ? 'none' : 'grayscale(1)', opacity: isActive ? 1 : 0.7 }}
                aria-hidden="true"
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type SelectionPanelProps = {
  selectedPokemons: PokemonScatterPointViewModel[];
  statOptions: PokemonStatsMatrixViewModel['statOptions'];
  selectionCount: number;
};

function SelectionPanel({ selectedPokemons, statOptions, selectionCount }: SelectionPanelProps) {
  return (
    <aside className="border-border bg-background max-h-[800px] w-full max-w-sm space-y-3 rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">選取寶可夢</h3>
        <span className="text-muted-foreground text-xs">共 {selectionCount} 隻</span>
      </div>

      {selectedPokemons.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          從散佈圖中拖曳滑鼠框選區域，以檢視符合條件的寶可夢能力明細。
        </p>
      ) : (
        <ul className="max-h-[720px] space-y-3 overflow-auto pr-1">
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
