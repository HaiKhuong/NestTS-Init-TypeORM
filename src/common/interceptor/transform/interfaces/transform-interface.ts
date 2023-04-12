export interface Response<T> {
  statusCode: number;
  code: string;
  message: string;
  pagination?;
  data: T;
}
