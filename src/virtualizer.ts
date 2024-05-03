import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  PartialKeys,
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
  inject,
  Injector,
  runInInjectionContext,
  WritableSignal,
  AfterRenderPhase,
} from '@angular/core';

type MapToComputedFactory<T extends (...args: any[]) => any> = T extends (
  ...args: Parameters<T>
) => infer U
  ? (...args: Parameters<T>) => Signal<U>
  : never;

type AngularVirtualizer<
  TScrollElement extends Element | Window,
  TItemElement extends Element
> = Omit<
  Virtualizer<TScrollElement, TItemElement>,
  | 'getTotalSize'
  | 'getVirtualItems'
  | 'isScrolling'
  | 'options'
  | 'range'
  | 'scrollDirection'
  | 'scrollElement'
  | 'scrollOffset'
  | 'scrollRect'
  | 'getOffsetForAlignment'
  | 'getOffsetForIndex'
  | 'getVirtualItemForOffset'
> & {
  getTotalSize: Signal<
    ReturnType<Virtualizer<TScrollElement, TItemElement>['getTotalSize']>
  >;
  getVirtualItems: Signal<
    ReturnType<Virtualizer<TScrollElement, TItemElement>['getVirtualItems']>
  >;
  isScrolling: Signal<Virtualizer<TScrollElement, TItemElement>['isScrolling']>;
  options: Signal<Virtualizer<TScrollElement, TItemElement>['options']>;
  range: Signal<Virtualizer<TScrollElement, TItemElement>['range']>;
  scrollDirection: Signal<
    Virtualizer<TScrollElement, TItemElement>['scrollDirection']
  >;
  scrollElement: Signal<
    Virtualizer<TScrollElement, TItemElement>['scrollElement']
  >;
  scrollOffset: Signal<
    Virtualizer<TScrollElement, TItemElement>['scrollOffset']
  >;
  scrollRect: Signal<Virtualizer<TScrollElement, TItemElement>['scrollRect']>;
  getOffsetForAlignment: MapToComputedFactory<
    Virtualizer<TScrollElement, TItemElement>['getOffsetForAlignment']
  >;
  getOffsetForIndex: MapToComputedFactory<
    Virtualizer<TScrollElement, TItemElement>['getOffsetForIndex']
  >;
  getVirtualItemForOffset: MapToComputedFactory<
    Virtualizer<TScrollElement, TItemElement>['getVirtualItemForOffset']
  >;
};

function proxyVirtualizer<
  V extends Virtualizer<any, any>,
  S extends Element | Window = V extends Virtualizer<infer U, any> ? U : never,
  I extends Element = V extends Virtualizer<any, infer U> ? U : never
>(virtualizerSignal: WritableSignal<V>, lazyInit: () => V) {
  return new Proxy(virtualizerSignal, {
    get(target, property) {
      const untypedTarget = target as any;
      if (untypedTarget[property]) {
        return untypedTarget[property];
      }
      let virtualizer = untracked(virtualizerSignal);
      if (virtualizer == null) {
        virtualizer = lazyInit();
        untracked(() => virtualizerSignal.set(virtualizer));
      }
      if (!(property in virtualizer)) {
        return untypedTarget[property];
      }

      // Create computed signals for each property that represents virtualizer state
      if (
        typeof property === 'string' &&
        [
          'getTotalSize',
          'getVirtualItems',
          'isScrolling',
          'options',
          'range',
          'scrollDirection',
          'scrollElement',
          'scrollOffset',
          'scrollRect',
        ].includes(property)
      ) {
        const isFunction =
          typeof virtualizer[property as keyof V] === 'function';
        Object.defineProperty(untypedTarget, property, {
          value: isFunction
            ? computed(() => (target()[property as keyof V] as Function)())
            : computed(() => target()[property as keyof V]),
          configurable: true,
          enumerable: true,
        });
      }

      // Create computed factories for functions that accept arguments and are based on virtualizer state
      if (
        typeof property === 'string' &&
        [
          'getOffsetForAlignment',
          'getOffsetForIndex',
          'getVirtualItemForOffset',
        ].includes(property)
      ) {
        Object.defineProperty(untypedTarget, property, {
          value: (...args: unknown[]) =>
            computed(() =>
              (target()[property as keyof V] as Function)(...args)
            ),
          configurable: true,
          enumerable: true,
        });
      }

      return untypedTarget[property] || virtualizer[property as keyof V];
    },
  }) as unknown as AngularVirtualizer<S, I>;
}

function createVirtualizerBase<
  TScrollElement extends Element | Window,
  TItemElement extends Element
>(
  options: Signal<VirtualizerOptions<TScrollElement, TItemElement>>,
  injector?: Injector
): AngularVirtualizer<TScrollElement, TItemElement> {
  injector ??= inject(Injector);
  return runInInjectionContext(injector!, () => {
    let _v: Virtualizer<TScrollElement, TItemElement>;
    function lazyInit() {
      _v ??= new Virtualizer(options());
      // _v._didMount();
      return _v;
    }

    const virtualizerSignal = signal(_v!, { equal: () => false });

    // Two-way sync options
    effect(
      () => {
        const _options = options();
        lazyInit();
        virtualizerSignal.set(_v);
        _v.setOptions({
          ..._options,
          onChange: (instance, sync) => {
            // update virtualizerSignal so that dependent computeds recompute.
            virtualizerSignal.set(instance);
            _options.onChange?.(instance, sync);
          },
        });
        // update virtualizerSignal so that dependent computeds recompute.
        virtualizerSignal.set(_v);
      },
      { allowSignalWrites: true }
    );

    const scrollElement = computed(() => options().getScrollElement(), {
      equal: () => false,
    });
    // let the virtualizer know when the scroll element is changed
    effect(
      () => {
        const el = scrollElement();
        if (el) {
          untracked(virtualizerSignal)._willUpdate();
        }
      },
      { allowSignalWrites: true }
    );

    const effectRef = effect(() => {
      const v = virtualizerSignal();
      if (v) {
        afterNextRender(
          () => {
            console.log('calling _didMount');
            v._didMount();
            // only run this effect once
            effectRef.destroy();
          },
          { phase: AfterRenderPhase.Read, injector }
        );
      }
    });

    return proxyVirtualizer(virtualizerSignal, lazyInit);
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
) {
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
): AngularVirtualizer<Window, TItemElement> {
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
