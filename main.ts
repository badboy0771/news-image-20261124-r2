// The World in One Day — 24 November 2026 (Front Page)
// make.fun news-image-20261124 — Round 2 entry.
// Pure Node 22 stdlib only. No network, no external files, no clock,
// no randomness. Two runs write byte-identical PNGs.
// Output: $MAKEFUN_OUTPUT_DIR/entry.png (default /output).

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// Palette — ink on paper.
const PAPER = [244, 238, 222, 255];
const PANEL = [236, 228, 206, 255];
const INK = [22, 32, 54, 255];
const MUTED = [96, 102, 118, 255];
const RED = [178, 34, 34, 255];
const GOLD = [176, 138, 52, 255];
const GRAT = [198, 188, 164, 255];
const LAND = [34, 48, 80, 255];
const WHITE = [255, 255, 255, 255];

const px = new Uint8Array(W * H * 4);

function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = c[3];
}

function fillRect(x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}

function hline(x0, x1, y, c, t = 1) {
  for (let t0 = 0; t0 < t; t0++) {
    for (let x = x0; x <= x1; x++) setPixel(x, y + t0, c);
  }
}

function vline(x, y0, y1, c, t = 1) {
  for (let t0 = 0; t0 < t; t0++) {
    for (let y = y0; y <= y1; y++) setPixel(x + t0, y, c);
  }
}

function strokeRect(x, y, w, h, c, t = 1) {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function fillCircle(cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPixel(x, y, c);
    }
  }
}

function ring(cx, cy, r, c, t = 2) {
  for (let y = cy - r - 1; y <= cy + r + 1; y++) {
    for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (d >= r - t / 2 && d <= r + t / 2) setPixel(x, y, c);
    }
  }
}

// ---- 5x7 bitmap font, uppercase only. Each glyph: 7 rows of 5 bits. ----
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "\u2022": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
};

function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}

function drawText(text, x, y, scale, color) {
  const s = String(text).toUpperCase();
  let cx = x;
  for (const ch of s) {
    const glyph = FONT[ch] || FONT["?"];
    for (let r = 0; r < 7; r++) {
      const row = glyph[r];
      for (let c0 = 0; c0 < 5; c0++) {
        if (row[c0] === "1") {
          fillRect(cx + c0 * scale, y + r * scale, scale, scale, color);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentred(text, cx, y, scale, color) {
  const w = textWidth(String(text).toUpperCase(), scale);
  drawText(text, Math.round(cx - w / 2), y, scale, color);
}

// ---- Map projection: equirectangular over the map band. ----
const MAP = { x0: 32, y0: 180, x1: 992, y1: 440 };
function proj(lon, lat) {
  const x = MAP.x0 + ((lon + 180) / 360) * (MAP.x1 - MAP.x0);
  const y = MAP.y0 + ((75 - lat) / 260) * (MAP.y1 - MAP.y0);
  return [Math.round(x), Math.round(y)];
}

// Scanline polygon fill.
function fillPolygon(points, color) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of points) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(H - 1, Math.floor(maxY)); y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) {
        setPixel(x, y, color);
      }
    }
  }
}

