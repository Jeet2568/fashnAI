"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileExplorer } from "@/components/file-explorer";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

function ProductFilesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const path = searchParams.get("path");
    const { setSelectedFolder } = useStore();

    useEffect(() => {
        if (path) {
            setSelectedFolder(path);
        }
    }, [path, setSelectedFolder]);

    if (!path) {
        return <div className="p-4">No path specified.</div>;
    }

    // Split path to get client/product names for UI
    const parts = path.split("/");
    const productName = parts[parts.length - 1];
    const clientName = parts.length > 1 ? parts[parts.length - 2] : "Client";

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
            <div className="flex items-center gap-4 px-1">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{productName}</h2>
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-background">
                <FileExplorer
                    key={path || "fs-root"}
                    variant="split"
                    initialPath={path || ""}
                    onSelectFolder={(path) => setSelectedFolder(path)}
                />
            </div>
        </div>
    );
}

export default function ProductFilesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ProductFilesContent />
        </Suspense>
    );
}
