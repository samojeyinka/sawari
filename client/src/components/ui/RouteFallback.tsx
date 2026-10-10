import { LuLoaderCircle } from 'react-icons/lu'

export function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LuLoaderCircle className="h-6 w-6 animate-spin text-muted" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
