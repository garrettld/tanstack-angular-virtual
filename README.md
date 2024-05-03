# Overview

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/garrettld/tanstack-angular-virtual)

This is a proof of concept for an Angular adapter for TanStack Virtual that uses Angular signals. The app includes working Angular versions of each of the React examples in the TanStack Virtual docs to verify that all functionality works as expected.

Basic usage requires only a call to `injectVirtualizer` and a `viewChild` reference to the scroll element:

```typescript
@Component({ ... })
class VirtualList {
    scrollElement = viewChild<ElementRef<HTMLDivElement>>('scrollElement');
    
    virtualizer = injectVirtualizer(() => ({
        scrollElement: this.scrollElement(),
        count: 10000,
        estimateSize: (index) => 100,
    }));
}
```

The adapter implementation is in `/src/virtualizer.ts`.

Imperative methods and static properties on the virtualizer object are available directly on the virtualizer. For example:

```typescript
scrollToIndex(index: number) {
    this.virtualizer.scrollToIndex(index);
}
```

Methods and properties that depend on Virtualizer state are wrapped in signals:

```typescript
virtualizer = injectVirtualizer(...);

firstRow = computed(() => this.virtualizer.getVirtualRows()[0]); // Signal<VirtualItem>
isScrollingDown = computed(() => this.virtualizer.scrollDirection() === 'forward'); // Signal<boolean>
isReallyBig = computed(() => this.virtualizer.getTotalSize() > 9000); // Signal<boolean>
```

Methods that accept arguments return computed signals:

```typescript
virtualizer = injectVirtualizer(...);

itemAtOffset100 = this.virtualizer.getVirtualItemForOffset(100); // Signal<VirtualItem>
itemAtOffset100Index = computed(() => this.itemAtOffset100().index); // Signal<number>

autoOffset = this.virtualizer.getOffsetForAlignment(100, 'auto'); // Signal<number>

offsetForIndex9 = this.virtualizer.getOffsetForIndex(9, 'start'); // Signal<number>
```

## Goals

- [x] Works with OnPush
- [x] Works with signals
- [x] Works with required inputs
- [ ] Works with Zoneless (not sure, but I think it would?)

## Questions/Feedback

- How can we improve the API?
- Should there be built-in directives/services/components to simplify things?
- Do we care about supporting previous versions of Angular without signals?
