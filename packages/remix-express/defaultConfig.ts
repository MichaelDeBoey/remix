import type { AppConfig } from "@remix-run/dev";

export const defaultConfig: AppConfig = {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
};
