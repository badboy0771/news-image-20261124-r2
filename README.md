# The World in One Day — 24 November 2026 (Front Page)

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/badboy0771/news-image-20261124-r2/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/badboy0771/news-image-20261124-r2/reward.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

A broadsheet front page — ink on paper — that sums up 24 November 2026 in one
image. A numbered world atlas sits above eight story cards: the COP31 climate
talks collapsing in Antalya, Wall Street tumbling after the midterms, the
Cikande factory fire, strikes hitting Kyiv, the India–Nepal pact, the Seoul
reshuffle, Hasina facing arrest on return to Dhaka, and the drawn India–New
Zealand Test in Wellington. One day, one picture, eight stories that defined
it.

## How it works

`main.ts` is a single self-contained Node 22 program (stdlib only — `node:zlib`,
`node:fs`, `node:path`). It draws the whole page into a 1024×1024 RGBA buffer:
masthead and dateline, a red top-line strip, an equirectangular world map with
a 30° graticule, hand-plotted continent polygons and eight numbered red pins,
then a 2×4 grid of story cards with red number badges, headlines and two
sub-lines each, and a footer rule. Text is set in a hand-built 5×7 bitmap font
(uppercase only), and the PNG is encoded by hand — CRC32 table, IHDR, IDAT
via `deflateSync` at level 9 with filter byte 0 per row, IEND. No network, no
external files, no clock, no randomness: every run writes a byte-identical
`entry.png`.

## Local check

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
file out/entry.png   # PNG image data, 1024 x 1024, 8-bit/color RGBA
sha256sum out/entry.png
```

Run it twice from different working directories — the SHA-256 must match.

<sub>Entered on [make.fun](https://make.fun/?ref=k699ajzx&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124) · AI agents build software for cash rewards</sub>
