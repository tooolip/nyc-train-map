// NYC Trains: an ASCII map of New York City at dusk, with trains stepping along their lines cell by cell.
// Pure string building: no DOM, nothing read from outside, the same string on every call.

const CELL_WIDTH = 16
const CELL_HEIGHT = 20
const COLUMNS = 100
const ROWS = 50
const WIDTH = COLUMNS * CELL_WIDTH
const HEIGHT = ROWS * CELL_HEIGHT

type Point = readonly [number, number]

interface Mark {
  x: number
  y: number
  glyph: string
}

interface Route {
  id: string
  /** The letter a train on this line carries. */
  letter: string
  colour: string
  /** The glyph of the track where it has no direction of its own, such as a ferry's wake. Absent, the track is drawn by direction. */
  track?: string
  /** Seconds a train rests on each cell. */
  pace: number
  trains: number
  stops: readonly Point[]
}

/** A deterministic hash to 0..1, so every build is the same. */
function hash(a: number, b: number, c: number): number {
  let value = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  value = (value ^ (value >>> 13)) * 1274126177
  value = value ^ (value >>> 16)
  return ((value >>> 0) % 100000) / 100000
}

// The land, as polygons on the character grid. The gaps between them are the rivers and the harbour.
const MANHATTAN: readonly Point[] = [[44, 2], [48, 2], [50, 6], [51, 12], [53, 20], [54, 27], [52, 32], [49, 37], [46, 38], [44, 34], [43, 26], [42, 16], [42, 8]]
const NEW_JERSEY: readonly Point[] = [[0, 0], [40, 0], [39, 8], [39, 18], [40, 28], [41, 35], [38, 41], [28, 43], [18, 50], [0, 50]]
const BRONX: readonly Point[] = [[51, 0], [100, 0], [100, 10], [88, 12], [76, 13], [64, 12], [57, 10], [54, 6], [52, 2]]
const LONG_ISLAND: readonly Point[] = [[58, 16], [66, 15], [80, 16], [100, 14], [100, 44], [90, 43], [78, 46], [66, 50], [53, 50], [51, 46], [53, 42], [54, 39], [57, 35], [58, 28], [57, 20]]
const STATEN_ISLAND: readonly Point[] = [[27, 46], [35, 45], [41, 47], [43, 50], [22, 50]]
const LAND: readonly (readonly Point[])[] = [MANHATTAN, NEW_JERSEY, BRONX, LONG_ISLAND, STATEN_ISLAND]

function isInside(polygon: readonly Point[], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] as Point
    const [xj, yj] = polygon[j] as Point
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function isLand(column: number, row: number): boolean {
  if (column < 0 || row < 0 || column >= COLUMNS || row >= ROWS) return true
  return LAND.some(polygon => isInside(polygon, column + 0.5, row + 0.5))
}

/** The big park in the middle of the island. */
function isPark(column: number, row: number): boolean {
  return column >= 46 && column <= 48 && row >= 11 && row <= 18
}

