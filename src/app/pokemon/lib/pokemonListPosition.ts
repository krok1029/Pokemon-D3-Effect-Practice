export type PokemonListPosition = { anchor: string; top: number };

const POSITION_KEY = 'pokemon-list-position-v1';

export function rememberPokemonPosition(listHref: string, anchor: string) {
  const href = `${listHref}#${anchor}`;
  const top = document.getElementById(anchor)?.getBoundingClientRect().top ?? 96;
  try {
    sessionStorage.setItem(POSITION_KEY, JSON.stringify({ href, top }));
  } catch {
    // The URL still identifies the batch and card when browser storage is unavailable.
  }
  window.history.replaceState({ ...window.history.state, pokemonListLeaving: true }, '', href);
}

export function resumePokemonListPositionTracking() {
  if (window.history.state?.pokemonListLeaving) {
    const state = { ...window.history.state };
    delete state.pokemonListLeaving;
    window.history.replaceState(state, '', window.location.href);
  }
}

export function readPokemonPosition(): PokemonListPosition | null {
  const anchor = window.location.hash.slice(1);
  if (!/^pokemon-\d+-[a-z0-9-]+$/.test(anchor)) return null;
  let top = 96;
  try {
    const saved = JSON.parse(sessionStorage.getItem(POSITION_KEY) ?? 'null');
    if (
      saved?.href === window.location.pathname + window.location.search + window.location.hash &&
      Number.isFinite(saved.top)
    ) {
      top = Math.min(Math.max(0, saved.top), Math.max(96, window.innerHeight - 200));
    }
  } catch {
    // A shared URL can restore the card without a local scroll snapshot.
  }
  return { anchor, top };
}

export function restorePokemonPosition(position: PokemonListPosition) {
  const card = document.getElementById(position.anchor);
  if (!card) return false;
  window.scrollBy({ top: card.getBoundingClientRect().top - position.top, behavior: 'instant' });
  return true;
}

export function visiblePokemonPosition(container: HTMLElement | null): PokemonListPosition | null {
  if (!container) return null;
  const card = Array.from(container.querySelectorAll<HTMLElement>('[data-pokemon-index]')).find(
    (element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.bottom > 112 && bounds.top < window.innerHeight;
    },
  );
  return card ? { anchor: card.id, top: card.getBoundingClientRect().top } : null;
}
