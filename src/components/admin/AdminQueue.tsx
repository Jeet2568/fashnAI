import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AdminQueue() {
    // Mock Queue Data
    const queue = [
        { id: "job_123", user: "Client A", task: "Model Swap", status: "processing", time: "2m ago" },
        { id: "job_124", user: "Client B", task: "Try-On", status: "queued", time: "5m ago" },
        { id: "job_125", user: "Client A", task: "Edit", status: "queued", time: "12m ago" },
        { id: "job_126", user: "Client C", task: "Model Swap", status: "queued", time: "15m ago" },
    ];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Queue</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pl-2 pr-2">
                <div className="space-y-3">
                    {queue.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">Queue is empty</div>
                    ) : (
                        queue.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/40 text-sm">
                                <div>
                                    <div className="font-medium">{job.user}</div>
                                    <div className="text-xs text-muted-foreground">{job.task} • {job.time}</div>
                                </div>
                                <Badge variant={job.status === "processing" ? "default" : "secondary"}>
                                    {job.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
