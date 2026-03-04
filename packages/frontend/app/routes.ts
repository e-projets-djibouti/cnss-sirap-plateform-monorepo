import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // TODO: ajouter les routes métier
  // route("upload", "routes/upload.tsx"),
  // route("dashboard", "routes/dashboard.tsx"),
] satisfies RouteConfig;
