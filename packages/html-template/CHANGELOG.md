# `html-template` CHANGELOG

This is the changelog for [`html-template`](https://github.com/remix-run/remix/tree/main/packages/html-template). It follows [semantic versioning](https://semver.org/).

## Unreleased

- No real changes, just testing a new release process.

## 0.1.0 (2025-10-25)

This is the initial release of the `@remix-run/html-template` package.

- `html` tagged template function for HTML string construction with automatic escaping
- `html.raw` for explicitly marking HTML as safe (no escaping)
- `isSafeHtml` type guard function
- `SafeHtml` branded type for type-safe HTML strings
- Support for composable HTML fragments without double-escaping
- Support for arrays, primitives, and falsy values in interpolations