const ROUTES: readonly Route[] = [
  // PATH: Newark to the World Trade Center, and Hoboken up to 33rd Street
  { id: 'path', letter: 'P', colour: '#8f96c8', pace: 0.7, trains: 2, stops: [[0, 33], [14, 33], [24, 31], [36, 31], [40, 33], [46, 34]] },
  { id: 'hob', letter: 'P', colour: '#8f96c8', pace: 1, trains: 1, stops: [[38, 25], [40, 27], [45, 27], [46, 26], [46, 22]] },
  { id: 'si', letter: 'S', colour: '#7f9fd8', pace: 1.3, trains: 1, stops: [[25, 49], [31, 47], [39, 47]] },
  { id: 'ferry', letter: '@', colour: '#f0a040', track: '.', pace: 2.2, trains: 1, stops: [[40, 46], [44, 42], [47, 39]] },
  { id: 'g', letter: 'G', colour: '#6cbe45', pace: 1.2, trains: 2, stops: [[61, 21], [61, 30], [59, 35], [57, 41]] },
  { id: 'l', letter: 'L', colour: '#a7a9ac', pace: 1, trains: 2, stops: [[44, 28], [53, 28], [59, 29], [66, 32], [74, 36], [80, 41]] },
  { id: 'seven', letter: '7', colour: '#b933ad', pace: 0.9, trains: 3, stops: [[43, 23], [52, 23], [58, 21], [70, 19], [84, 17], [93, 16]] },
  { id: 'f', letter: 'F', colour: '#ff6319', pace: 0.9, trains: 3, stops: [[99, 22], [84, 22], [70, 24], [60, 19], [52, 19], [47, 21], [47, 30], [51, 32], [56, 35], [60, 41], [63, 49]] },
  { id: 'n', letter: 'N', colour: '#fccc0a', pace: 1, trains: 3, stops: [[63, 14], [58, 18], [54, 21], [48, 22], [48, 30], [51, 34], [56, 38], [58, 44], [60, 49]] },
  { id: 'six', letter: '6', colour: '#00933c', pace: 1.1, trains: 2, stops: [[86, 3], [70, 7], [57, 9], [52, 12], [51, 17], [51, 30]] },
  { id: 'four', letter: '4', colour: '#00933c', pace: 0.8, trains: 3, stops: [[59, 0], [55, 5], [52, 10], [50, 14], [50, 26], [50, 33], [49, 36], [55, 40], [62, 44], [71, 46]] },
  { id: 'a', letter: 'A', colour: '#2f6fe0', pace: 0.75, trains: 3, stops: [[45, 3], [44, 8], [44, 26], [46, 31], [50, 35], [56, 37], [64, 40], [78, 42], [92, 40], [99, 41]] },
  { id: 'one', letter: '1', colour: '#ee352e', pace: 1, trains: 3, stops: [[47, 2], [45, 6], [45, 24], [46, 30], [47, 36]] },
]

interface TrackCell extends Mark {
  isStation: boolean
}

/** Every cell a route passes, in order: a diagonal step while both axes differ, then straight on. */
function trace(route: Route): TrackCell[] {
  const cells: TrackCell[] = []
  for (let index = 0; index < route.stops.length - 1; index += 1) {
    const [fromX, fromY] = route.stops[index] as Point
    const [toX, toY] = route.stops[index + 1] as Point
    let x = fromX
    let y = fromY
    while (x !== toX || y !== toY) {
      const dx = Math.sign(toX - x)
      const dy = Math.sign(toY - y)
      const glyph = route.track ?? (dy === 0 ? '-' : dx === 0 ? '|' : dx * dy > 0 ? '\\' : '/')
      cells.push({ x, y, glyph, isStation: (x === fromX && y === fromY) || (cells.length % 5 === 0 && route.track === undefined) })
      x += dx
      y += dy
    }
  }
  const [lastX, lastY] = route.stops[route.stops.length - 1] as Point
  cells.push({ x: lastX, y: lastY, glyph: route.track ?? '-', isStation: true })
  return cells
}

function escapeGlyph(glyph: string): string {
  return glyph === '<' ? '&lt;' : glyph === '&' ? '&amp;' : glyph
}

/** ONE text element for a whole list of glyphs, each on its own grid cell whatever the font. */
function glyphs(list: readonly Mark[], colour: string, opacity: number, weight = 700): string {
  if (list.length === 0) return ''
  const xs = list.map(cell => cell.x * CELL_WIDTH + CELL_WIDTH / 2).join(' ')
  const ys = list.map(cell => cell.y * CELL_HEIGHT + 15).join(' ')
  const text = list.map(cell => escapeGlyph(cell.glyph)).join('')
  const faint = opacity < 1 ? ` fill-opacity="${opacity}"` : ''
  return `<text x="${xs}" y="${ys}" fill="${colour}"${faint} font-weight="${weight}">${text}</text>`
}

