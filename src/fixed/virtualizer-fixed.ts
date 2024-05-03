import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ColumnVirtualizerFixed } from './column-virtualizer-fixed';
import { GridVirtualizerFixed } from './grid-virtualizer-fixed';
import { RowVirtualizerFixed } from './row-virtualizer-fixed';

@Component({
  standalone: true,
  selector: 'virtualizer-fixed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnVirtualizerFixed, GridVirtualizerFixed, RowVirtualizerFixed],
  template: `
    <p>
      These components are using <strong>fixed</strong> sizes. This means that every
      element's dimensions are hard-coded to the same value and never change.
    </p>

    <row-virtualizer-fixed />
    <column-virtualizer-fixed />
    <grid-virtualizer-fixed />`,
})
export class VirtualizerFixed {}
