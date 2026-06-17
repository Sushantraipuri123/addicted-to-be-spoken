import { EmbroideryStudio } from "@/components/embroidery/EmbroideryStudio";
import "@/components/embroidery/embroidery.css";

export const metadata = {
  title: "Embroidery — Custom jacket",
  description: "Add embroidery to your custom blazer design",
};

export default function EmbroideryPage() {
  return <EmbroideryStudio />;
}