// Bresenham line — used for thin paper outlines around landmasses so
// neighbouring continents stay readable against the panel.
function drawLine(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPixel(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function strokePolygon(points, color) {
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    drawLine(x1, y1, x2, y2, color);
  }
}

// Continents as [lon, lat] polygons (simplified, recognisable).
const CONTINENTS = [
  // North America
  [[-168, 66], [-165, 60], [-158, 58], [-152, 60], [-140, 60], [-135, 57], [-130, 54], [-125, 49], [-124, 42], [-120, 34], [-114, 29], [-110, 24], [-105, 20], [-97, 16], [-94, 17], [-90, 14], [-86, 12], [-83, 9], [-80, 9], [-77, 8], [-77, 25], [-80, 32], [-76, 35], [-74, 40], [-70, 42], [-68, 44], [-65, 44], [-60, 47], [-55, 47], [-53, 50], [-60, 52], [-65, 55], [-68, 58], [-75, 62], [-80, 66], [-85, 66], [-90, 68], [-95, 69], [-110, 68], [-125, 70], [-140, 70], [-155, 71], [-165, 68]],
  // Greenland
  [[-58, 64], [-52, 60], [-43, 60], [-40, 64], [-32, 68], [-22, 70], [-20, 74], [-25, 78], [-35, 80], [-50, 80], [-58, 76], [-60, 74], [-58, 70]],
  // South America
  [[-80, 9], [-77, 4], [-80, -3], [-81, -6], [-77, -12], [-72, -18], [-70, -23], [-70, -30], [-72, -37], [-73, -44], [-74, -50], [-70, -54], [-66, -55], [-65, -50], [-62, -45], [-58, -38], [-57, -30], [-48, -28], [-41, -23], [-39, -17], [-35, -9], [-35, -6], [-40, -3], [-44, -2], [-50, 0], [-53, 4], [-58, 6], [-62, 9], [-70, 11], [-75, 10]],
  // Africa
  [[-6, 35], [-10, 31], [-15, 27], [-17, 21], [-17, 15], [-15, 11], [-12, 8], [-8, 5], [-4, 5], [0, 6], [6, 4], [9, 4], [9, 0], [12, -4], [13, -10], [12, -17], [14, -22], [16, -28], [19, -34], [25, -34], [28, -32], [32, -28], [35, -24], [36, -18], [40, -15], [40, -10], [42, -4], [46, 0], [51, 2], [51, 10], [48, 11], [44, 11], [40, 15], [38, 18], [37, 22], [34, 27], [32, 31], [30, 32], [25, 32], [20, 32], [15, 32], [10, 34], [5, 37], [-1, 35]],
  // Eurasia
  [[-10, 36], [-9, 43], [-2, 44], [-1, 46], [-4, 48], [0, 50], [3, 52], [7, 54], [8, 57], [10, 59], [6, 60], [5, 62], [10, 64], [14, 67], [18, 69], [24, 71], [30, 70], [35, 68], [42, 68], [48, 68], [54, 69], [60, 69], [66, 70], [70, 72], [75, 73], [80, 73], [85, 74], [95, 76], [105, 77], [113, 74], [120, 73], [128, 72], [135, 71], [142, 72], [150, 70], [158, 70], [166, 69], [173, 67], [178, 65], [178, 62], [170, 60], [162, 60], [160, 55], [156, 51], [150, 50], [142, 50], [141, 45], [138, 43], [135, 43], [130, 42], [127, 39], [126, 38], [122, 38], [120, 34], [122, 30], [120, 25], [117, 23], [112, 21], [108, 19], [106, 15], [104, 9], [102, 7], [100, 6], [98, 10], [97, 16], [94, 17], [92, 21], [89, 22], [87, 21], [84, 19], [81, 16], [80, 13], [77, 8], [76, 10], [73, 16], [72, 20], [70, 22], [67, 25], [66, 25], [62, 25], [58, 26], [57, 27], [56, 27], [54, 26], [52, 26], [50, 29], [48, 30], [47, 30], [44, 29], [41, 28], [39, 25], [37, 22], [35, 20], [36, 36], [33, 36], [30, 36], [27, 37], [23, 36], [20, 38], [18, 40], [15, 38], [12, 38], [10, 37], [8, 39], [6, 37], [3, 37], [0, 36], [-2, 35], [-5, 35], [-6, 36]],
  // Australia
  [[113, -22], [114, -30], [115, -33], [118, -35], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [136, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20]],
  // UK
  [[-5, 50], [-3, 53], [-5, 56], [-3, 58], [-1, 57], [0, 53], [1, 51], [-2, 50]],
  // Japan
  [[130, 31], [132, 33], [134, 34], [137, 35], [139, 35], [140, 38], [141, 41], [143, 42], [145, 44], [143, 45], [141, 44], [140, 40], [139, 37], [137, 36], [134, 34], [131, 33]],
  // Indonesia
  [[95, 5], [98, 3], [100, 0], [102, -3], [104, -5], [106, -6], [108, -7], [110, -7], [112, -7], [114, -8], [116, -8], [118, -9], [120, -10], [122, -9], [124, -10], [126, -8], [128, -4], [130, -3], [132, -1], [134, -2], [136, -2], [138, -4], [140, -6], [141, -8], [138, -8], [136, -6], [134, -4], [132, -2], [130, 0], [128, 2], [126, 1], [124, 0], [122, 1], [120, 0], [118, 0], [116, 1], [114, 1], [112, 0], [110, -1], [108, -2], [106, -3], [104, -1], [102, 1], [100, 2], [98, 4]],
  // New Guinea
  [[131, -1], [134, -2], [136, -2], [138, -3], [140, -3], [142, -4], [144, -5], [146, -6], [148, -8], [150, -10], [147, -9], [145, -7], [142, -8], [140, -8], [137, -6], [134, -4]],
  // Madagascar
  [[44, -16], [47, -15], [50, -16], [50, -20], [48, -24], [45, -25], [43, -22], [43, -18]],
  // New Zealand
  [[167, -45], [170, -42], [173, -41], [175, -38], [177, -38], [178, -37], [175, -40], [173, -42], [170, -45], [167, -46], [166, -46]],
];

const STORIES = [
  { head: "COP31 COLLAPSES", sub1: "CLIMATE TALKS END WITH NO DEAL", sub2: "NO FOSSIL FUEL DEAL IN ANTALYA", pin: [30.7, 36.9] },
  { head: "US MARKETS TUMBLE", sub1: "WALL ST SLIDES AFTER MIDTERMS", sub2: "$1 TRILLION WIPED OUT IN A DAY", pin: [-74, 41] },
  { head: "FIRE IN CIKANDE", sub1: "AT LEAST 24 DEAD IN BANTEN", sub2: "AROUND 30 STILL MISSING", pin: [106.3, -6.2] },
  { head: "STRIKES HIT KYIV", sub1: "RUSSIAN ATTACK KILLS SEVERAL", sub2: "SEVERAL KILLED, MORE MISSING", pin: [30.5, 50.4] },
  { head: "INDIA-NEPAL PACT", sub1: "MODI AND SHAH SIGN 8 DEALS", sub2: "RS 15,000 CRORE PACKAGE", pin: [83, 30] },
  { head: "SEOUL RESHUFFLE", sub1: "NEW FOREIGN MINISTER NAMED", sub2: "INTEL CHIEF ALSO REPLACED", pin: [127, 37.5] },
  { head: "HASINA FACES ARREST", sub1: "DHAKA VOWS ARREST ON RETURN", sub2: "EX-PM IN EXILE IN INDIA", pin: [92, 21] },
  { head: "INDIA-NZ TEST DRAWN", sub1: "FIRST TEST ENDS IN A DRAW", sub2: "NEW ZEALAND 239 FOR 5", pin: [170, -41] },
];

// ---- CRC32 + PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0; // filter: none
    Buffer.from(px.buffer, y * W * 4, W * 4).copy(raw, y * (1 + W * 4) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Compose the page ----
function main() {
  // Paper + outer frame.
  fillRect(0, 0, W, H, PAPER);
  strokeRect(14, 14, 996, 996, INK, 3);

  // Masthead.
  drawTextCentred("THE WORLD IN ONE DAY", 512, 36, 5, INK);
  hline(32, 992, 84, INK, 2);
  drawTextCentred("TUESDAY, 24 NOVEMBER 2026 - EIGHT STORIES THAT DEFINED THE DAY", 512, 94, 2, MUTED);
  hline(32, 992, 120, INK, 3);
  hline(32, 992, 126, INK, 1);
  // Gold hairline between the double rule and the top-line strip — the
  // single warm accent on the page, echoing the gold in the palette.
  hline(32, 992, 132, GOLD, 1);

  // Top-line strip.
  drawText("TOP LINE", 32, 140, 2, RED);
  drawText("COP31 COLLAPSES - WALL ST LOSES $1 TRILLION - CIKANDE FIRE KILLS 24", 140, 140, 2, INK);
  hline(32, 992, 168, INK, 1);

  // Map band.
  fillRect(MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, PANEL);
  // Graticule every 30 degrees.
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = proj(lon, 0);
    vline(x, MAP.y0, MAP.y1, GRAT, 1);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = proj(0, lat);
    hline(MAP.x0, MAP.x1, y, GRAT, 1);
  }
  // Continents: navy fill, then a 1px paper outline so coastlines read
  // against the panel and against each other (Eurasia / Africa / Arabia).
  for (const poly of CONTINENTS) {
    const pts = poly.map(([lon, lat]) => proj(lon, lat));
    fillPolygon(pts, LAND);
    strokePolygon(pts, PAPER);
  }
  strokeRect(MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, INK, 2);
  // Pins (numbered, red disc + white ring + red ring).
  STORIES.forEach((s, i) => {
    const [x, y] = proj(s.pin[0], s.pin[1]);
    fillCircle(x, y, 16, RED);
    fillCircle(x, y, 13, RED);
    ring(x, y, 13, WHITE, 2);
    ring(x, y, 16, RED, 1);
    const num = String(i + 1);
    const w = textWidth(num, 2);
    drawText(num, x - Math.floor(w / 2), y - 7, 2, WHITE);
  });
  // Map captions inside the band, bottom row.
  drawText("EVERY NUMBER IS A STORY BELOW", 40, 424, 1, MUTED);
  const atlas = "ATLAS OF ONE DAY";
  drawText(atlas, 992 - 8 - textWidth(atlas, 1), 424, 1, MUTED);

  // Story grid: 2 cols x 4 rows.
  const CARD_W = 464;
  const CARD_H = 118;
  const GAP = 12;
  const colX = [32, 528];
  const rowY = [456, 586, 716, 846];
  // Column-major order: left col 1,3,5,7 top-down; right col 2,4,6,8.
  const order = [0, 2, 4, 6, 1, 3, 5, 7];
  order.forEach((idx, pos) => {
    const col = pos < 4 ? 0 : 1;
    const row = pos % 4;
    const x = colX[col];
    const y = rowY[row];
    const s = STORIES[idx];
    fillRect(x, y, CARD_W, CARD_H, PANEL);
    // 1px ink frame so each card holds its edge on the paper; the red
    // top bar is drawn after it so the bar stays unbroken.
    strokeRect(x, y, CARD_W, CARD_H, INK, 1);
    fillRect(x, y, CARD_W, 3, RED);
    // Red number badge.
    fillRect(x + 14, y + 14, 36, 36, RED);
    const num = String(idx + 1);
    const nw = textWidth(num, 3);
    drawText(num, x + 14 + Math.floor((36 - nw) / 2), y + 14 + 7, 3, WHITE);
    // Headline + sub-lines.
    drawText(s.head, x + 62, y + 16, 3, INK);
    drawText(s.sub1, x + 62, y + 52, 2, MUTED);
    drawText(s.sub2, x + 62, y + 78, 2, MUTED);
  });

  // Footer.
  hline(32, 992, 978, INK, 1);
  drawTextCentred("MAKE.FUN - ONE DAY, ONE PICTURE", 512, 988, 1, MUTED);

  const png = encodePNG();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
