/**
 * 공통 에러 코드 정의
 * 애플리케이션 전체에서 일관된 에러 코드를 사용하기 위한 상수
 */
export const ERROR_CODES = {
  // 토큰 관련 에러
  INSUFFICIENT_TOKENS: 'INSUFFICIENT_TOKENS',
  NO_ACCUMULATED_TOKENS: 'NO_ACCUMULATED_TOKENS',

  // 좋아요 관련 에러
  ALREADY_LIKED: 'ALREADY_LIKED',

  // 인증 관련 에러
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 리소스 관련 에러
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',

  // 시스템 에러
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/**
 * 에러 메시지 정의
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.INSUFFICIENT_TOKENS]: 'Insufficient tokens to perform this action',
  [ERROR_CODES.NO_ACCUMULATED_TOKENS]: 'No accumulated tokens available to claim',
  [ERROR_CODES.ALREADY_LIKED]: 'User has already liked this post',
  [ERROR_CODES.UNAUTHORIZED]: 'User is not authorized to perform this action',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid or expired token',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Requested resource not found',
  [ERROR_CODES.FORBIDDEN]: 'Access to this resource is forbidden',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error occurred',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error in request data',
} as const;

/**
 * 에러 코드 타입
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 공통 에러 응답 인터페이스
 */
export interface CommonErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}
