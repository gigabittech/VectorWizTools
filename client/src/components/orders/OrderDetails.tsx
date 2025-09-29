import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderDetailsProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function OrderDetails({ notes, onNotesChange }: OrderDetailsProps) {
  return (
    <div data-testid="order-details">
      <h3 className="text-xl font-semibold mb-6">Order Details & Requirements</h3>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="notes" className="text-base font-medium">
            Special Requirements & Notes
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Tell us about your specific needs, color requirements, format preferences, or any other details
          </p>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Example: Please maintain the original blue color (#1E40AF), convert to SVG and AI formats, ensure text remains editable..."
            className="min-h-[120px]"
            data-testid="order-notes"
          />
        </div>

        <Card className="p-6 bg-muted/30">
          <h4 className="font-semibold mb-4">What to Include in Your Notes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm mb-2">Color Requirements</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Specific color codes (Hex, RGB, CMYK)</li>
                <li>• Color matching preferences</li>
                <li>• Gradient requirements</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm mb-2">Format & Usage</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Required file formats (AI, SVG, EPS, PDF)</li>
                <li>• Intended use (print, web, cutting)</li>
                <li>• Size requirements</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm mb-2">Design Elements</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Text handling (editable vs. outlined)</li>
                <li>• Background removal</li>
                <li>• Element separation</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm mb-2">Quality & Style</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Simplification level</li>
                <li>• Detail preservation</li>
                <li>• Style preferences</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">i</span>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                Revision Process
              </h5>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                We'll send you a proof for review before finalizing. You can request changes to ensure 
                the final result meets your exact requirements.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">Vector Conversion</Badge>
          <Badge variant="secondary" className="text-xs">Professional Quality</Badge>
          <Badge variant="secondary" className="text-xs">Multiple Formats</Badge>
          <Badge variant="secondary" className="text-xs">Revision Included</Badge>
        </div>
      </div>
    </div>
  );
}
