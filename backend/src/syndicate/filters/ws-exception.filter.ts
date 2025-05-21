import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    let errorResponse: { status: number; message: string; code?: string };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      // Если response - это объект, он может содержать несколько ошибок
      if (typeof response === 'object' && response !== null && 'message' in response) {
        errorResponse = {
          status: status,
          message: Array.isArray((response as any).message)
            ? (response as any).message.join(', ')
            : String((response as any).message),
          code: (response as any).code || exception.name, // Добавляем code, если есть
        };
      } else {
        errorResponse = {
          status: status,
          message: response.toString(),
          code: exception.name,
        };
      }
    } else if (exception instanceof WsException) {
      // WsException уже предназначены для WebSocket
      const error = exception.getError();
      if (typeof error === 'object' && error !== null) {
        errorResponse = {
          status: (error as any).status || 500,
          message: (error as any).message || 'WebSocket error',
          code: (error as any).code || 'WsException',
        };
      } else {
        errorResponse = { status: 500, message: error.toString(), code: 'WsException' };
      }
    } else {
      // Неизвестные ошибки
      this.logger.error(`Unhandled WebSocket exception: ${exception}`);
      errorResponse = { status: 500, message: 'Internal server error', code: 'InternalError' };
    }

    // Отправляем ошибку обратно клиенту
    client.emit('exception', errorResponse);
  }
}
