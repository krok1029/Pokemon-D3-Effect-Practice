// Form URLs use source names rather than row positions. Repositories reject collisions within a species.
export function createPokemonFormId(name: string): string {
  const formId = name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/♀/g, '-female')
    .replace(/♂/g, '-male')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!formId) {
    throw new Error('Pokemon form identity must not be empty');
  }
  return formId;
}
