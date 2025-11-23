# assets-middleware

Middleware for building and serving JavaScript/CSS assets with [esbuild](https://esbuild.github.io/) for use with [`fetch-router`](https://github.com/remix-run/remix/tree/main/packages/fetch-router).

This middleware runs esbuild in the same process as your server and serves the built assets directly from memory without writing to disk.

## Installation

```sh
npm install @remix-run/assets-middleware
```

## Usage

```ts
import { createRouter } from '@remix-run/fetch-router'
import { assets } from '@remix-run/assets-middleware'

let router = createRouter({
  middleware: [
    assets({
      entryPoints: ['app/assets/app.tsx'],
      outdir: 'public/assets',
      bundle: true,
      minify: true,
      splitting: true,
      format: 'esm',
    }),
  ],
})
```

The middleware accepts an esbuild configuration object as the first argument. It will run the build once on the first request and serve the built files from memory.

The built assets will be served from the URL path corresponding to the `outdir`. For example, with `outdir: 'public/assets'`, you can reference the built files in your HTML:

```html
<script type="module" src="/assets/app.js"></script>
<link rel="stylesheet" href="/assets/styles.css" />
```

### Development Mode

Use the `watch: true` option to enable watch mode for development:

```ts
let router = createRouter({
  middleware: [
    assets(
      {
        entryPoints: ['app/assets/app.tsx'],
        outdir: 'public/assets',
        bundle: true,
        splitting: true,
        format: 'esm',
        sourcemap: true,
      },
      {
        watch: true,
      },
    ),
  ],
})
```

In watch mode, esbuild will rebuild the assets whenever source files change, and the middleware will serve the updated files on the next request. The built assets are served with `Cache-Control: no-cache` headers in watch mode to ensure browsers always fetch the latest version.

```html
<script type="module" src="/assets/app.js"></script>
```

## Related Packages

- [`fetch-router`](https://github.com/remix-run/remix/tree/main/packages/fetch-router) - Router for the web Fetch API
- [`static-middleware`](https://github.com/remix-run/remix/tree/main/packages/static-middleware) - Middleware for serving static files

## License

See [LICENSE](https://github.com/remix-run/remix/blob/main/LICENSE)
