export const UI_PREVIEW_SCREENS = Object.freeze([
  'login',
  'pre',
  'active',
  'rest',
  'history',
  'stats',
  'profile',
  'manage',
  'importer',
  'complete',
  'level',
]);

export const THEME_PARITY_THEMES = Object.freeze(['dark', 'light']);
export const THEME_PARITY_EXPERIENCES = Object.freeze(['immersive', 'balanced', 'discreet']);
export const THEME_PARITY_VIEWPORTS = Object.freeze([320, 390, 768, 1280]);

export const THEME_PARITY_MATRIX = Object.freeze([
  { feature: 'Boss', previews: ['active', 'complete'] },
  { feature: 'ExerciseCard', previews: ['active'] },
  { feature: 'RestTimer', previews: ['rest'] },
  { feature: 'PR', previews: ['complete'] },
  { feature: 'Level Up', previews: ['level'] },
  { feature: 'charts', previews: ['stats'] },
  { feature: 'modais', previews: ['complete', 'level'] },
  { feature: 'states', previews: ['login', 'active', 'rest', 'complete'] },
  { feature: 'inputs', previews: ['login', 'active', 'manage', 'importer'] },
]);

export const buildThemeParityCases = () => THEME_PARITY_MATRIX.flatMap(({ feature, previews }) =>
  previews.flatMap((preview) => THEME_PARITY_THEMES.map((theme) => ({
    feature,
    preview,
    theme,
    path: `?ui-preview=${preview}&theme=${theme}&experience=balanced`,
  }))),
);
