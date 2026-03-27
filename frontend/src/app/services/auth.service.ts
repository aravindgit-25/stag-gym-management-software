import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    const savedUser = localStorage.getItem('gym_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): boolean {
    console.log('Login attempt:', { email, password });
    // Simple hardcoded check as requested
    let user: User | null = null;

    if (email === 'admin@stag.com' && password === 'admin123') {
      user = { id: 1, name: 'Aravind Admin', email, role: 'ADMIN' };
    } else if (email === 'staff@stag.com' && password === 'staff123') {
      user = { id: 2, name: 'Staff Member', email, role: 'STAFF' };
    }

    if (user) {
      console.log('Login successful:', user);
      localStorage.setItem('gym_user', JSON.stringify(user));
      this.currentUser.set(user);
      return true;
    }
    console.warn('Login failed: Invalid credentials');
    return false;
  }

  logout() {
    localStorage.removeItem('gym_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
