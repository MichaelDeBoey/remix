import type { Router } from "@remix-run/router";
import { matchRoutes } from "@remix-run/router";
import * as React from "react";
import type { PatchRoutesOnNavigationFunction } from "react-router";

import type { AssetsManifest, FutureConfig } from "./entry";
import type { RouteModules } from "./routeModules";
import { createClientRoutes } from "./routes";

declare global {
  interface Navigator {
    connection?: { saveData: boolean };
  }
}

// Currently rendered links that may need prefetching
const nextPaths = new Set<string>();

// FIFO queue of previously discovered routes to prevent re-calling on
// subsequent navigations to the same path
const discoveredPathsMaxSize = 1000;
const discoveredPaths = new Set<string>();

// 7.5k to come in under the ~8k limit for most browsers
// https://stackoverflow.com/a/417184
const URL_LIMIT = 7680;

export function isFogOfWarEnabled(future: FutureConfig, isSpaMode: boolean) {
  return future.v3_lazyRouteDiscovery === true && !isSpaMode;
}

export function getPartialManifest(manifest: AssetsManifest, router: Router) {
  // Start with our matches for this pathname
  let routeIds = new Set(router.state.matches.map((m) => m.route.id));

  let segments = router.state.location.pathname.split("/").filter(Boolean);
  let paths: string[] = ["/"];

  // We've already matched to the last segment
  segments.pop();

  // Traverse each path for our parents and match in case they have pathless/index
  // children we need to include in the initial manifest
  while (segments.length > 0) {
    paths.push(`/${segments.join("/")}`);
    segments.pop();
  }

  paths.forEach((path) => {
    let matches = matchRoutes(router.routes, path, router.basename);
    if (matches) {
      matches.forEach((m) => routeIds.add(m.route.id));
    }
  });

  let initialRoutes = [...routeIds].reduce(
    (acc, id) => Object.assign(acc, { [id]: manifest.routes[id] }),
    {}
  );

  return {
    ...manifest,
    routes: initialRoutes,
  };
}

export function getPatchRoutesOnNavigationFunction(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  future: FutureConfig,
  isSpaMode: boolean,
  basename: string | undefined
): PatchRoutesOnNavigationFunction | undefined {
  if (!isFogOfWarEnabled(future, isSpaMode)) {
    return undefined;
  }
  return async ({ path, patch, signal, fetcherKey }) => {
    if (discoveredPaths.has(path)) {
      return;
    }
    await fetchAndApplyManifestPatches(
      [path],
      fetcherKey ? window.location.href : path,
      manifest,
      routeModules,
      future,
      isSpaMode,
      basename,
      patch,
      signal
    );
  };
}

