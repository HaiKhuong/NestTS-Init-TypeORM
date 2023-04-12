import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from './interfaces/transform-interface';
import { isArray } from 'class-validator';

function transform(data: any) {
  const response = {
    data,
    statusCode: HttpStatus.OK,
    code: 'E001',
    message: 'SUCCESS',
  };

  if (data && data['pagination'] && isArray(data['data'])) {
    const { total } = data['pagination'];
    delete data['pagination'].skip;
    delete data['pagination'].take;
    const totalPage = total / data['pagination'].pageSize;
    const lastPage = Math.floor(totalPage) < totalPage ? Math.floor(totalPage) + 1 : Math.floor(totalPage);

    data['pagination']['lastPage'] = lastPage;
    response['pagination'] = data['pagination'];
    response['data'] = data['data'];
    return response;
  }

  return response;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(transform));
  }
}
