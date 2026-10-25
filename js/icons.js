// Loop's own icon set: rounded 24px line icons with a soft duotone fill (class "d").
// They take the colour of their parent, so a tile's ink colour tints the whole icon.

const P = {
  // UI
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  chevron: '<path d="M9.5 6l6 6-6 6"/>',
  back: '<path d="M14.5 6l-6 6 6 6"/>',
  more: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="2.6"/>',
  search: '<circle cx="11" cy="11" r="6.5" class="d"/><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  edit: '<path d="M4.5 19.5l1-4.5L15.8 4.7a2.1 2.1 0 0 1 3 3L8.5 18l-4 1.5Z" class="d"/><path d="M4.5 19.5l1-4.5L15.8 4.7a2.1 2.1 0 0 1 3 3L8.5 18l-4 1.5ZM13.5 7l3 3"/>',
  trash: '<path d="M6.5 7.5l1 12h9l1-12" class="d"/><path d="M4.5 7.5h15M9.5 7.5V5h5v2.5M6.5 7.5l1 12h9l1-12M10 11v5M14 11v5"/>',
  gear: '<circle cx="12" cy="12" r="3" class="d"/><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  sparkle: '<path d="M11 3.5c.6 4 2.5 6 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.5 5.9-2.5 6.5-6.5Z" class="d"/><path d="M11 3.5c.6 4 2.5 6 6.5 6.5-4 .6-5.9 2.5-6.5 6.5-.6-4-2.5-5.9-6.5-6.5 4-.5 5.9-2.5 6.5-6.5ZM18 15c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3Z"/>',
  flame: '<path d="M12 21c-1.7 0-2.9-1.2-2.9-2.8 0-1.6 1.3-2.7 2.9-4.1 1.6 1.4 2.9 2.5 2.9 4.1 0 1.6-1.2 2.8-2.9 2.8Z" class="d"/><path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-2.8 1.7-4.6 3.2-6.2.3 1.6 1 2.7 2.1 3.1-.2-3.1 1.1-6 3.7-8.4.5 3.1 1.9 4.8 3.2 6.4 1 1.3 1.8 2.8 1.8 4.9 0 3.6-2.9 6.2-7.5 6.2Z"/>',
  repeat: '<path d="M17 3.5l3 3-3 3M4 11.5v-1.5a3.5 3.5 0 0 1 3.5-3.5H20M7 20.5l-3-3 3-3M20 12.5V14a3.5 3.5 0 0 1-3.5 3.5H4"/>',
  phoneDown: '<rect x="6.5" y="2.5" width="11" height="19" rx="3" class="d"/><rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M12 7v6.5M9.5 11l2.5 2.5 2.5-2.5M10.8 18.5h2.4"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95 6 6 0 0 0-11.5-.95A4.5 4.5 0 0 0 7 18.5Z" class="d"/><path d="M7 18.5h10a4 4 0 0 0 .6-7.95 6 6 0 0 0-11.5-.95A4.5 4.5 0 0 0 7 18.5ZM12 16v-5M9.8 13.2 12 11l2.2 2.2"/>',
  upload: '<path d="M6 3.5h8l4 4v13H6v-17Z" class="d"/><path d="M6 3.5h8l4 4v13H6v-17ZM14 3.5v4h4M12 17v-6M9.5 13.5 12 11l2.5 2.5"/>',
  link: '<path d="M7 7h10v3.5a5 5 0 0 1-10 0V7Z" class="d"/><path d="M9 7V3.5M15 7V3.5M7 7h10v3.5a5 5 0 0 1-10 0V7ZM12 15.5v5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" class="d"/><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3" class="d"/><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  camera: '<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" class="d"/><path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z"/><circle cx="12" cy="13" r="3.5"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  info: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
  alert: '<path d="M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" class="d"/><path d="M10.3 4.5 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0ZM12 9.5v4.5M12 17h.01"/>',
  play: '<path d="M8 5.5v13l10-6.5-10-6.5Z" class="d"/><path d="M8 5.5v13l10-6.5-10-6.5Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="3" class="d"/><rect x="6" y="6" width="12" height="12" rx="3"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5" class="d"/><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10M10 2.5h4M18.5 7l1.5-1.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<path d="M6.5 5h11a3 3 0 0 1 3 3v2h-17V8a3 3 0 0 1 3-3Z" class="d"/><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chart: '<path d="M5 15l4-4 3 3 6-6" class="d" style="opacity:0"/><path d="M4 19.5h16M5 15l4-4 3 3 6-6M15 8h3v3"/>',
  target: '<circle cx="12" cy="12" r="5" class="d"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01" stroke-width="3"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="3" class="d"/><rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M8.5 6.5h7v3h-7zM8.8 13h.01M12 13h.01M15.2 13h.01M8.8 17h.01M12 17h.01M15.2 17h.01" stroke-width="2"/>',
  trophy: '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Z" class="d"/><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4ZM7.5 5.5h-3c0 2.6 1.2 4.1 3.4 4.4M16.5 5.5h3c0 2.6-1.2 4.1-3.4 4.4M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  medal: '<circle cx="12" cy="9" r="5.5" class="d"/><circle cx="12" cy="9" r="5.5"/><path d="M8.8 13.5 7.5 21l4.5-2.3 4.5 2.3-1.3-7.5M12 6.8v4.4"/>',
  star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z" class="d"/><path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z"/>',
  sun: '<circle cx="12" cy="12" r="4" class="d"/><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  sunset: '<path d="M7 16a5 5 0 0 1 10 0" class="d"/><path d="M7 16a5 5 0 0 1 10 0M3 16h18M6 20h12M12 3.5v4M9.5 6 12 8.5 14.5 6M4.5 10.5l1.4 1.4M19.5 10.5l-1.4 1.4"/>',
  home: '<path d="M4 11 12 4.5 20 11v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1V11Z" class="d"/><path d="M4 11 12 4.5 20 11v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1V11Z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2.2" class="d"/><rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" class="d"/><path d="M12 20s-7.5-4.6-7.5-10.5A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3.5" /><rect x="3.5" y="7.5" width="17" height="12" rx="3" class="d"/><rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M15.5 13.5h2"/>',

  // Health
  diet: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" class="d"/><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0ZM12 11.5c.2-3.6 2.3-6.2 5.6-6.8-.2 3.5-2.4 6-5.6 6.8ZM8.3 11.5c-.4-2.1.5-4 2.4-5"/>',
  moon: '<path d="M19.5 14.5A7.8 7.8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10Z" class="d"/><path d="M19.5 14.5A7.8 7.8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10ZM17 3.5v3M15.5 5h3"/>',
  drop: '<path d="M12 3.5c3 3.6 6 7 6 10.3a6 6 0 0 1-12 0c0-3.3 3-6.7 6-10.3Z" class="d"/><path d="M12 3.5c3 3.6 6 7 6 10.3a6 6 0 0 1-12 0c0-3.3 3-6.7 6-10.3ZM9.3 14.3a2.7 2.7 0 0 0 2.7 2.7"/>',
  scale: '<rect x="3.5" y="4" width="17" height="16" rx="4" class="d"/><rect x="3.5" y="4" width="17" height="16" rx="4"/><path d="M8.2 10.5a3.8 3.8 0 0 1 7.6 0M12 10.5l1.6-2.1"/>',
  dumbbell: '<rect x="5" y="6.5" width="3.2" height="11" rx="1.3" class="d"/><rect x="15.8" y="6.5" width="3.2" height="11" rx="1.3" class="d"/><rect x="5" y="6.5" width="3.2" height="11" rx="1.3"/><rect x="15.8" y="6.5" width="3.2" height="11" rx="1.3"/><path d="M8.2 12h7.6M2.5 9.5v5M21.5 9.5v5"/>',
  shaker: '<path d="M8 8.5h8l-1 11.5H9L8 8.5Z" class="d"/><path d="M8 8.5h8l-1 11.5H9L8 8.5ZM7.5 5.5h9v3h-9zM10 3h4v2.5h-4zM8.5 13.5h7"/>',
  run: '<circle cx="14.5" cy="4.5" r="1.8" class="d"/><circle cx="14.5" cy="4.5" r="1.8"/><path d="M7 21l3-5.5 3 2.5v3M10 15.5l1.5-6.5 3.5 2.5 3-1M11.5 9 8 9.5l-2 3"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8" class="d"/><circle cx="13" cy="4.5" r="1.8"/><path d="M9.5 21l2-6 2.5 2.5V21M11.5 15l-.5-5.5 3.5.5 2 3.5M11 9.5l-3 2.5v3"/>',
  bed: '<path d="M3 15h18v4H3z" class="d"/><path d="M3 19V7.5M3 15h18M21 19v-4.5a3 3 0 0 0-3-3h-7V15"/><circle cx="7" cy="12" r="1.8"/>',
  pill: '<path d="M10.6 4.6a4.5 4.5 0 0 1 6.4 6.4l-3 3-6.4-6.4 3-3Z" class="d"/><path d="M10.6 4.6a4.5 4.5 0 0 1 6.4 6.4l-6 6a4.5 4.5 0 0 1-6.4-6.4l6-6ZM7.6 7.6l6.8 6.8"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 14-14 .5 9-5 14-13 14H5Z" class="d"/><path d="M5 19c0-8 5-13.5 14-14 .5 9-5 14-13 14H5ZM5 19l8-8"/>',
  noPhone: '<rect x="7" y="2.5" width="10" height="19" rx="3" class="d"/><rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M4 4l16 16"/>',
  brain: '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 8 18a2.5 2.5 0 0 0 4 1.5V5.8A2.5 2.5 0 0 0 9 4.5Z" class="d"/><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 8 18a2.5 2.5 0 0 0 4 1.5V5.8A2.5 2.5 0 0 0 9 4.5ZM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.5A3 3 0 0 1 16 18a2.5 2.5 0 0 1-4 1.5"/>',
  plate: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.3"/>',
  muscle: '<path d="M5 16c1-5 2.5-9 6-10.5l2 2.5-2.5 2.5c3-.8 6 .3 8 3.5-1.3 3.2-4.5 4.5-8 4.5H5Z" class="d"/><path d="M5 16c1-5 2.5-9 6-10.5l2 2.5-2.5 2.5c3-.8 6 .3 8 3.5-1.3 3.2-4.5 4.5-8 4.5H5Z"/>',

  // Uni & work
  school: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" class="d"/><path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5ZM6.5 11.5V16c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5M21.5 9.5v5"/>',
  book: '<path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2Z" class="d"/><path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2ZM12 6.5v13"/>',
  pen: '<path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5Z" class="d"/><path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5ZM12.5 6.5l5 5"/>',
  exam: '<rect x="5" y="3.5" width="14" height="17" rx="2.5" class="d"/><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8.5l1.2 1.2 2.3-2.4M8.5 14l1.2 1.2 2.3-2.4M14 8.5h2M14 14h2"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2.5" class="d"/><rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18"/>',
  coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" class="d"/><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9ZM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 3.5c-.8 1 .8 1.8 0 3M12.5 3.5c-.8 1 .8 1.8 0 3"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.8" class="d"/><rect x="5" y="5" width="14" height="10" rx="1.8"/><path d="M3 18.5h18M10.3 8.5 8.6 10l1.7 1.5M13.7 8.5l1.7 1.5-1.7 1.5"/>',
  code: '<path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M13.5 5l-3 14"/>',
  user: '<circle cx="12" cy="8" r="3.8" class="d"/><circle cx="12" cy="8" r="3.8"/><path d="M5 20c.6-3.8 3.4-6 7-6s6.4 2.2 7 6"/>',
  users: '<circle cx="9" cy="8" r="3.5" class="d"/><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.6 3 5.2"/>',
  list: '<rect x="4" y="4" width="16" height="16" rx="3.5" class="d"/><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8 9l1.2 1.2L11.5 8M8 14.5l1.2 1.2 2.3-2.2M13.5 9.5h3M13.5 15h3"/>',
  flag: '<path d="M5.5 4.5h11l-2 4 2 4h-11z" class="d"/><path d="M5.5 21V4.5h11l-2 4 2 4h-11"/>',

  // Money
  card: '<rect x="3" y="5.5" width="18" height="13" rx="3" class="d"/><rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M15.5 14.5h2"/>',
  coins: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.3c-.4-.9-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6v1.8M12 16.2V18"/>',
  receipt: '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3.5Z" class="d"/><path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3.5ZM9 8h6M9 11.5h6M9 15h3.5"/>',
  piggy: '<path d="M18.5 11.5c0-3-2.9-5-6.5-5s-6.5 2-6.5 5c0 1.8 1 3.3 2.5 4.2V19h2.5v-2c1 .2 2 .2 3 0v2h2.5v-3.3c1.5-.9 2.5-2.4 2.5-4.2Z" class="d"/><path d="M18.5 11.5c0-3-2.9-5-6.5-5s-6.5 2-6.5 5c0 1.8 1 3.3 2.5 4.2V19h2.5v-2c1 .2 2 .2 3 0v2h2.5v-3.3c1.5-.9 2.5-2.4 2.5-4.2ZM10.5 9h3M18.5 11h1.5v2.5h-1.6M9 11.8h.01"/>',
  cart: '<path d="M7 7.5h12.5l-2 7.5H8.4Z" class="d"/><path d="M3 4h2.5l2 11h10l2-7.5H7"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  dining: '<path d="M14 3.5c-2 1-3 3.5-3 7 0 1.5.8 2.5 3 2.5V3.5Z" class="d" transform="translate(3 0)"/><path d="M7 3.5v7a2 2 0 0 0 2 2v8M5 3.5v5M9 3.5v5M17 20.5v-17c-2 1-3 3.5-3 7 0 1.5.8 2.5 3 2.5"/>',
  train: '<rect x="6" y="3.5" width="12" height="13" rx="3" class="d"/><rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10.5h12M9 13.5h.01M15 13.5h.01M8.5 20.5l1.5-4M15.5 20.5l-1.5-4" stroke-width="1.8"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" class="d"/><path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>',
  ticket: '<path d="M4 6.5h16v3a2.5 2.5 0 0 0 0 5v3H4v-3a2.5 2.5 0 0 0 0-5v-3Z" class="d"/><path d="M4 6.5h16v3a2.5 2.5 0 0 0 0 5v3H4v-3a2.5 2.5 0 0 0 0-5v-3ZM14.5 7v1.5M14.5 11.2v1.6M14.5 15.5V17"/>',
  bag: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8Z" class="d"/><path d="M5.5 8h13l-1 12.5h-11L5.5 8ZM9 10.5V7a3 3 0 0 1 6 0v3.5"/>',
  medical: '<rect x="4" y="4" width="16" height="16" rx="4" class="d"/><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="2" class="d"/><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18v3.5H3zM12 9v11M12 9c-1.5-3.5-5-4-5-1.8C7 9 12 9 12 9Zm0 0c1.5-3.5 5-4 5-1.8C17 9 12 9 12 9Z"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="3" class="d"/><rect x="6.5" y="2.5" width="11" height="19" rx="3"/><path d="M10.8 18.5h2.4"/>',
  globe: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5S14.3 18.1 12 20.5C9.7 18.1 8.6 15.3 8.6 12S9.7 5.9 12 3.5Z"/>',
  transfer: '<path d="M4 8.5h14.5M15 5l3.5 3.5L15 12M20 15.5H5.5M9 12l-3.5 3.5L9 19"/>',
  contactless: '<path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17"/><path d="M4.5 11a1.5 1.5 0 0 1 0 2"/>',
  bank: '<path d="M3.5 9.5 12 4.5l8.5 5h-17Z" class="d"/><path d="M3.5 9.5 12 4.5l8.5 5h-17ZM5.5 9.5v8M10 9.5v8M14 9.5v8M18.5 9.5v8M3 20h18"/>',
  dots: '<circle cx="12" cy="12" r="8.5" class="d"/><circle cx="12" cy="12" r="8.5"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.4"/>',
  music: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5" class="d"/><circle cx="16.5" cy="16" r="2.5" class="d"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
};

export const ICON_NAMES = Object.keys(P);

export function icon(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] ?? P.dots}</svg>`;
}

// A pastel tile holding an icon, tinted by area: diet, move, sleep, school, work, money.
export function tile(name, area = 'sleep', size = '') {
  return `<span class="tile ${size}" style="background:var(--${area}-bg);color:var(--${area}-ink)">${icon(name)}</span>`;
}

// Icons offered when creating a habit.
export const HABIT_ICONS = ['dumbbell', 'shaker', 'book', 'bed', 'moon', 'drop', 'walk', 'run', 'pill', 'leaf', 'noPhone', 'brain', 'sun', 'code', 'music', 'heart', 'pen', 'coffee', 'star', 'flame'];