export function useFogOFWarDiscovery(
  router: Router,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  future: FutureConfig,
  isSpaMode: boolean
) {
  React.useEffect(() => {
    // Don't prefetch if not enabled or if the user has `saveData` enabled
    if (
      !isFogOfWarEnabled(future, isSpaMode) ||
      navigator.connection?.saveData === true
    ) {
      return;
    }

    // Register a link href for patching
    function registerElement(el: Element) {
      let path =
        el.tagName === "FORM"
          ? el.getAttribute("action")
          : el.getAttribute("href");
      if (!path) {
        return;
      }
      let url = new URL(path, window.location.origin);
      if (!discoveredPaths.has(url.pathname)) {
        nextPaths.add(url.pathname);
      }
    }

    // Fetch patches for all currently rendered links
    async function fetchPatches() {
      let lazyPaths = Array.from(nextPaths.keys()).filter((path) => {
        if (discoveredPaths.has(path)) {
          nextPaths.delete(path);
          return false;
        }
        return true;
      });

      if (lazyPaths.length === 0) {
        return;
      }

      try {
        await fetchAndApplyManifestPatches(
          lazyPaths,
          null,
          manifest,
          routeModules,
          future,
          isSpaMode,
          router.basename,
          router.patchRoutes
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }

    // Register and fetch patches for all initially-rendered links/forms
    document.body
      .querySelectorAll("a[data-discover], form[data-discover]")
      .forEach((el) => registerElement(el));

    fetchPatches();

    // Setup a MutationObserver to fetch all subsequently rendered links/forms
    let debouncedFetchPatches = debounce(fetchPatches, 100);

    function isElement(node: Node): node is Element {
      return node.nodeType === Node.ELEMENT_NODE;
    }

    let observer = new MutationObserver((records) => {
      let elements = new Set<Element>();
      records.forEach((r) => {
        [r.target, ...r.addedNodes].forEach((node) => {
          if (!isElement(node)) return;
          if (node.tagName === "A" && node.getAttribute("data-discover")) {
            elements.add(node);
          } else if (
            node.tagName === "FORM" &&
            node.getAttribute("data-discover")
          ) {
            elements.add(node);
          }
          if (node.tagName !== "A") {
            node
              .querySelectorAll("a[data-discover], form[data-discover]")
              .forEach((el) => elements.add(el));
          }
        });
      });
      elements.forEach((el) => registerElement(el));

      debouncedFetchPatches();
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href", "action"],
    });

    return () => observer.disconnect();
  }, [future, isSpaMode, manifest, routeModules, router]);
}

const MANIFEST_VERSION_STORAGE_KEY = "remix-manifest-version";

export async function fetchAndApplyManifestPatches(
  paths: string[],
  errorReloadPath: string | null,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  future: FutureConfig,
  isSpaMode: boolean,
  basename: string | undefined,
  patchRoutes: Router["patchRoutes"],
  signal?: AbortSignal
): Promise<void> {
  let manifestPath = `${basename ?? "/"}/__manifest`.replace(/\/+/g, "/");
  let url = new URL(manifestPath, window.location.origin);
  paths.sort().forEach((path) => url.searchParams.append("p", path));
  url.searchParams.set("version", manifest.version);

  // If the URL is nearing the ~8k limit on GET requests, skip this optimization
  // step and just let discovery happen on link click.  We also wipe out the
  // nextPaths Set here so we can start filling it with fresh links
  if (url.toString().length > URL_LIMIT) {
    nextPaths.clear();
    return;
  }

  let serverPatches: AssetsManifest["routes"];
  try {
    let res = await fetch(url, { signal });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    } else if (
      res.status === 204 &&
      res.headers.has("X-Remix-Reload-Document")
    ) {
      if (!errorReloadPath) {
        // No-op during eager route discovery so we will trigger a hard reload
        // of the destination during the next navigation instead of reloading
        // while the user is sitting on the current page.  Slightly more
        // disruptive on fetcher calls because we reload the current page, but
        // it's better than the `React.useContext` error that occurs without
        // this detection.
        console.warn(
          "Detected a manifest version mismatch during eager route discovery. " +
            "The next navigation/fetch to an undiscovered route will result in " +
            "a new document navigation to sync up with the latest manifest."
        );
        return;
      }

      // This will hard reload the destination path on navigations, or the
      // current path on fetcher calls
      if (
        sessionStorage.getItem(MANIFEST_VERSION_STORAGE_KEY) ===
        manifest.version
      ) {
        // We've already tried fixing for this version, don' try again to
        // avoid loops - just let this navigation/fetch 404
        console.error(
          "Unable to discover routes due to manifest version mismatch."
        );
        return;
      }

      sessionStorage.setItem(MANIFEST_VERSION_STORAGE_KEY, manifest.version);
      window.location.href = errorReloadPath;
      throw new Error("Detected manifest version mismatch, reloading...");
    } else if (res.status >= 400) {
      throw new Error(await res.text());
    }

    // Reset loop-detection on a successful response
    sessionStorage.removeItem(MANIFEST_VERSION_STORAGE_KEY);
    serverPatches = (await res.json()) as AssetsManifest["routes"];
  } catch (e) {
    if (signal?.aborted) return;
    throw e;
  }

  // Patch routes we don't know about yet into the manifest
  let knownRoutes = new Set(Object.keys(manifest.routes));
  let patches: AssetsManifest["routes"] = Object.values(serverPatches).reduce(
    (acc, route) =>
      !knownRoutes.has(route.id)
        ? Object.assign(acc, { [route.id]: route })
        : acc,
    {}
  );
  Object.assign(manifest.routes, patches);

  // Track discovered paths so we don't have to fetch them again
  paths.forEach((p) => addToFifoQueue(p, discoveredPaths));

  // Identify all parentIds for which we have new children to add and patch
  // in their new children
  let parentIds = new Set<string | undefined>();
  Object.values(patches).forEach((patch) => {
    if (!patch.parentId || !patches[patch.parentId]) {
      parentIds.add(patch.parentId);
    }
  });
  parentIds.forEach((parentId) =>
    patchRoutes(
      parentId || null,
      createClientRoutes(
        patches,
        routeModules,
        null,
        future,
        isSpaMode,
        parentId
      )
    )
  );
}

function addToFifoQueue(path: string, queue: Set<string>) {
  if (queue.size >= discoveredPathsMaxSize) {
    let first = queue.values().next().value;
    if (typeof first === "string") queue.delete(first);
  }
  queue.add(path);
}

// Thanks Josh!
// https://www.joshwcomeau.com/snippets/javascript/debounce/
function debounce(callback: (...args: unknown[]) => unknown, wait: number) {
  let timeoutId: number | undefined;
  return (...args: unknown[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}
