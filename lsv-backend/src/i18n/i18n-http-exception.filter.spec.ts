import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { I18nHttpExceptionFilter } from './i18n-http-exception.filter';

function mockHost(acceptLanguage?: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({
        headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
      }),
    }),
  };
  return { host, json, status };
}

describe('I18nHttpExceptionFilter', () => {
  const filter = new I18nHttpExceptionFilter();

  it('adds a business code when the message is an i18n key', () => {
    const { host, json, status } = mockHost('es');
    filter.catch(
      new HttpException('errors.quiz.notFound', HttpStatus.NOT_FOUND),
      host as never,
    );
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Quiz no encontrado',
      code: 'QUIZ_NOT_FOUND',
    });
  });

  it('adds VALIDATION_ERROR and field details for ValidationPipe bodies', () => {
    const { host, json } = mockHost('en');
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['email must be an email'],
      }),
      host as never,
    );
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email'],
      code: 'VALIDATION_ERROR',
      details: [{ field: 'email', message: 'email must be an email' }],
    });
  });
});
