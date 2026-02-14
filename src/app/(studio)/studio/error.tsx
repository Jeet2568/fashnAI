"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
            <p className="max-w-md text-sm text-foreground/80 bg-muted p-4 rounded-md font-mono text-left overflow-auto max-h-[200px] w-full">
                {error.message}
                {error.stack && (
                    <span className="block mt-2 text-xs opacity-70 border-t pt-2 border-border/50">
                        {error.stack}
                    </span>
                )}
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Full Refresh
                </Button>
            </div>
        </div>
    );
}