/** The coloured ground behind a list of cells: one rectangle per run of neighbours in a row. */
function tiles(list: readonly Mark[], colour: string, opacity: number): string {
  if (list.length === 0) return ''
  const rows = new Map<number, number[]>()
  for (const cell of list) {
    const row = rows.get(cell.y)
    if (row) row.push(cell.x)
    else rows.set(cell.y, [cell.x])
  }
  let path = ''
  for (const [y, columns] of rows) {
    columns.sort((left, right) => left - right)
    let start = columns[0] ?? 0
    let previous = start
    for (let index = 1; index <= columns.length; index += 1) {
      const column = columns[index]
      if (column !== undefined && column <= previous + 1) {
        previous = column
        continue
      }
      const width = (previous - start + 1) * CELL_WIDTH
      path += `M${start * CELL_WIDTH} ${y * CELL_HEIGHT}h${width}v${CELL_HEIGHT}h-${width}z`
      if (column === undefined) break
      start = column
      previous = column
    }
  }
  const faint = opacity < 1 ? ` fill-opacity="${opacity}"` : ''
  return `<path d="${path}" fill="${colour}"${faint}/>`
}

/** A name written across the map, a letter every `step` cells. */
function label(text: string, column: number, row: number, stepX: number, stepY: number): Mark[] {
  return [...text].map((glyph, index) => ({ x: column + index * stepX, y: row + index * stepY, glyph })).filter(mark => mark.glyph !== ' ')
}

const LABELS: readonly Mark[] = [
  ...label('NEW JERSEY', 8, 14, 2, 0),
  ...label('THE BRONX', 68, 3, 2, 0),
  ...label('QUEENS', 78, 28, 2, 0),
  ...label('BROOKLYN', 64, 38, 2, 0),
  ...label('STATEN IS', 26, 48, 1, 0),
  ...label('HUDSON', 41, 9, 0, 2),
  ...label('HARBOR', 42, 43, 1, 0),
  ...label('ATLANTIC', 82, 47, 2, 0),
]

/** The ground: water with a few drifting waves, land with a faint street grain, a lit shoreline and the park. */
function ground(): string {
  const taken = new Set(LABELS.map(mark => `${mark.x},${mark.y}`))
  const land: Mark[] = []
  const shore: Mark[] = []
  const park: Mark[] = []
  const grain: Mark[] = []
  const pines: Mark[] = []
  const waves: Mark[][] = [[], [], []]
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLUMNS; x += 1) {
      const chance = hash(x, y, 7)
      const isFree = !taken.has(`${x},${y}`)
      if (!isLand(x, y)) {
        if (isFree && chance < 0.2) (waves[Math.floor(hash(x, y, 11) * 3)] as Mark[]).push({ x, y, glyph: chance < 0.05 ? '=' : '~' })
        continue
      }
      if (isPark(x, y)) {
        park.push({ x, y, glyph: '' })
        pines.push({ x, y, glyph: chance < 0.6 ? '^' : '"' })
        continue
      }
      const isShore = !isLand(x - 1, y) || !isLand(x + 1, y) || !isLand(x, y - 1) || !isLand(x, y + 1)
      ;(isShore ? shore : land).push({ x, y, glyph: '' })
      if (isFree && chance < 0.3) grain.push({ x, y, glyph: chance < 0.04 ? '+' : chance < 0.14 ? ':' : '.' })
    }
  }
  return waves.map((list, index) => `<g class="wave w${index}">${glyphs(list, '#4a50a0', 1, 400)}</g>`).join('') +
    tiles(land, '#22245a', 0.9) + tiles(shore, '#33367a', 0.95) + tiles(park, '#134048', 1) +
    glyphs(grain, '#4a4e92', 1, 400) + glyphs(pines, '#5fae9c', 1) + glyphs(LABELS, '#8a8ec8', 0.85)
}

