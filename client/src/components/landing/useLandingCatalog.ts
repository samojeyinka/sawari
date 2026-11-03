import { useEffect, useState } from 'react'
import { catalogApi, type ApiCatalogCategories, type ApiCatalogPath } from '../../lib/api'

interface LandingCatalogData {
  categories: ApiCatalogCategories['categories']
  courses: ApiCatalogPath[]
}

interface LandingCatalogState extends LandingCatalogData {
  isLoading: boolean
}

let cachedData: LandingCatalogData | null = null
let cachedAt = 0
let request: Promise<LandingCatalogData> | null = null
const CACHE_TTL_MS = 60_000

function loadLandingCatalog(): Promise<LandingCatalogData> {
  if (cachedData && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cachedData)
  if (request) return request

  request = Promise.allSettled([
    catalogApi.categories(),
    catalogApi.list({ sort: '-enrollments', limit: 100 }),
  ]).then(([categoryResult, courseResult]) => {
    if (categoryResult.status === 'rejected' && courseResult.status === 'rejected') {
      throw categoryResult.reason
    }
    const data = {
      categories: categoryResult.status === 'fulfilled' ? categoryResult.value.categories : [],
      courses: courseResult.status === 'fulfilled' ? courseResult.value.items : [],
    }
    cachedData = data
    cachedAt = Date.now()
    return data
  }).finally(() => {
    request = null
  })

  return request
}

export function useLandingCatalog(): LandingCatalogState {
  const [state, setState] = useState<LandingCatalogState>(() => ({
    categories: cachedData?.categories ?? [],
    courses: cachedData?.courses ?? [],
    isLoading: !cachedData,
  }))

  useEffect(() => {
    let isMounted = true
    loadLandingCatalog()
      .then((data) => {
        if (isMounted) setState({ ...data, isLoading: false })
      })
      .catch(() => {
        if (isMounted) setState({ categories: [], courses: [], isLoading: false })
      })
    return () => { isMounted = false }
  }, [])

  return state
}
