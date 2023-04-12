import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPaginationOptions } from '@utils/types/pagination-options';

export const Paginate = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  const page = parseInt(request.query.page) || 1;
  const pageSize = parseInt(request.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return {
    page,
    pageSize,
    skip,
    take,
  } as IPaginationOptions;
});
