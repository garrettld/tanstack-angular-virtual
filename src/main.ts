import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  provideRouter,
} from '@angular/router';
import 'zone.js';

import { VirtualizerFixed } from './fixed/virtualizer-fixed';
import { VirtualizerVariable } from './variable/virtualizer-variable';
import { dynamicRoutes } from './dynamic/dynamic-routes';
import { VirtualizerPadding } from './padding/virtualizer-padding';
import { VirtualizerSticky } from './sticky/virtualizer-sticky';
import { VirtualizerInfiniteScroll } from './infinite-scroll/virtualizer-infinite-scroll';
import { VirtualizerSmoothScroll } from './smooth-scroll/virtualizer-smooth-scroll';
import { VirtualizerTable } from './table/virtualizer-table';
import { VirtualizerWindow } from './window/virtualizer-window';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    Select a demo:<br />
    <a routerLinkActive="active" routerLink="/fixed">Fixed</a> | 
    <a routerLinkActive="active" routerLink="/variable">Variable</a> | 
    <a routerLinkActive="active" routerLink="/dynamic">Dynamic</a> | 
    <a routerLinkActive="active" routerLink="/padding">Padding</a> |
    <a routerLinkActive="active" routerLink="/sticky">Sticky</a> |
    <a routerLinkActive="active" routerLink="/infinite-scroll">Infinite Scroll</a> |
    <a routerLinkActive="active" routerLink="/smooth-scroll">Smooth Scroll</a> |
    <a routerLinkActive="active" routerLink="/table">Table</a> |
    <a routerLinkActive="active" routerLink="/window">Window</a>
    <router-outlet />
  `,
  styles: `
    .active { text-decoration: none; color: inherit; font-weight: bold; }
  `,
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sticky',
      },
      {
        path: 'fixed',
        component: VirtualizerFixed,
      },
      {
        path: 'dynamic',
        children: dynamicRoutes,
      },
      {
        path: 'variable',
        component: VirtualizerVariable,
      },
      {
        path: 'padding',
        component: VirtualizerPadding,
      },
      {
        path: 'sticky',
        component: VirtualizerSticky,
      },
      {
        path: 'infinite-scroll',
        component: VirtualizerInfiniteScroll,
      },
      {
        path: 'smooth-scroll',
        component: VirtualizerSmoothScroll,
      },
      {
        path: 'table',
        component: VirtualizerTable,
      },
      {
        path: 'window',
        component: VirtualizerWindow,
      },
    ]),
  ],
});
