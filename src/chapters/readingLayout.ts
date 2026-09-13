// Atlas invalidation is a low-frequency layout revision, never scroll state.
let revision = 0;
export const readHeroReadingLayoutRevision = () => revision;
export function invalidateHeroReadingLayout() {
  revision += 1;
}
