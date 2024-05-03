import { Routes } from '@angular/router';
import { RowVirtualizerDynamic } from './row-virtualizer-dynamic';
import { GridVirtualizerDynamic } from './grid-virtualizer-dynamic';
import { ColumnVirtualizerDynamic } from './column-virtualizer-dynamic';
import { RowVirtualizerDynamicWindow } from './row-virtualizer-dynamic-window';
import { VirtualizerDynamic } from './virtualizer-dynamic';

export const dynamicRoutes: Routes = [
  {
    path: '',
    component: VirtualizerDynamic,
    children: [
      {
        path: '',
        component: RowVirtualizerDynamic,
      },
      {
        path: 'window-list',
        component: RowVirtualizerDynamicWindow,
      },
      {
        path: 'columns',
        component: ColumnVirtualizerDynamic,
      },
      {
        path: 'grid',
        component: GridVirtualizerDynamic,
      },
    ],
  },
];
