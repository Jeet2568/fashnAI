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
        console.error("Root Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background text-foreground">
            <h2 className="text-3xl font-bold tracking-tight text-destructive mb-4">Application Error</h2>
            <p className="max-w-xl text-sm bg-muted p-6 rounded-lg font-mono text-left overflow-auto mb-6 border border-border">
                <strong className="block mb-2 text-foreground">Message:</strong>
                {error.message}
                {error.stack && (
                    <span className="block mt-4 text-xs opacity-70 border-t pt-2 border-border/50 whitespace-pre-wrap">
                        {error.stack}
                    </span>
                )}
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Reload Page
                </Button>
            </div>
        </div>
    );
}
