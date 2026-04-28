import { HttpInterceptorFn, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip for login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  let url = req.url;
  // Safety check for malformed URLs missing '?' before branchId
  if (url.includes('branchId=') && !url.includes('?')) {
    url = url.replace('branchId=', '?branchId=');
  }

  const token = authService.getToken();

  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    url,
    setHeaders: headers
  });

  return next(authReq);
};
