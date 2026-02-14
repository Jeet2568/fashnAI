"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

interface NewProjectDialogProps {
    onProjectCreated: (path: string) => void;
    children?: React.ReactNode;
}

export function NewProjectDialog({ onProjectCreated, children }: NewProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [clientName, setClientName] = useState("");
    const [productName, setProductName] = useState("");

    // Fetch clients on open
    useEffect(() => {
        if (open) {
            fetch("/api/clients")
                .then(res => res.json())
                .then(data => {
                    if (data.clients) setClients(data.clients);
                })
                .catch(err => console.error("Failed to fetch clients", err));
        }
    }, [open]);

    const handleCreate = async () => {
        if (!clientName || !productName) {
            toast.error("Please enter both Client and Product names");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/projects/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId: selectedClientId === "new" ? undefined : selectedClientId,
                    clientName: selectedClientId === "new" ? clientName : undefined,
                    productName
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create project");

            toast.success("Project Created Successfully!");
            toast.info(`Path: ${data.path}`);

            // Callback with the full path to the product folder
            onProjectCreated(data.fullPath);
            setOpen(false);

            // Reset form
            setProductName("");
            // Keep client name as they might add multiple products for same client

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <FolderPlus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Start New Session</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="client">Client</Label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">+ Create New Client</SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} {c.rootFolder ? '(Custom Path)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedClientId === "new" && (
                            <Input
                                id="client-new"
                                placeholder="Enter New Client Name"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="mt-2"
                            />
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="product">Product Name</Label>
                        <Input
                            id="product"
                            placeholder="e.g. Summer Dress, Red T-Shirt"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                    </div>

                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                        <p className="font-semibold mb-1">Will create structure:</p>
                        <code className="block text-[10px] break-all">
                            CodeVeda AI / {new Date().getMonth() + 1}-{new Date().getFullYear()} / {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')} / XX_{clientName || 'Client'} / YY_{productName || 'Product'} / [RAW, Results]
                        </code>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
