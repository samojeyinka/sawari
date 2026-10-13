export const HTTP = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  unprocessable: 422,
  tooMany: 429,
  internal: 500,
  notImplemented: 501,
  badGateway: 502,
  serviceUnavailable: 503,
} as const

export type HttpStatus = (typeof HTTP)[keyof typeof HTTP]

export interface AppErrorDetails {
  /** Field-level validation problems, keyed by request field. */
  fields?: Record<string, string[]>
  [key: string]: unknown
}

/**
 * Operational error that carries an HTTP status, an API error code and
 * optional details. Only `expose: true` errors surface their message to
 * clients; everything else becomes a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: HttpStatus
  readonly code: string
  readonly details: AppErrorDetails | undefined
  readonly expose: boolean

  constructor(
    message: string,
    statusCode: HttpStatus = HTTP.internal,
    code = 'internal_error',
    details?: AppErrorDetails,
    expose = false,
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.expose = expose
    if (details) this.details = details
  }
}

export const httpError = {
  badRequest: (message: string, code = 'bad_request', details?: AppErrorDetails) =>
    new AppError(message, HTTP.badRequest, code, details, true),
  unauthorized: (message: string, code = 'unauthorized', details?: AppErrorDetails) =>
    new AppError(message, HTTP.unauthorized, code, details, true),
  forbidden: (message: string, code = 'forbidden', details?: AppErrorDetails) =>
    new AppError(message, HTTP.forbidden, code, details, true),
  notFound: (message: string, code = 'not_found') =>
    new AppError(message, HTTP.notFound, code, undefined, true),
  conflict: (message: string, code = 'conflict', details?: AppErrorDetails) =>
    new AppError(message, HTTP.conflict, code, details, true),
  unprocessable: (message: string, code = 'validation_failed', details?: AppErrorDetails) =>
    new AppError(message, HTTP.unprocessable, code, details, true),
  tooMany: (message = 'Too many requests, slow down.') =>
    new AppError(message, HTTP.tooMany, 'rate_limited', undefined, true),
  notImplemented: (message: string, code = 'not_implemented') =>
    new AppError(message, HTTP.notImplemented, code, undefined, true),
  badGateway: (message: string, code = 'bad_gateway') =>
    new AppError(message, HTTP.badGateway, code, undefined, true),
  serviceUnavailable: (message: string, code = 'service_unavailable') =>
    new AppError(message, HTTP.serviceUnavailable, code, undefined, true),
}