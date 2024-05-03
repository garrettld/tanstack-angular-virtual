import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  PartialKeys,
  VirtualItem,
  Virtualizer,
  VirtualizerOptions,
  windowScroll,
} from '@tanstack/virtual-core';
export * from '@tanstack/virtual-core';

import {
  signal,
  computed,
  Signal,
  effect,
  ElementRef,
  afterNextRender,
  untracked,
} from '@angular/core';

type ScrollDirection = 'forward' | 'backward';

export type AngularVirtualizer<
  TScrollElement extends Element | Window,
  TItemElement extends Element
> = Pick<
  Virtualizer<TScrollElement, TItemElement>,
  | 'indexFromElement'
  | 'measureElement'
  | 'getVirtualItemForOffset'
  | 'resizeItem'
  | 'getOffsetForAlignment'
  | 'getOffsetForIndex'
  | 'scrollToOffset'
  | 'scrollToIndex'
  | 'scrollBy'
  | 'measure'
> & {
  getVirtualItems: Signal<VirtualItem[]>;
  options: Signal<VirtualizerOptions<TScrollElement, TItemElement>>;
  scrollElement: Signal<TScrollElement | null>;
  isScrolling: Signal<boolean>;
  scrollDirection: Signal<ScrollDirection | null>;
  scrollOffset: Signal<number>;
  getTotalSize: Signal<
    ReturnType<Virtualizer<TScrollElement, TItemElement>['getTotalSize']>
  >;
  range: Signal<Virtualizer<TScrollElement, TItemElement>['range']>;
};

/**
 * This alternative implementation uses a "signals all the way down" approach,
 * with some properties on the core Virtualizer being replaced with signals.
 *
 * This makes for a simpler implementation, but the downside of this approach
 * is that the virtualizer itself is only accessible via a signal, so consumers
 * must unwrap the signal any time they want to use it, and know when to use
 * `untracked(virtualizer)` instead of `virtualizer()`.
 */
function createVirtualizerBase<
  TScrollElement extends Element | Window,
  TItemElement extends Element
>(
  options: Signal<VirtualizerOptions<TScrollElement, TItemElement>>
): Signal<AngularVirtualizer<TScrollElement, TItemElement>> {
  let _v: Virtualizer<TScrollElement, TItemElement>;
  const virtualizer = computed(() => {
    // Creating a new virtualizer each time causes loss of state,
    // so we cache the virtualizer instance instead.
    if (!_v) {
      _v = new Virtualizer(options());
    } else {
      _v.setOptions(options());
    }
    return _v;
  });

  const scrollElement = computed(() => options().getScrollElement());
  // let the virtualizer know when the scroll element is changed
  effect(
    () => {
      const el = scrollElement();
      if (el) {
        untracked(virtualizer)._willUpdate();
      }
    },
    { allowSignalWrites: true }
  );

  // These values are mutated by TanStack Virtual.
  // We expose them as signals so that they can be used more easily in Angular.
  const isScrolling =
    signal<Virtualizer<TScrollElement, TItemElement>['isScrolling']>(false);
  const scrollDirection =
    signal<Virtualizer<TScrollElement, TItemElement>['scrollDirection']>(null);
  const scrollOffset =
    signal<Virtualizer<TScrollElement, TItemElement>['scrollOffset']>(0);
  const getVirtualItems = signal<
    ReturnType<Virtualizer<TScrollElement, TItemElement>['getVirtualItems']>
  >([]);
  const getTotalSize =
    signal<
      ReturnType<Virtualizer<TScrollElement, TItemElement>['getTotalSize']>
    >(0);
  const range =
    signal<Virtualizer<TScrollElement, TItemElement>['range']>(null);

  function updateState() {
    const v = untracked(virtualizer);
    isScrolling.set(v.isScrolling);
    scrollDirection.set(v.scrollDirection);
    scrollOffset.set(v.scrollOffset);
    getVirtualItems.set(v.getVirtualItems());
    getTotalSize.set(v.getTotalSize());
    range.set(v.range);
  }

  // Two-way sync options
  effect(
    () => {
      const _options = options();
      untracked(virtualizer).setOptions({
        ..._options,
        onChange: (instance, sync) => {
          updateState();
          _options.onChange?.(instance, sync);
        },
      });
      updateState();
    },
    { allowSignalWrites: true }
  );

  afterNextRender(() => virtualizer()._didMount());

  return computed(() => {
    const {
      indexFromElement,
      measureElement,
      getVirtualItemForOffset,
      resizeItem,
      getOffsetForAlignment,
      getOffsetForIndex,
      scrollToOffset,
      scrollToIndex,
      scrollBy,
      measure,
    } = virtualizer();
    return {
      // properties on Virtualizer that are replaced by signals
      options: options as Signal<
        Required<VirtualizerOptions<TScrollElement, TItemElement>>
      >,
      scrollElement,
      isScrolling,
      scrollDirection,
      scrollOffset,
      getVirtualItems,
      getTotalSize,
      range,

      // properties on Virtualizer that don't need to be wrapped in a signal
      indexFromElement,
      measureElement,
      getVirtualItemForOffset,
      resizeItem,
      getOffsetForAlignment,
      getOffsetForIndex,
      scrollToOffset,
      scrollToIndex,
      scrollBy,
      measure,
    };
  });
}

export function injectVirtualizer<
  TScrollElement extends Element,
  TItemElement extends Element
>(
  options: () => PartialKeys<
    Omit<VirtualizerOptions<TScrollElement, TItemElement>, 'getScrollElement'>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  > & {
    scrollElement: ElementRef<TScrollElement> | TScrollElement | undefined;
  }
): Signal<AngularVirtualizer<TScrollElement, TItemElement>> {
  const resolvedOptions = computed(() => {
    return {
      observeElementRect: observeElementRect,
      observeElementOffset: observeElementOffset,
      scrollToFn: elementScroll,
      getScrollElement: () => {
        const elementOrRef = options().scrollElement;
        return (
          (isElementRef(elementOrRef)
            ? elementOrRef.nativeElement
            : elementOrRef) ?? null
        );
      },
      ...options(),
    };
  });
  return createVirtualizerBase<TScrollElement, TItemElement>(resolvedOptions);
}

function isElementRef<T extends Element>(
  elementOrRef: ElementRef<T> | T | undefined
): elementOrRef is ElementRef<T> {
  return elementOrRef != null && 'nativeElement' in elementOrRef;
}

export function injectWindowVirtualizer<TItemElement extends Element>(
  options: () => PartialKeys<
    VirtualizerOptions<Window, TItemElement>,
    | 'getScrollElement'
    | 'observeElementRect'
    | 'observeElementOffset'
    | 'scrollToFn'
  >
): Signal<AngularVirtualizer<Window, TItemElement>> {
  const resolvedOptions = computed(() => {
    return {
      getScrollElement: () => (typeof document !== 'undefined' ? window : null),
      observeElementRect: observeWindowRect,
      observeElementOffset: observeWindowOffset,
      scrollToFn: windowScroll,
      initialOffset: () =>
        typeof document !== 'undefined' ? window.scrollY : 0,
      ...options(),
    };
  });
  return createVirtualizerBase<Window, TItemElement>(resolvedOptions);
}
