type SearchablePokemon = { id: number; name: string };

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[\s.'\u2018\u2019]/g, '');
}

export function createPokemonSearchMatcher(
  search: string,
): (pokemon: SearchablePokemon) => boolean {
  const query = search.trim();
  if (!query) return () => true;

  const numberMatch = query.match(/^#?(\d+)$/);
  if (numberMatch) {
    const digits = numberMatch[1];
    const exact = query.startsWith('#') || (digits.length > 1 && digits.startsWith('0'));
    const numberQuery = digits.replace(/^0+(?=\d)/, '');
    return exact
      ? (pokemon) => String(pokemon.id) === numberQuery
      : (pokemon) =>
          String(pokemon.id).includes(numberQuery) || normalizeName(pokemon.name).includes(query);
  }

  const nameQuery = normalizeName(query);
  return (pokemon) => nameQuery.length > 0 && normalizeName(pokemon.name).includes(nameQuery);
}
