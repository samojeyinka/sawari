import { cx } from '../../lib/utils'

type Tone = 'accent' | 'warm' | 'blue' | 'faint' | null

const toneClass: Record<Exclude<Tone, null>, string> = {
  accent: 'bg-accent-bright/[0.22]',
  warm: 'bg-warn-bright/[0.12]',
  blue: 'bg-[#5AAAD2]/[0.12]',
  faint: 'bg-on-band/[0.03]',
}

/**
 * Deterministic sparse fill. Same input, same pattern on every render, so the
 * lattice reads as a calm speckled grid instead of a shuffling mosaic.
 */
function toneAt(row: number, col: number, scale: 'fine' | 'bold'): Tone {
  const h =
    scale === 'fine'
      ? (row * 31 + col * 17 + ((row * col) % 5) * 13) % 100
      : (row * 53 + col * 29 + ((row * col) % 3) * 21) % 100
  const cuts = scale === 'fine' ? [9, 14, 18, 26] : [7, 12, 16, 22]
  if (h < cuts[0]) return 'accent'
  if (h < cuts[1]) return 'warm'
  if (h < cuts[2]) return 'blue'
  if (h < cuts[3]) return 'faint'
  return null
}

interface CellLatticeProps {
  cols: number
  rows: number
  /** Cell edge in px. The grid is exactly cols x rows x size. */
  size: number
  scale?: 'fine' | 'bold'
  /** Fill each cell the cursor passes over, then let it ease back. */
  interactive?: boolean
  className?: string
}

/**
 * CellLattice — the ruled, sparsely tinted grid of cells the product is built
 * around. Carries no background of its own; it sits on the navy band and only
 * draws the hairlines and the occasional coloured cell.
 */
export function CellLattice({
  cols,
  rows,
  size,
  scale = 'fine',
  interactive = false,
  className,
}: CellLatticeProps) {
  const cells = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ key: `${row}-${col}`, tone: toneAt(row, col, scale) })
    }
  }

  return (
    <div
      aria-hidden="true"
      className={cx('pointer-events-none grid', className)}
      style={{
        width: cols * size,
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridAutoRows: `${size}px`,
      }}
    >
      {cells.map((cell) => (
        <span
          key={cell.key}
          className={cx(
            'border-b border-r border-on-band/10',
            cell.tone && toneClass[cell.tone],
            interactive &&
              'pointer-events-auto transition-colors duration-300 ease-out hover:bg-accent-bright/[0.3]',
          )}
        />
      ))}
    </div>
  )
}
