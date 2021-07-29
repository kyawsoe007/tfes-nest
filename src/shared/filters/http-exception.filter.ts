import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const message =
      exception.response.message || exception.message || exception;
    const error = exception.response.error;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: `${new Date().toLocaleTimeString()} , ${new Date().toLocaleDateString()}`,
      path: request.originalUrl,
      method: request.method,
      error,
      message,
    };

    Logger.error(
      `${request.method} ${request.originalUrl}, error: ${error} ${errorResponse.statusCode}, messsage: ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}
