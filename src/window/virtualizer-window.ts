import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';
import { injectWindowVirtualizer } from '@tanstack/virtual-angular';

@Component({
  standalone: true,
  selector: 'row-virtualizer-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>Window Scroller</h3>
    <div #scrollElement class="list">
      <div
        style="position: relative; width: 100%;"
        [style.height.px]="virtualizer.getTotalSize()"
      >
          @for (row of virtualizer.getVirtualItems(); track row.key) {
            <div
              #virtualItem
              [class.list-item-even]="row.index % 2 === 0"
              [class.list-item-odd]="row.index % 2 !== 0"
              style="position: absolute; top: 0; left: 0; width: 100%;"
              [style.height.px]="row.size"
              [style.transform]="'translateY(' + (row.start - virtualizer.options().scrollMargin) + 'px)'"
            >
              Row {{ row.index }}
            </div>
          }
      </div>
    </div>
  `,
  styles: `
    .scroll-container {
      height: 400px;
      width: 400px;
      overflow-y: auto;
      contain: 'strict';
    }
  `,
})
export class VirtualizerWindow {
  scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');

  parentOffset = signal(0);

  constructor() {
    afterNextRender(() =>
      this.parentOffset.set(this.scrollElement()!.nativeElement.offsetTop)
    );
  }

  virtualizer = injectWindowVirtualizer(() => ({
    count: 10000,
    estimateSize: (_index) => 35,
    overscan: 5,
    scrollMargin: this.parentOffset(),
  }));
}
