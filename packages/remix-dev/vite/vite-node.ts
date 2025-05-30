import { ViteNodeServer } from "vite-node/server";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
import type * as Vite from "vite";

import { getVite, preloadVite } from "./vite";
import { ssrExternals } from "./ssr-externals";

export type Context = {
  devServer: Vite.ViteDevServer;
  server: ViteNodeServer;
  runner: ViteNodeRunner;
};

export async function createContext({
  root,
  mode,
}: {
  root: Vite.UserConfig["root"];
  mode: Vite.ConfigEnv["mode"];
}): Promise<Context> {
  await preloadVite();
  let vite = getVite();

  let devServer = await vite.createServer({
    root,
    mode,
    server: {
      preTransformRequests: false,
      hmr: false,
      watch: null,
    },
    ssr: {
      external: ssrExternals,
    },
    optimizeDeps: {
      noDiscovery: true,
    },
    configFile: false,
    envFile: false,
    plugins: [],
  });
  await devServer.pluginContainer.buildStart({});

  let server = new ViteNodeServer(devServer);

  installSourcemapsSupport({
    getSourceMap: (source) => server.getSourceMap(source),
  });

  let runner = new ViteNodeRunner({
    root: devServer.config.root,
    base: devServer.config.base,
    fetchModule(id) {
      return server.fetchModule(id);
    },
    resolveId(id, importer) {
      return server.resolveId(id, importer);
    },
  });

  return { devServer, server, runner };
}
