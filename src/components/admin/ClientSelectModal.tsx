"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSelectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectClient: (clientPath: string) => void;
}

export function ClientSelectModal({ open, onOpenChange, onSelectClient }: ClientSelectModalProps) {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            fetchClients();
        }
    }, [open]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            // Using scan with depth 3 for flat client list
            const res = await fetch(`/api/filesystem/scan?root=CodeVeda%20AI&depth=3`);
            if (res.ok) {
                const data = await res.json();
                setClients(data.files || []);
            } else {
                toast.error("Failed to load clients");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Client</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clients..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 border rounded-md p-2 bg-slate-50">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No clients found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredClients.map((client) => (
                                <button
                                    key={client.path}
                                    className="flex flex-col items-center p-4 bg-white border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all text-center gap-2"
                                    onClick={() => onSelectClient(client.path)}
                                >
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <UserCircle className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-sm font-medium truncate w-full" title={client.name}>
                                        {client.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate w-full">
                                        {client.parent}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
