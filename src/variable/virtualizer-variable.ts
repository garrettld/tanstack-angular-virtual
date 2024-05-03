import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ColumnVirtualizerVariable } from './column-virtualizer-variable';
import { GridVirtualizerVariable } from './grid-virtualizer-variable';
import { RowVirtualizerVariable } from './row-virtualizer-variable';

@Component({
  standalone: true,
  selector: 'virtualizer-variable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ColumnVirtualizerVariable,
    GridVirtualizerVariable,
    RowVirtualizerVariable,
  ],
  template: `
    <p>
      These components are using <strong>variable</strong> sizes. This means
        that each element has a unique, but knowable dimension at render time.
    </p>

    <row-virtualizer-variable [rows]="rows" />
    <column-virtualizer-variable [columns]="columns" />
    <grid-virtualizer-variable [columns]="columns" [rows]="rows" />`,
})
export class VirtualizerVariable {
  rows = new Array(10000)
    .fill(true)
    .map(() => 25 + Math.round(Math.random() * 100));

  columns = new Array(10000)
    .fill(true)
    .map(() => 75 + Math.round(Math.random() * 100));
}
