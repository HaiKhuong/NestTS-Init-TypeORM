import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

interface ResponseException {
  code: string;
  message: string;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse() as ResponseException;
    const errorException = exceptionResponse['errors'];

    response.status(status).json({
      statusCode: status,
      code: exceptionResponse?.code || 'E002',
      message: errorException || exceptionResponse?.message || 'FAIL',
    });
  }
}
