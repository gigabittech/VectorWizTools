import LogoDimensions from "@/components/tools/LogoDimensions";
import ToolLayout from "@/components/tools/shared/ToolLayout";
import { Paper, Title, Grid, Text, List, Group, Stack, Button } from "@mantine/core";
import { Monitor, Smartphone, FileText, CheckCircle, Award, Share2, Globe } from "lucide-react";
import { Link } from "wouter";

export default function LogoDimensionsPage() {
  return (
    <ToolLayout
      title="Logo Dimension Generator & Guide"
      description="Complete reference for logo sizes across all platforms. Get exact dimensions for social media, business materials, web graphics, and print applications."
      category="Image Tools"
      keywords={["logo dimensions", "social media sizes", "logo size guide", "web logo dimensions", "print logo requirements", "responsive logo design"]}
      howToSteps={[
        { name: "Choose Platform", text: "Select the platform (Social Media, Web, or Print) you're designing for." },
        { name: "Review Dimensions", text: "Check the exact pixel and inch requirements for each application." },
        { name: "Optimize Logo", text: "Adjust your logo layout to fit the specific dimension requirements." },
        { name: "Export Correctly", text: "Save your logo in the recommended format (PNG for web, Vector for print)." },
      ]}
    >
      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/70 border border-white/40 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <LogoDimensions />
        </div>
      </div>
    </ToolLayout>
  );
}
