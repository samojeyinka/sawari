/**
 * Normalises a mongoose document (lean object or `toObject()` output) for
 * the API: `_id` → `id`, and internal-only fields removed. Keeps every
 * controller free of ad-hoc mapping and guarantees we never leak `userId`.
 */
export function serialize(doc: object): Record<string, unknown> {
  const result = { ...(doc as Record<string, unknown>) }
  if (result._id !== undefined) {
    result.id = String(result._id)
    delete result._id
  }
  delete result.__v
  delete result.userId
  return result
}