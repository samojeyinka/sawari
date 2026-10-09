const COLS = 14
const ROWS = 26
const CELL = 56

type Tone = 'accent' | 'warm' | 'cream' | 'empty'

/**
 * Deterministic sparse fill so a scattered set of cells reads as a calm
 * chessboard rather than uniformly spaced dots. Same input, same pattern on
 * every render — the layout never shuffles between visits.
 */
function toneFor(row: number, col: number): Tone {
  const h = (row * 37 + col * 19 + ((row * col) % 7) * 11) % 100
  if (h < 8) return 'accent'
  if (h < 13) return 'warm'
  if (h < 17) return 'cream'
  return 'empty'
}

const toneClass: Record<Tone, string> = {
  accent: 'bg-accent-bright/[0.1]',
  warm: 'bg-warn-bright/[0.08]',
  cream: 'bg-on-band/[0.045]',
  empty: '',
}

const cells = Array.from({ length: ROWS * COLS }, (_, i) => {
  const row = Math.floor(i / COLS)
  const col = i % COLS
  return { key: `${row}-${col}`, tone: toneFor(row, col) }
})

/**
 * HeroGrid — colored, interactive cells that live inside the hero's existing
 * ruled frame (the `.hero-grid` lines). It carries no border of its own; cells
 * are aligned to the same 56px lattice and anchored to the right edge, so the
 * colour only appears on the right. Sweeping the cursor fills each cell it
 * passes, then the fill eases back on its own.
 */
export function HeroGrid() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden overflow-hidden lg:block" aria-hidden="true">
      <div
        className="grid"
        style={{
          width: COLS * CELL,
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          maskImage: 'radial-gradient(140% 130% at 100% 22%, #000 28%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(140% 130% at 100% 22%, #000 28%, transparent 78%)',
        }}
      >
        {cells.map((cell) => (
          <span
            key={cell.key}
            className={`pointer-events-auto h-14 w-14 transition-colors duration-300 ease-out hover:bg-accent-bright/[0.22] ${toneClass[cell.tone]}`}
          />
        ))}
      </div>
    </div>
  )
}
