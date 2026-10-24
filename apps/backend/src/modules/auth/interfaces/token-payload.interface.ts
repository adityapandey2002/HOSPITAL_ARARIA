export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  /**
   * Access and refresh tokens are signed with the same secret, so the only
   * thing that stops a long-lived refresh token from being replayed as a
   * bearer credential is an explicit audience marker. Verification checks it;
   * see `JwtStrategy.validate` and `AuthService.refreshTokens`.
   */
  typ?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
