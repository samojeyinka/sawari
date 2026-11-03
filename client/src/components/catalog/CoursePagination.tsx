export function CoursePagination({ page, pages, onPageChange }: { page: number; pages: number; onPageChange: (page: number) => void }) {
  if (pages <= 1) return null
  const first = Math.max(1, Math.min(page - 2, pages - 4))
  const last = Math.min(pages, first + 4)
  const pageNumbers = Array.from({ length: last - first + 1 }, (_, index) => first + index)

  return (
    <nav className="catalog-pagination" aria-label="Course pages">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Previous</button>
      <div className="catalog-page-numbers">
        {first > 1 && <><button type="button" onClick={() => onPageChange(1)}>1</button>{first > 2 && <span aria-hidden="true">…</span>}</>}
        {pageNumbers.map((number) => (
          <button type="button" key={number} className={number === page ? 'is-current' : ''} aria-current={number === page ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>
        ))}
        {last < pages && <>{last < pages - 1 && <span aria-hidden="true">…</span>}<button type="button" onClick={() => onPageChange(pages)}>{pages}</button></>}
      </div>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>Next</button>
    </nav>
  )
}
