import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SkipAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check if this is our test route
    if (request.route?.path === '/alertas/test-alerts-public') {
      return true; // Allow access without authentication
    }
    
    return false; // Deny access for other routes
  }
}