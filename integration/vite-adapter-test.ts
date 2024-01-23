import * as fs from "node:fs";
import * as path from "node:path";
import { test, expect } from "@playwright/test";
import { normalizePath } from "vite";
import getPort from "get-port";

import {
  createProject,
  viteDev,
  viteBuild,
  VITE_CONFIG,
} from "./helpers/vite.js";

test.describe(async () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  function pathStartsWithCwd(pathname: string) {
    return normalizePath(pathname).startsWith(normalizePath(cwd));
  }

  function relativeToCwd(pathname: string) {
    return normalizePath(path.relative(cwd, pathname));
  }

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      "vite.config.ts": await VITE_CONFIG({
        port,
        pluginOptions: `
          {
            adapter: async ({ remixConfig }) => ({
              unstable_serverBundles(...args) {
                // This lets us assert that user options are passed to adapter options hook
                return remixConfig.unstable_serverBundles?.(...args) + "--adapter-options";
              },
              async buildEnd(args) {
                let fs = await import("node:fs/promises");
                await fs.writeFile("BUILD_END_ARGS.json", JSON.stringify(args, null, 2), "utf-8");
              }
            }),
            
            unstable_serverBundles() {
              return "user-options";
            }
          },
        `,
      }),
    });
    stop = await viteDev({ cwd, port });
  });
  test.afterAll(() => stop());

  test("Vite / adapter / unstable_serverBundles and buildEnd hooks", async () => {
    let { status } = viteBuild({ cwd });
    expect(status).toBe(0);

    let buildEndArgs: any = JSON.parse(
      fs.readFileSync(path.join(cwd, "BUILD_END_ARGS.json"), "utf8")
    );
    let { remixConfig } = buildEndArgs;

    // Before rewriting to relative paths, assert that paths are absolute within cwd
    expect(pathStartsWithCwd(remixConfig.buildDirectory)).toBe(true);

    // Rewrite path args to be relative and normalized for snapshot test
    remixConfig.buildDirectory = relativeToCwd(remixConfig.buildDirectory);

    expect(buildEndArgs).toEqual({
      remixConfig: {
        buildDirectory: "build",
        serverBuildFile: "index.js",
        unstable_ssr: true,
      },
      buildManifest: {
        routeIdToServerBundleId: {
          "routes/_index": "user-options--adapter-options",
        },
        routes: {
          root: {
            file: "app/root.tsx",
            id: "root",
            path: "",
          },
          "routes/_index": {
            file: "app/routes/_index.tsx",
            id: "routes/_index",
            index: true,
            parentId: "root",
          },
        },
        serverBundles: {
          "user-options--adapter-options": {
            file: "build/server/user-options--adapter-options/index.js",
            id: "user-options--adapter-options",
          },
        },
      },
    });
  });
});