import { HttpInterceptorFn, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip for login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = authService.getToken();

  // If we don't have a token, just continue
  if (!token) {
    return next(req);
  }

  // Only add Authorization header. 
  // We use query parameters in services for branch filtering as requested by backend priority.
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
