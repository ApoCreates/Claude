/* Hairline mark set — 24×24, stroke only, no fill, no shadow. Used in the toolkit cards. */
const I = (b) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
  stroke-linecap="square" stroke-linejoin="miter">${b}</svg>`;

export const ICONS = {
  waves:   I(`<circle cx="6" cy="12" r="2"/><path d="M11 8a6 6 0 0 1 0 8M15 5a10 10 0 0 1 0 14M19 3a14 14 0 0 1 0 18"/>`),
  room:    I(`<circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2.4"/><path d="M3 19v-2a4 4 0 0 1 4-4M21 19v-2a4 4 0 0 0-4-4M9 19h6"/>`),
  dial:    I(`<path d="M3 7h18M3 12h18M3 17h18"/><rect x="6" y="4.5" width="3" height="5"/><rect x="13" y="9.5" width="3" height="5"/><rect x="9" y="14.5" width="3" height="5"/>`),
  brackets:I(`<path d="M9 4H5v16h4M15 4h4v16h-4"/><path d="M12 9v6"/>`),
  link:    I(`<path d="M10 14a4 4 0 0 1 0-5.6l2.4-2.4a4 4 0 0 1 5.6 5.6L16.6 13"/><path d="M14 10a4 4 0 0 1 0 5.6l-2.4 2.4a4 4 0 0 1-5.6-5.6L7.4 11"/>`),
  target:  I(`<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>`),
  eye:     I(`<path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>`),
  cut:     I(`<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M7.6 16.2 18 4M16.4 16.2 6 4"/>`),
  triple:  I(`<path d="M4 6h16M4 12h11M4 18h6"/><circle cx="20" cy="18" r="1.6"/>`),
  one:     I(`<rect x="3" y="4" width="18" height="16"/><rect x="8" y="9" width="8" height="6" fill="currentColor" stroke="none"/>`),
  list:    I(`<path d="M4 6h16M4 12h16M4 18h16"/><path d="M17 4.5 20 7.5M20 4.5 17 7.5"/>`),
  breath:  I(`<path d="M2 12c3-7 5.5 7 8.5 0S16 5 19 12s3 0 3 0"/>`),
  swatch:  I(`<rect x="3" y="3" width="11" height="11"/><rect x="10" y="10" width="11" height="11"/>`),
  ratio:   I(`<rect x="2" y="8" width="20" height="8"/><path d="M16 8v8M19.5 8v8"/>`),
  corner:  I(`<path d="M4 20V4h16"/><rect x="9" y="9" width="8" height="8"/>`),
  space:   I(`<path d="M3 3h5M16 3h5M3 21h5M16 21h5M3 3v5M21 3v5M3 16v5M21 16v5"/>`),
  code:    I(`<path d="M8.5 8 4 12l4.5 4M15.5 8 20 12l-4.5 4M13.5 5l-3 14"/>`),
  page:    I(`<path d="M5 3h9l5 5v13H5Z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/>`),
  cursor:  I(`<path d="M5 3l14 8-6 1.6L10.6 19Z"/>`),
  node:    I(`<rect x="9" y="2" width="6" height="5"/><path d="M12 7v4M4 15v-2h16v2"/><path d="M4 15v3M12 11v7M20 15v3"/>`),
  type:    I(`<path d="M4 19h16"/><path d="M8 15 12 4l4 11"/><path d="M9.4 11.5h5.2"/>`),
  rtl:     I(`<path d="M21 8H5l4-4M3 16h16l-4 4"/>`),
  mix:     I(`<path d="M3 6h8M13 6h8M3 12h5M10 12h11M3 18h11M16 18h5"/>`),
  pixels:  I(`<path d="M4 5h2M10 5h2M16 5h2M4 11h2M10 11h2M16 11h2M4 17h2M10 17h2M16 17h2M7 8h2M13 8h2M19 8h2M7 14h2M13 14h2M19 14h2"/>`),
  search:  I(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.2 15.2 21 21"/>`),
  frame:   I(`<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><path d="M8 12h8"/>`),
  contrast:I(`<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" stroke="none"/>`),
  note:    I(`<path d="M5 3h14v18H5Z"/><path d="M9 8h6M9 12h6"/><path d="M9 16.5l2 2 4-4"/>`),
};
