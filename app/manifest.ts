import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aria Health — Telemedicine",
    short_name: "Aria Health",
    description:
      "Discover doctors, book appointments, consult online, message your care team and manage records — a premium telemedicine platform.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0070d1",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Find doctors", short_name: "Doctors", url: "/patient/doctors" },
      { name: "Appointments", short_name: "Appts", url: "/patient/appointments" },
    ],
  };
}
