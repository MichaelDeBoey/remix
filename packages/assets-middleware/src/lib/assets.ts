import * as path from 'node:path'
import type { BuildOptions, BuildResult, OutputFile } from 'esbuild'
import * as esbuild from 'esbuild'
import { lookup } from 'mrmime'
import type { Middleware } from '@remix-run/fetch-router'
import * as res from '@remix-run/fetch-router/response-helpers'

export interface AssetsOptions {
  /**
   * The URL path where assets should be served. If not provided, defaults to
   * the outdir with any leading 'public' directory stripped.
   *
   * For example, if outdir is 'public/assets', publicPath defaults to '/assets'.
   */
  publicPath?: string
  /**
   * When true, runs esbuild in watch mode and rebuilds assets on file changes.
   * The file watcher is unref'd so it won't prevent the server from shutting down.
   */
  watch?: boolean
}

/**
 * Creates a middleware that builds and serves JavaScript/CSS assets using esbuild.
 *
 * The middleware runs esbuild with the provided configuration on the first request,
 * stores the built files in memory, and serves them with full HTTP semantics.
 *
 * @param config esbuild configuration object
 * @param options (optional) middleware options
 * @returns A middleware function
 *
 * @example
 * import { createRouter } from '@remix-run/fetch-router'
 * import { assets } from '@remix-run/assets-middleware'
 *
 * let router = createRouter({
 *   middleware: [
 *     assets({
 *       entryPoints: ['app/assets/app.tsx'],
 *       outdir: 'public/assets',
 *       bundle: true,
 *       minify: true,
 *       splitting: true,
 *       format: 'esm',
 *     }, {
 *       watch: true
 *     })
 *   ]
 * })
 */
export function assets(config: BuildOptions, options?: AssetsOptions): Middleware {
  let outdir = config.outdir ?? 'assets'
  let absoluteOutdir = path.resolve(outdir)
  let watch = options?.watch ?? false
  let publicPath = options?.publicPath

  // Determine the public path for serving assets
  if (!publicPath) {
    // Strip leading 'public' or 'public/' from the outdir to get the URL path
    publicPath = outdir.replace(/^public\/?/, '/')
    // Ensure it starts with a slash
    if (!publicPath.startsWith('/')) {
      publicPath = '/' + publicPath
    }
  }

  let buildPromise: Promise<BuildResult> | null = null
  let outputFiles = new Map<string, OutputFile>()
  let context: Awaited<ReturnType<typeof esbuild.context>> | null = null

  async function runBuild(): Promise<BuildResult> {
    // Force write: false to keep files in memory
    let buildConfig: BuildOptions = {
      ...config,
      write: false,
    }

    if (watch) {
      // In watch mode, create a context and start watching
      if (!context) {
        context = await esbuild.context({
          ...buildConfig,
          plugins: [
            // Add a plugin to capture rebuild results
            ...(buildConfig.plugins || []),
            {
              name: 'assets-middleware-watcher',
              setup(build) {
                build.onEnd((result) => {
                  updateOutputFiles(result)
                })
              },
            },
          ],
        })
        await context.watch()
      }

      // Get the initial build result
      return await context.rebuild()
    } else {
      // In production mode, just build once
      return await esbuild.build(buildConfig)
    }
  }

  function updateOutputFiles(result: BuildResult) {
    if (result.outputFiles) {
      outputFiles.clear()
      for (let file of result.outputFiles) {
        outputFiles.set(file.path, file)
      }
    }
    return result
  }

  let middleware: Middleware = async ({ request, url }, next) => {
    // Check if the request path starts with the publicPath
    if (!url.pathname.startsWith(publicPath)) {
      return next()
    }

    // Trigger build on first request if not already building
    if (!buildPromise) {
      buildPromise = runBuild().then(updateOutputFiles)
    }

    // Wait for build to complete
    await buildPromise

    // Try to find a matching output file for this request
    let matchedFile: OutputFile | null = null

    for (let [filePath, file] of outputFiles) {
      if (!filePath.startsWith(absoluteOutdir + path.sep)) continue

      let relativePath = filePath.slice(absoluteOutdir.length)
      let urlPath = publicPath + relativePath

      if (url.pathname === urlPath) {
        matchedFile = file
        break
      }
    }

    if (matchedFile) {
      // Convert the output file to a File object that res.file() can handle
      let file = new File(
        [matchedFile.contents as BlobPart],
        matchedFile.path.split('/').pop() || 'file',
        {
          type: lookup(matchedFile.path) || 'application/octet-stream',
          lastModified: Date.now(),
        },
      )

      return res.file(file, request, {
        cacheControl: watch ? 'no-cache' : 'public, max-age=31536000',
      })
    }
  }

  // Expose a dispose method to clean up resources (mainly for testing)
  ;(middleware as any).dispose = async () => {
    if (context) {
      await context.dispose()
      context = null
    }
  }

  return middleware
}
