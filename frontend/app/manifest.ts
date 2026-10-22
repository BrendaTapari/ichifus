import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ichifus",
    short_name: "Ichifus",
    description: "Historial clínico veterinario para mascotas",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f0fb",
    theme_color: "#6d28d9",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
