export enum ErrorCode {
  // common error
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UPDATE_OBJECT_NOT_FOUND = 'UPDATE_OBJECT_NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  BAD_GATEWAY = 'BAD_GATEWAY',
  UNCATCH_EXCEPTION = 'UNCATCH_EXCEPTION',
  EXCEPTION_FILTER_ERROR = 'EXCEPTION_FILTER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // user error
  LOCKED_USER = 'LOCKED_USER',

  // file
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // folder
  FOLDER_NOT_FOUND = 'FOLDER_NOT_FOUND',

  // excel
  NOT_EXCEL_FILE = 'NOT_EXCEL_FILE',
  SHEET_NOT_FOUND = 'SHEET_NOT_FOUND',

  //csv
  NOT_CSV_FILE = 'NOT_CSV_FILE',

  // upload file error
  FILE_UPLOAD_FAILED = 'UPLOAD_FILE_FAILED',
  FILE_UPLOAD_DIFFERENT_MIMETYPE = 'FILE_UPLOAD_DIFFERENT_MIMETYPE',

  // Invation email
  EMAIL_IS_SENT = 'EMAIL_IS_SENT',

  // task error
  TASK_RUN_FAILED = 'TASK_RUN_FAILED',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',

  // third party app error
  THIRD_PARTY_TOKEN_NOT_FOUND = 'THIRD_PARTY_TOKEN_NOT_FOUND',

  // kami error
  KAMIMIND_UNAUTHORIZED = 'KAMIMIND_UNAUTHORIZED',
  KAMIMIND_FORBIDDEN = 'KAMIMIND_FORBIDDEN',
  KAMIMIND_UNKNOWN_ERROR = 'KAMIMIND_UNKNOWN_ERROR',

  // gishub mapping error
  GISHUB_OBJECT_NOT_FOUND = 'GISHUB_OBJECT_NOT_FOUND',

  // typeorm error
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  CHECK_VIOLATION = 'CHECK_VIOLATION',
  PG_UNCATCH_ERROR = 'PG_UNCATCH_ERROR',
}