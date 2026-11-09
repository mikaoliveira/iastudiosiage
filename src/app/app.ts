import {ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {ToastComponent} from './toast';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastComponent
  ],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  readonly isDark = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check localStorage for preferred theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.setDarkTheme(true);
      } else if (savedTheme === 'light') {
        this.setDarkTheme(false);
      } else {
        // System preference default
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setDarkTheme(systemPrefersDark);
      }
    }
  }

  toggleTheme() {
    if (!isPlatformBrowser(this.platformId)) return;
    const nextTheme = !this.isDark();
    this.setDarkTheme(nextTheme);
    localStorage.setItem('theme', nextTheme ? 'dark' : 'light');
  }

  private setDarkTheme(dark: boolean) {
    this.isDark.set(dark);
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark', 'dark-theme', 'dark-mode');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark', 'dark-theme', 'dark-mode');
    }
  }
}
