import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  viewChild,
} from '@angular/core';
import { injectVirtualizer } from '../virtualizer';
import {
  QueryClient,
  injectInfiniteQuery,
  provideQueryClient,
} from '@tanstack/angular-query-experimental';

async function fetchServerPage(
  limit: number,
  offset: number = 0
): Promise<{ rows: string[]; nextOffset: number }> {
  const rows = new Array(limit)
    .fill(0)
    .map((e, i) => `Async loaded row #${i + offset * limit}`);

  await new Promise((r) => setTimeout(r, 500));

  return { rows, nextOffset: offset + 1 };
}

@Component({
  standalone: true,
  selector: 'virtualizer-infinite-scroll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>
        This infinite scroll example uses TanStack Query's injectInfiniteScroll
        function to fetch infinite data from a posts endpoint and then a
        rowVirtualizer is used along with a loader-row placed at the bottom of
        the list to trigger the next page to load.
    </p>
    @if (query.isLoading()) {
      <p>Loading...</p>
    } @else if (query.isError()) {
      <span>Error: {{query.error()!.message}}</span>
    } @else {
      <div #scrollElement class="list scroll-container">
        <div
          style="position: relative; width: 100%;"
          [style.height.px]="virtualizer.getTotalSize()"
        >
          @for (row of virtualizer.getVirtualItems(); track row.index) {
            <div
              [class.list-item-even]="row.index % 2 === 0"
              [class.list-item-odd]="row.index % 2 !== 0"
              style="position: absolute; top: 0; left: 0; width: 100%;"
              [style.height.px]="row.size"
              [style.transform]="'translateY(' + row.start + 'px)'"
            >
              {{ (row.index > allRows().length - 1)
                  ? query.hasNextPage()
                    ? 'Loading more...'
                    : 'Nothing more to load'
                  : allRows()[row.index] }}
            </div>
          }
        </div>
      </div>
    }
    @if (query.isFetching() && !query.isFetchingNextPage()) {
      <div>Background Updating...</div>
    }
  `,
  styles: `
    .scroll-container {
      height: 500px;
      width: 100%;
      overflow: auto;
    }
  `,
  providers: [provideQueryClient(new QueryClient())],
})
export class VirtualizerInfiniteScroll {
  query = injectInfiniteQuery(() => ({
    queryKey: ['rows'],
    queryFn: ({ pageParam }) => fetchServerPage(10, pageParam),
    initialPageParam: 0,
    getNextPageParam: (_lastGroup, groups) => groups.length,
  }));

  allRows = computed(
    () => this.query.data()?.pages.flatMap((d) => d.rows) ?? []
  );

  scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');

  virtualizer = injectVirtualizer(() => ({
    scrollElement: this.scrollElement(),
    count: this.query.hasNextPage()
      ? this.allRows().length + 1
      : this.allRows().length,
    estimateSize: (_index) => 100,
    overscan: 5,
  }));

  #fetchNextPage = effect(
    () => {
      const lastItem = this.virtualizer.getVirtualItems().at(-1);
      if (!lastItem) {
        return;
      }
      if (
        lastItem.index >= this.allRows().length - 1 &&
        this.query.hasNextPage() &&
        !this.query.isFetchingNextPage()
      ) {
        this.query.fetchNextPage();
      }
    },
    { allowSignalWrites: true }
  );
}
