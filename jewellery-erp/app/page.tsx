import type { Metadata } from "next";
import { CinematicLandingExperience } from "@/components/cinematic/landing-experience";

export const metadata: Metadata = {
  title: "AURA Jewellery ERP — Pure Metallurgy. Mathematical Precision.",
  description:
    "Next-generation sovereign multi-tenant ERP for Indian jewellery businesses, bullion merchants, and retail empires. Milligram accuracy, 3D telemetry, and concurrency-safe GST billing.",
};

export default function HomePage() {
  return <CinematicLandingExperience />;
}