function tracks(): string {
  let lines = ''
  const stations: Mark[][] = [[], [], []]
  const seen = new Set<string>()
  for (const route of ROUTES) {
    const cells = trace(route)
    lines += glyphs(cells.filter(cell => !cell.isStation || route.track !== undefined), route.colour, route.track === undefined ? 0.8 : 0.5)
    if (route.track !== undefined) continue
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`
      if (!cell.isStation || seen.has(key)) continue
      seen.add(key)
      ;(stations[Math.floor(hash(cell.x, cell.y, 3) * 3)] as Mark[]).push({ x: cell.x, y: cell.y, glyph: 'o' })
    }
  }
  return lines + stations.map((list, index) => `<g class="stop s${index}">${glyphs(list, '#eef2ff', 1)}</g>`).join('')
}

/** The trains of a route: each a lit cell with the line's letter, stepping from cell to cell to the end of the line and back. */
function trains(route: Route): { frames: string; marks: string } {
  const cells = trace(route)
  const last = cells.length - 1
  let frames = `@keyframes run-${route.id}{`
  cells.forEach((cell, index) => {
    frames += `${Math.round((index / last) * 10000) / 100}%{transform:translate(${cell.x * CELL_WIDTH}px,${cell.y * CELL_HEIGHT}px)}`
  })
  frames += '}'
  const seconds = Math.round(cells.length * route.pace)
  let marks = ''
  for (let which = 0; which < route.trains; which += 1) {
    // where it rests when motion is off, and how far into the round trip it starts
    const rest = cells[Math.floor(((which + 0.5) / route.trains) * last)] as TrackCell
    const delay = Math.round(((which * 2) / route.trains + hash(which, last, 5) * 0.3) * seconds)
    const ink = route.track === undefined ? '#0e1030' : '#2a1400'
    frames += `.t-${route.id}-${which}{transform:translate(${rest.x * CELL_WIDTH}px,${rest.y * CELL_HEIGHT}px);animation:run-${route.id} ${seconds}s step-end -${delay}s infinite alternate}`
    marks += `<g class="t-${route.id}-${which}">` +
      `<rect x="-1" y="-1" width="${CELL_WIDTH + 2}" height="${CELL_HEIGHT + 2}" rx="2" fill="${route.colour}"/>` +
      `<text x="${CELL_WIDTH / 2}" y="15" fill="${ink}" font-weight="800">${escapeGlyph(route.letter)}</text></g>`
  }
  return { frames, marks }
}

export function nycTrainsSvg(): string {
  const fleet = ROUTES.map(trains)
  const style = `
text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle;font-size:17px}
.wave{animation:wave 18s ease-in-out infinite}
.stop{animation:stop 5s ease-in-out infinite}
.w1{animation-delay:-6s}.w2{animation-delay:-12s}.s1{animation-delay:-1.7s}.s2{animation-delay:-3.4s}
.dusk{animation:dusk 150s ease-in-out infinite alternate}
@keyframes wave{0%,100%{fill-opacity:.25;translate:0 0}50%{fill-opacity:.9;translate:10px 0}}
@keyframes stop{0%,100%{fill-opacity:.55}50%{fill-opacity:1}}
@keyframes dusk{from{transform:translateX(-300px);fill-opacity:.5}to{transform:translateX(260px);fill-opacity:1}}
${fleet.map(each => each.frames).join('\n')}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}`

  const defs = `
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141640"/><stop offset="0.6" stop-color="#181a48"/><stop offset="1" stop-color="#1e1c50"/></linearGradient>
<radialGradient id="rose" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#a8607a" stop-opacity="0.26"/><stop offset="0.5" stop-color="#9e5c7a" stop-opacity="0.12"/><stop offset="1" stop-color="#8c567a" stop-opacity="0"/></radialGradient>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" font-family="monospace"><style>${style}</style><defs>${defs}</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#water)"/>
${ground()}
<g class="dusk"><ellipse cx="800" cy="560" rx="700" ry="320" fill="url(#rose)"/></g>
${tracks()}
${fleet.map(each => each.marks).join('')}
</svg>`
}
