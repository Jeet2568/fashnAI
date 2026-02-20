import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Resource {
    id: string;
    type: string;
    name: string;
    prompt: string;
    thumbnail?: string;
}

interface ResourceCardProps {
    resource: Resource;
    onDelete: (id: string) => void;
}

export function ResourceCard({ resource, onDelete }: ResourceCardProps) {
    const copyPrompt = () => {
        navigator.clipboard.writeText(resource.prompt);
        toast.success("Prompt copied to clipboard");
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row h-full">
                {/* Left: Thumbnail */}
                <div className="w-full sm:w-48 h-48 sm:h-auto shrink-0 bg-muted relative group">
                    {resource.thumbnail ? (
                        <img
                            src={resource.thumbnail}
                            alt={resource.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">
                            No Image
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex-1 p-6 flex flex-col gap-4 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Category:</span>
                                <Badge variant="secondary" className="capitalize">
                                    {resource.type.replace("_", " ")}
                                </Badge>
                            </div>
                            <h3 className="font-semibold text-xl tracking-tight">{resource.name}</h3>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => onDelete(resource.id)}
                            title="Delete Resource"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-lg p-3 border border-border/50 relative group">
                        <p className="text-sm text-muted-foreground font-mono leading-relaxed line-clamp-3">
                            {resource.prompt}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
                            onClick={copyPrompt}
                            title="Copy Prompt"
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
