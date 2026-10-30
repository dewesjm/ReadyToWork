/*
 * Icon shapes copied from Lucide (https://lucide.dev), ISC License,
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
 * All other copyright (c) for Lucide are held by Lucide Contributors 2022.
 *
 * Kept as data rather than markup so templates render them without innerHTML. All icons use a
 * 24x24 viewBox, no fill and a currentColor stroke.
 */

export type IconShape =
  | readonly ['path', string]
  | readonly ['circle', number, number, number]
  | readonly ['rect', number, number, number, number, number]
  | readonly ['polygon', string];

export const ICONS: Record<string, readonly IconShape[]> = {
  // Statuses (STATUS_META in src/core/config.ts)
  'circle-x': [['circle', 12, 12, 10], ['path', 'm15 9-6 6'], ['path', 'm9 9 6 6']],
  'triangle-alert': [
    ['path', 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'],
    ['path', 'M12 9v4'],
    ['path', 'M12 17h.01'],
  ],
  'circle-check': [['circle', 12, 12, 10], ['path', 'm9 12 2 2 4-4']],

  // Categories (DEFAULT_CONFIG in src/core/config.ts)
  network: [
    ['rect', 16, 16, 6, 6, 1],
    ['rect', 2, 16, 6, 6, 1],
    ['rect', 9, 2, 6, 6, 1],
    ['path', 'M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3'],
    ['path', 'M12 12V8'],
  ],
  'key-round': [
    [
      'path',
      'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
    ],
    ['circle', 16.5, 7.5, 0.5],
  ],
  laptop: [
    [
      'path',
      'M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16',
    ],
  ],
  'graduation-cap': [
    [
      'path',
      'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
    ],
    ['path', 'M22 10v6'],
    ['path', 'M6 12.5V16a6 3 0 0 0 12 0v-3.5'],
  ],
  'shield-check': [
    [
      'path',
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    ],
    ['path', 'm9 12 2 2 4-4'],
  ],
  award: [
    [
      'path',
      'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526',
    ],
    ['circle', 12, 8, 6],
  ],
  usb: [
    ['circle', 10, 7, 1],
    ['circle', 4, 20, 1],
    ['path', 'M4.7 19.3 19 5'],
    ['path', 'm21 3-3 1 2 2Z'],
    ['path', 'M9.26 7.68 5 12l2 5'],
    ['path', 'm10 14 5 2 3.5-3.5'],
    ['path', 'm18 12 1-1 1 1-1 1Z'],
  ],
  wrench: [
    [
      'path',
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
  ],

  // Controls
  'chevron-right': [['path', 'm9 18 6-6-6-6']],
  'chevron-down': [['path', 'm6 9 6 6 6-6']],
  'chevrons-up-down': [['path', 'm7 15 5 5 5-5'], ['path', 'm7 9 5-5 5 5']],
  'chevrons-down-up': [['path', 'm7 20 5-5 5 5'], ['path', 'm7 4 5 5 5-5']],
  search: [['circle', 11, 11, 8], ['path', 'm21 21-4.3-4.3']],
  funnel: [['polygon', '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3']],
  x: [['path', 'M18 6 6 18'], ['path', 'm6 6 12 12']],
  check: [['path', 'M20 6 9 17l-5-5']],
  info: [['circle', 12, 12, 10], ['path', 'M12 16v-4'], ['path', 'M12 8h.01']],
  'octagon-x': [
    ['path', 'm15 9-6 6'],
    [
      'path',
      'M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z',
    ],
    ['path', 'm9 9 6 6'],
  ],
  clock: [['circle', 12, 12, 10], ['path', 'M12 6v6l4 2']],

  // Admin
  plus: [['path', 'M5 12h14'], ['path', 'M12 5v14']],
  'trash-2': [
    ['path', 'M3 6h18'],
    ['path', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'],
    ['path', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
    ['path', 'M10 11v6'],
    ['path', 'M14 11v6'],
  ],
  'arrow-left': [['path', 'm12 19-7-7 7-7'], ['path', 'M19 12H5']],
  download: [
    ['path', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'],
    ['path', 'm7 10 5 5 5-5'],
    ['path', 'M12 15V3'],
  ],
  upload: [
    ['path', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'],
    ['path', 'm17 8-5-5-5 5'],
    ['path', 'M12 3v12'],
  ],
  'rotate-ccw': [
    ['path', 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'],
    ['path', 'M3 3v5h5'],
  ],
};
