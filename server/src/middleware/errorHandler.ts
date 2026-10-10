import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError, HTTP, type AppErrorDetails } from '../lib/AppError.js'
import { fail } from '../lib/ApiResponse.js'

/** Shape Zod field problems into { field: [messages] }. */
function zodFieldErrors(error: ZodError): AppErrorDetails['fields'] {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'request'
    ;(fields[key] ??= []).push(issue.message)
  }
  return fields
}

/** Central error boundary. Logs everything, but only exposes safe messages. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err)
    return
  }

  // Malformed JSON body (thrown by express.json).
  if (err instanceof SyntaxError && (err as { status?: number }).status === 400) {
    res.status(HTTP.badRequest).json(fail('malformed_json', 'Request body is not valid JSON.'))
    return
  }

  if (err instanceof ZodError) {
    res
      .status(HTTP.unprocessable)
      .json(fail('validation_failed', 'Request validation failed.', { fields: zodFieldErrors(err) }))
    return
  }

  if (err instanceof AppError && err.expose) {
    res.status(err.statusCode).json(fail(err.code, err.message, err.details))
    return
  }

  const maybe = err as { code?: number; name?: string; kind?: string }

  // Mongoose unique index violation → 409.
  if (maybe.code === 11000) {
    res.status(HTTP.conflict).json(fail('conflict', 'A record with that value already exists.'))
    return
  }

  // Malformed ObjectIds / failed casts → 400.
  if (maybe.name === 'CastError' || maybe.name === 'ValidationError') {
    res.status(HTTP.badRequest).json(fail('invalid_input', 'The request references invalid data.'))
    return
  }

  // Safety net: never let internal details leak.
  if (req.app.get('env') !== 'test') {
    console.error('[sawari-api] unhandled error:', err)
  }
  res
    .status(HTTP.internal)
    .json(fail('internal_error', 'Something went wrong on our side. Please try again.'))
}