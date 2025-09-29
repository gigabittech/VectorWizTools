import { Card } from "@/components/ui/card";
import { Image, Award, FileText, Scissors, RotateCcw } from "lucide-react";

interface ServiceSelectionProps {
  selectedService?: string;
  onServiceSelect: (service: string) => void;
}

const services = [
  {
    id: "IMAGE_TO_VECTOR",
    name: "Image to Vector",
    description: "Convert raster images to scalable vectors",
    price: "Starting at $25",
    icon: Image,
    color: "bg-primary/10 group-hover:bg-primary group-hover:text-white",
    iconColor: "text-primary group-hover:text-white",
  },
  {
    id: "LOGO_VECTORIZATION", 
    name: "Logo Vectorization",
    description: "Professional logo conversion",
    price: "Starting at $35",
    icon: Award,
    color: "bg-emerald-100 group-hover:bg-primary group-hover:text-white",
    iconColor: "text-emerald-600 group-hover:text-white",
  },
  {
    id: "PDF_TO_VECTOR",
    name: "PDF to Vector", 
    description: "Extract and vectorize PDF elements",
    price: "Starting at $30",
    icon: FileText,
    color: "bg-red-100 group-hover:bg-primary group-hover:text-white",
    iconColor: "text-red-600 group-hover:text-white",
  },
  {
    id: "DXF_CUTTER_READY",
    name: "DXF Cutter Ready",
    description: "Prepare files for CNC/laser cutting", 
    price: "Starting at $40",
    icon: Scissors,
    color: "bg-amber-100 group-hover:bg-primary group-hover:text-white",
    iconColor: "text-amber-600 group-hover:text-white",
  },
  {
    id: "RASTER_TO_VECTOR",
    name: "Raster to Vector",
    description: "High-quality raster conversion",
    price: "Starting at $28",
    icon: RotateCcw,
    color: "bg-purple-100 group-hover:bg-primary group-hover:text-white", 
    iconColor: "text-purple-600 group-hover:text-white",
  },
];

export default function ServiceSelection({ selectedService, onServiceSelect }: ServiceSelectionProps) {
  return (
    <div data-testid="service-selection">
      <h3 className="text-xl font-semibold mb-6">Choose Your Service</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedService === service.id;
          
          return (
            <Card
              key={service.id}
              className={`p-6 cursor-pointer transition-all card-hover group ${
                isSelected 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border hover:border-primary"
              }`}
              onClick={() => onServiceSelect(service.id)}
              data-testid={`service-${service.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${service.color}`}>
                  <Icon className={`h-5 w-5 transition-all ${service.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    {service.description}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {service.price}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
