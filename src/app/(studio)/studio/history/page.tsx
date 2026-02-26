"use client";

import { useEffect, useState } from "react";
import { Loader2, Clock, CheckCircle2, XCircle, AlertCircle, Maximize2, Edit } from "lucide-react";
import { ImageViewerDialog } from "@/components/image-viewer-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Job {
    id: string;
    status: string;
    inputParams: string; // JSON
    outputPaths: string | null; // JSON
    createdAt: string;
    error: string | null;
}

export default function StudioHistoryPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/history")
            .then(res => res.json())
            .then(data => {
                if (data.jobs) setJobs(data.jobs);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "FAILED": return <XCircle className="h-4 w-4 text-red-500" />;
            case "PENDING":
            case "PROCESSING": return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const [viewerPath, setViewerPath] = useState<string | null>(null);

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
                <div>
                    <h1 className="text-xl font-bold">History</h1>
                    <p className="text-xs text-muted-foreground">Recent generation tasks</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                    Refresh
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No history found. Start generating!
                        </div>
                    ) : (
                        jobs.map((job) => {
                            const params = JSON.parse(job.inputParams || "{}");
                            const outputs = job.outputPaths ? JSON.parse(job.outputPaths) : [];
                            const prompt = params.prompt || "No prompt";
                            const type = params.type || "Generation";
                            const hasOutput = outputs.length > 0;

                            return (
                                <Card key={job.id} className="overflow-hidden bg-white shadow-sm border-zinc-200">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Thumbnail / Image */}
                                            <div
                                                className="w-full sm:w-32 h-32 bg-zinc-100 flex-shrink-0 border-r flex items-center justify-center relative group overflow-hidden cursor-pointer"
                                                onClick={() => hasOutput && setViewerPath(outputs[0])}
                                            >
                                                {hasOutput ? (
                                                    <>
                                                        <img
                                                            src={`/api/filesystem/image?path=${encodeURIComponent(outputs[0])}`}
                                                            alt="Result"
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        {getStatusIcon(job.status)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={type === "edit" ? "secondary" : "outline"} className="capitalize">{type}</Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(job.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            {getStatusIcon(job.status)}
                                                            <span className={
                                                                job.status === "COMPLETED" ? "text-green-600" :
                                                                    job.status === "FAILED" ? "text-red-600" : "text-blue-600"
                                                            }>
                                                                {job.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium line-clamp-2 text-zinc-700">
                                                        "{prompt}"
                                                    </p>
                                                    {job.error && (
                                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {job.error}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex justify-end gap-2 mt-2">
                                                    {hasOutput && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/studio/edit?image=${encodeURIComponent(outputs[0])}`)}
                                                            className="h-8 gap-2"
                                                        >
                                                            <Edit className="h-3 w-3" /> Edit
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <ImageViewerDialog
                path={viewerPath || ""}
                isOpen={!!viewerPath}
                onClose={() => setViewerPath(null)}
            />
        </div>
    );
}
