import {Component, inject, computed, ChangeDetectionStrategy} from '@angular/core';
import {Router, RouterLink, RouterOutlet, NavigationEnd} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {filter, map} from 'rxjs/operators';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {App} from './app';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './public-layout.html'
})
export class PublicLayout {
  readonly app = inject(App);
  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects || e.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isEsqueciSenha = computed(() => {
    const url = this.currentUrl();
    return url ? url.includes('esqueci-senha') : false;
  });

  isDark() {
    return this.app.isDark();
  }

  toggleTheme() {
    this.app.toggleTheme();
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
