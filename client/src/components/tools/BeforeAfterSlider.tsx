import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  title: string;
  description: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  title,
  description
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  return (
    <Card className="overflow-hidden card-hover" data-testid="before-after-slider">
      <div 
        ref={containerRef}
        className="before-after-slider relative h-64 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Before image (background) */}
        <img 
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        {/* After image (clipped overlay) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={afterImage}
            alt={afterAlt}
            className="w-full h-full object-cover"
            style={{ width: `${(100 / sliderPosition) * 100}%` }}
            draggable={false}
          />
        </div>
        
        {/* Slider handle */}
        <div 
          className="before-after-handle"
          style={{ left: `${sliderPosition}%` }}
          data-testid="slider-handle"
        >
          <div className="w-1 h-full bg-white absolute left-1/2 top-0 transform -translate-x-1/2"></div>
        </div>
        
        {/* Labels */}
        <Badge className="absolute top-4 left-4 bg-black/50 text-white border-none">
          Before
        </Badge>
        <Badge className="absolute top-4 right-4 bg-primary text-white border-none">
          After
        </Badge>
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold mb-2" data-testid="slider-title">{title}</h3>
        <p className="text-muted-foreground text-sm" data-testid="slider-description">
          {description}
        </p>
      </div>
    </Card>
  );
}
