/* ------------------------------------------------------------------ */
/*  API envelope: every response goes through one shape.               */
/*     success: { success:true,  data, meta? }                        */
/*     error:   { success:false, error:{ code, message, details? } }  */
/* ------------------------------------------------------------------ */

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: object
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

export function ok<T>(data: T, meta?: object): ApiSuccess<T> {
  return meta ? { success: true, data, meta } : { success: true, data }
}

export function fail(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return { success: false, error: { code, message, ...(details ? { details } : {}) } }
}