import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createRouter } from '@remix-run/fetch-router'

import { fixtures } from '../../test/fixtures/utils.ts'
import { assets } from './assets.ts'

describe('assets middleware', () => {
  describe('basic functionality', () => {
    it('builds and serves a single JavaScript file', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Content-Type'), 'text/javascript')

      let text = await response.text()
      assert.ok(text.includes('Page initialized'))
    })

    it('builds and serves multiple entry points', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page, fixtures.app],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let pageResponse = await router.fetch('https://remix.run/assets/page.js')
      assert.equal(pageResponse.status, 200)
      assert.equal(pageResponse.headers.get('Content-Type'), 'text/javascript')

      let appResponse = await router.fetch('https://remix.run/assets/app.js')
      assert.equal(appResponse.status, 200)
      assert.equal(appResponse.headers.get('Content-Type'), 'text/javascript')
    })

    it('builds and serves CSS files', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.styles],
            outdir: 'public/assets',
            bundle: true,
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/styles.css')

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Content-Type'), 'text/css')

      let text = await response.text()
      assert.ok(text.includes('font-family'))
    })

    it('bundles dependencies correctly', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.app],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/app.js')

      assert.equal(response.status, 200)

      let text = await response.text()
      // Should include the bundled greeting function from utils.ts
      assert.ok(text.includes('greeting') || text.includes('Hello'))
    })

    it('falls through to next handler when file not found', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/nonexistent.js')

      assert.equal(response.status, 404)
    })

    it('falls through for non-asset paths', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/some/other/path')

      assert.equal(response.status, 404)
    })
  })

  describe('caching headers', () => {
    it('sets immutable cache headers in production mode', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Cache-Control'), 'public, max-age=31536000')
    })

    it('sets no-cache headers in watch mode', async () => {
      let middleware = assets(
        {
          entryPoints: [fixtures.page],
          outdir: 'public/assets',
          bundle: true,
          format: 'esm',
        },
        {
          watch: true,
        },
      )

      let router = createRouter({
        middleware: [middleware],
      })

      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Cache-Control'), 'no-cache')

      // Clean up the watcher to prevent hanging
      await (middleware as any).dispose()
    })
  })

  describe('HTTP methods', () => {
    it('supports HEAD requests', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/page.js', {
        method: 'HEAD',
      })

      assert.equal(response.status, 200)
      assert.equal(response.headers.get('Content-Type'), 'text/javascript')
      assert.equal(await response.text(), '')
    })
  })

  describe('content types', () => {
    it('serves JavaScript with correct content type', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.headers.get('Content-Type'), 'text/javascript')
    })

    it('serves CSS with correct content type', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.styles],
            outdir: 'public/assets',
            bundle: true,
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/styles.css')

      assert.equal(response.headers.get('Content-Type'), 'text/css')
    })
  })

  describe('build options', () => {
    it('respects minify option', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
            minify: true,
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.status, 200)

      let text = await response.text()
      // Minified code should not have readable comments or excessive whitespace
      assert.ok(text.length < 200) // Minified version should be relatively small
    })

    it('handles splitting for ESM format', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.app],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
            splitting: true,
          }),
        ],
      })

      let response = await router.fetch('https://remix.run/assets/app.js')

      assert.equal(response.status, 200)
    })
  })

  describe('build triggers', () => {
    it('only builds once across multiple requests', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      // Make multiple requests
      let response1 = await router.fetch('https://remix.run/assets/page.js')
      let response2 = await router.fetch('https://remix.run/assets/page.js')
      let response3 = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response1.status, 200)
      assert.equal(response2.status, 200)
      assert.equal(response3.status, 200)

      // All should return the same content
      let text1 = await response1.text()
      let text2 = await response2.text()
      let text3 = await response3.text()

      assert.equal(text1, text2)
      assert.equal(text2, text3)
    })

    it('builds on first request', async () => {
      let router = createRouter({
        middleware: [
          assets({
            entryPoints: [fixtures.page],
            outdir: 'public/assets',
            bundle: true,
            format: 'esm',
          }),
        ],
      })

      // First request should trigger build
      let response = await router.fetch('https://remix.run/assets/page.js')

      assert.equal(response.status, 200)
      assert.ok((await response.text()).length > 0)
    })
  })
})
