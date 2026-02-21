import { Request, Response, NextFunction } from 'express';
import mongoose   from 'mongoose';
import { AppError } from '../utils/AppError';
import { env }      from '../config/env';

interface ErrorResponse {
  success:    false;
  statusCode: number;
  message:    string;
  timestamp:  string;
  path:       string;
  errors?:    Record<string, string>;
  stack?:     string;
}

const handleCastError = (err: mongoose.Error.CastError): AppError =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyError = (err: any): AppError => {
  const field   = Object.keys(err.keyValue)[0];
  const display = field.charAt(0).toUpperCase() + field.slice(1);
  return new AppError(`${display} already exists. Please use a different value.`, 409);
};

const handleValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).reduce((acc, curr) => {
    acc[curr.path] = curr.message;
    return acc;
  }, {} as Record<string, string>);

  const appErr = new AppError('Validation failed', 400);
  (appErr as any).errors = errors;
  return appErr;
};

export const errorHandler = (
  err:  any,
  req:  Request,
  res:  Response,
  next: NextFunction
): void => {
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  // Normalize Mongoose and JWT errors into AppErrors
  if (err instanceof mongoose.Error.CastError)       error = handleCastError(err);
  if (err.code === 11000)                             error = handleDuplicateKeyError(err);
  if (err instanceof mongoose.Error.ValidationError) error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')  error = new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError')  error = new AppError('Token expired. Please log in again.', 401);

  const statusCode = error.statusCode || 500;
  const message    = error.message    || 'Internal Server Error';

  const response: ErrorResponse = {
    success:    false,
    statusCode,
    message,
    timestamp:  new Date().toISOString(),
    path:       req.originalUrl,
  };

  if (error.errors)                          response.errors = error.errors;
  if (env.NODE_ENV === 'development')         response.stack  = err.stack;

  // Log 5xx errors server-side
  if (statusCode >= 500) {
    console.error(
      `[ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl} → ${statusCode}`,
      err
    );
  }

  res.status(statusCode).json(response);
};
