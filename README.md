This is a proof of concept for an Angular adapter for TanStack Virtual.

Basic usage requires only a call to `injectVirtualizer` and `viewChild` reference to the scroll element.

- [x] Works with OnPush
- [x] Works with signals
- [x] Works with required inputs

The adapter implementation is in `/src/virtualizer.ts`.

This app includes working Angular versions of each of the examples in the TanStack Virtual docs to verify that all functionality works as expected.
