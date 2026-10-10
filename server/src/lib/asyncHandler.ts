import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** Wraps an async handler so rejections reach the error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}