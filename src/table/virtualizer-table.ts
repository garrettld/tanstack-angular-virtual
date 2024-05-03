import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { injectVirtualizer } from '../virtualizer';
import { makeData } from './make-data';

@Component({
  standalone: true,
  selector: 'virtualizer-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>
      For tables, the basis for the offset of the translate css function is
      from the row's initial position itself. Because of this, we need to
      calculate the translateY pixel count different and base it off the the
      index.
    </p>
    <p>
      TODO: TanStack Angular Table <a href="https://github.com/TanStack/table/pull/5432" target="_blank">https://github.com/TanStack/table/pull/5432</a>
    </p>
    <br />
    <div #scrollElement class="list scroll-container">
      <div [style.height.px]="virtualizer.getTotalSize()">
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th style="width: 50px;">Age</th>
              <th style="width: 50px;">Visits</th>
              <th>Status</th>
              <th style="width: 80px;">Profile Progress</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            @for (row of virtualizer.getVirtualItems(); track data[row.index].id) {
              <tr
                [style.height.px]="row.size"
                [style.transform]="'translateY(' + (row.start - $index * row.size) + 'px)'"
              >
                <td>{{ data[row.index].id }}</td>
                <td>{{ data[row.index].firstName }}</td>
                <td>{{ data[row.index].lastName }}</td>
                <td>{{ data[row.index].age }}</td>
                <td>{{ data[row.index].visits }}</td>
                <td>{{ data[row.index].status }}</td>
                <td>{{ data[row.index].progress }}</td>
                <td>{{ data[row.index].createdAt.toLocaleString() }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .scroll-container {
      height: 600px;
      overflow: auto;
    }
  `,
})
export class VirtualizerTable {
  data = makeData(50_000);

  scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');

  virtualizer = injectVirtualizer(() => ({
    scrollElement: this.scrollElement(),
    count: this.data.length,
    estimateSize: (_index) => 34,
    overscan: 20,
  }));
}
