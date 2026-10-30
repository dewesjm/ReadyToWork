/** Themes offered in the avatar menu. Brand themes come first; the rest are daisyUI built-ins. */

export interface ThemeOption {
  id: string;
  label: string;
}

export const DEFAULT_THEME = 'navy';

export const BRAND_THEMES: readonly ThemeOption[] = [
  { id: 'navy', label: 'Navy & Gold' },
  { id: 'navy-dark', label: 'Navy & Gold (dark)' },
];

export const BUILT_IN_THEMES: readonly ThemeOption[] = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro',
  'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
  'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid',
  'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset', 'caramellatte', 'abyss',
  'silk',
].map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));

export const ALL_THEMES: readonly ThemeOption[] = [...BRAND_THEMES, ...BUILT_IN_THEMES];
