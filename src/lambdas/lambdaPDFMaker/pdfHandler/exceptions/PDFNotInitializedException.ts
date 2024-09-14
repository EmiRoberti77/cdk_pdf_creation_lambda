const _message = 'PDF instance not created';
const _errorCode = 500;
const _details = 'call initPdf before creating document';

export class PDFNotInitializedException extends Error {
  public errorCode: number;
  public details: string;

  constructor(
    message: string = _message,
    errorCode: number = _errorCode,
    details: string = _details
  ) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errorCode = errorCode;
    this.details = details;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }

    this.logError();
  }
  public logError(): void {
    console.error(
      `${this.name} [${this.errorCode}]:${this.message}\nDetails${this.details}`
    );
  }
}
