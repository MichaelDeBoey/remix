import type { AppConfig } from "@remix-run/dev";

export const defaultConfig: AppConfig = {
  ignoredRouteFiles: ["**/.*"],
  publicPath: "/_static/build/",
  server: "server.ts",
  serverBuildPath: "server/index.mjs",
  serverModuleFormat: "esm",
};
