import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class SkipAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
