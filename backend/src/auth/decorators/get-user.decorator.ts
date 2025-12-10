import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract authenticated user from request
 * Use with @UseGuards(JwtAuthGuard) to ensure user is authenticated
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@GetUser() user: { id: string; email: string }) {
 *   return user;
 * }
 *
 * // Or extract specific field
 * @Get('data')
 * @UseGuards(JwtAuthGuard)
 * getData(@GetUser('id') userId: string) {
 *   return this.service.getDataForUser(userId);
 * }
 * ```
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If specific field is requested, return that field
    if (data) {
      return user?.[data];
    }

    // Otherwise return entire user object
    return user;
  },
);
