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
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Messages", short_name: "Messages", url: "/patient/messages" },
      { name: "Find doctors", short_name: "Doctors", url: "/patient/doctors" },
      { name: "Appointments", short_name: "Appts", url: "/patient/appointments" },
    ],
  };
}
