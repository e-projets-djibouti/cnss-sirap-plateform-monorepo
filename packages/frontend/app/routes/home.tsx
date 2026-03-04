import type { Route } from "./+types/home";
import { APP_NAME } from "@sirap/shared";

export function meta({}: Route.MetaArgs) {
  return [
    { title: APP_NAME },
    { name: "description", content: `Plateforme ${APP_NAME}` },
  ];
}

export default function Home() {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Bienvenue sur la plateforme.</p>
    </main>
  );
}
