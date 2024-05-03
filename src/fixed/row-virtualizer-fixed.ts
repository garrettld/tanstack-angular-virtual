import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { injectVirtualizer } from '../virtualizer';

@Component({
  standalone: true,
  selector: 'row-virtualizer-fixed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 style="margin-top: 2rem">Rows</h3>
    <div #scrollElement class="list scroll-container">
      <div
        style="position: relative; width: 100%;"
        [style.height.px]="virtualizer.getTotalSize()"
      >
        @for (row of virtualizer.getVirtualItems(); track row.index) {
          <div
            [attr.data-index]="row.index"
            [class.list-item-even]="row.index % 2 === 0"
            [class.list-item-odd]="row.index % 2 !== 0"
            style="position: absolute; top: 0; left: 0; width: 100%;"
            [style.height.px]="row.size"
            [style.transform]="'translateY(' + row.start + 'px)'"
          >
            Row {{ row.index }}
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .scroll-container {
      height: 200px;
      width: 400px;
      overflow: auto;
    }
  `,
})
export class RowVirtualizerFixed {
  scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');

  virtualizer = injectVirtualizer(() => ({
    scrollElement: this.scrollElement(),
    count: 10000,
    estimateSize: (_index) => 35,
    overscan: 5,
  }));
}
