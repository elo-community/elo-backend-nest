import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(tap(() => {
            const now = Date.now();

            const request = context.switchToHttp().getRequest();
            const { method, url, body, params, query } = request;

            this.logger.log(`[REQUEST] ${method} ${url} ${JSON.stringify(body)} ${JSON.stringify(params)} ${JSON.stringify(query)}`);

            return next.handle().pipe(tap(() => {
                tap((resBody) => {
                    this.logger.log(`[RESPONSE] ${method} ${url} ${JSON.stringify(resBody)} ${Date.now() - now}ms`);
                }),
                    catchError((err) => {
                        this.logger.error(`[ERROR] ${method} ${url} ${JSON.stringify(err)}`);
                        return throwError(() => err);
                    })
            }));
        }));
    }
}