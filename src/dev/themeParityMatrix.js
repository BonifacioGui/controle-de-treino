export const UI_PREVIEW_SCREENS = Object.freeze([
  'login',
  'confirmation',
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
  'notifications',
  'settings',
  'class-info',
]);

export const THEME_PARITY_THEMES = Object.freeze(['dark', 'light']);
export const THEME_PARITY_EXPERIENCES = Object.freeze(['immersive', 'balanced', 'discreet']);
export const THEME_PARITY_VIEWPORTS = Object.freeze([320, 390, 768, 1280]);

export const THEME_PARITY_MATRIX = Object.freeze([
  { feature: 'Boss', previews: ['active', 'complete'] },
  { feature: 'ExerciseCard', previews: ['active'] },
  { feature: 'RestTimer', previews: ['rest', 'settings'] },
  { feature: 'PR', previews: ['pre', 'active', 'complete'] },
  { feature: 'Atributos e XP', previews: ['profile'] },
  { feature: 'Perfil e objetivos', previews: ['profile'] },
  { feature: 'Explicação das classes', previews: ['class-info'] },
  { feature: 'Central de notificações', previews: ['notifications'] },
  { feature: 'Scanner biométrico', previews: ['stats'] },
  { feature: 'Guia de exercício', previews: ['pre', 'active'] },
  { feature: 'Confirmação de e-mail', previews: ['confirmation'] },
  { feature: 'Level Up', previews: ['level'] },
  { feature: 'charts', previews: ['stats'] },
  { feature: 'modais', previews: ['complete', 'level'] },
  { feature: 'states', previews: ['login', 'active', 'rest', 'complete'] },
  { feature: 'inputs', previews: ['login', 'active', 'manage', 'importer', 'settings'] },
]);

export const buildThemeParityCases = () => THEME_PARITY_MATRIX.flatMap(({ feature, previews }) =>
  previews.flatMap((preview) => THEME_PARITY_THEMES.map((theme) => ({
    feature,
    preview,
    theme,
    path: `?ui-preview=${preview}&theme=${theme}&experience=balanced`,
  }))),
);
