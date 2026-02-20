"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Shirt, Plus, ArrowLeft, Loader2, Folder, Filter } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { ClientSelectModal } from "@/components/admin/ClientSelectModal";

function ProductListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientName = searchParams.get("client");
    const { setSelectedFolder } = useStore();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProductName, setNewProductName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const fetchProducts = async () => {
        if (!clientName) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/filesystem?path=${encodeURIComponent(clientName)}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.files.filter((f: any) => f.isDirectory));
            }
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientName) {
            fetchProducts();
        } else {
            setLoading(false);
            // Auto-open modal if no client selected? 
            // Maybe annoying on refresh if intended to be empty.
            // Let's just show the empty state with button.
        }
    }, [clientName]);

    const handleSelectClient = (clientPath: string) => {
        router.push(`/admin/products?client=${encodeURIComponent(clientPath)}`);
        setIsClientModalOpen(false);
    };

    const handleCreateProduct = async () => {
        if (!newProductName || !clientName) return;
        setCreating(true);
        try {
            // Create Product folder AND subfolders: RAW, Results, Reject
            const res = await fetch("/api/filesystem/mkdir", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: `${clientName}/${newProductName}`,
                    subfolders: ["RAW", "Results", "Reject"]
                })
            });

            if (!res.ok) throw new Error("Failed to create product");

            toast.success(`Product "${newProductName}" created with RAW/Results/Reject folders`);
            setNewProductName("");
            setIsDialogOpen(false);
            fetchProducts();
        } catch (error) {
            toast.error("Failed to create product");
        } finally {
            setCreating(false);
        }
    };

    const handleEnterStudio = (productPath: string) => {
        // Navigate to the Admin Files view instead of Studio
        router.push(`/admin/products/files?path=${encodeURIComponent(productPath)}`);
    };

    if (!clientName) {
        return (
            <div className="flex flex-col items-center justify-center h-[ca. 80vh] gap-6 mt-10">
                <div className="bg-slate-100 p-6 rounded-full">
                    <Filter className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-700">Select a Client to Manage Products</h2>
                <Button size="lg" onClick={() => setIsClientModalOpen(true)}>
                    Browse Clients
                </Button>

                <ClientSelectModal
                    open={isClientModalOpen}
                    onOpenChange={setIsClientModalOpen}
                    onSelectClient={handleSelectClient}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setIsClientModalOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Change Client
                </Button>

                <div className="hidden md:block h-6 w-px bg-border" />

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">Client: <span className="font-semibold text-foreground">{clientName}</span></p>
                </div>
                <div className="ml-auto">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="Product Name"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Will automatically create: RAW, Results, Reject folders.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateProduct} disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <ClientSelectModal
                open={isClientModalOpen}
                onOpenChange={setIsClientModalOpen}
                onSelectClient={handleSelectClient}
            />

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : products.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                    No products found for this client.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <Card
                            key={product.name}
                            className="cursor-pointer hover:bg-accent transition-colors group"
                            onClick={() => handleEnterStudio(product.path)}
                        >
                            <CardContent className="flex flex-col items-center p-6 gap-4 text-center">
                                <div className="bg-orange-100 p-4 rounded-full group-hover:bg-orange-200 transition-colors">
                                    <Shirt className="h-8 w-8 text-orange-600" />
                                </div>
                                <div>
                                    <div className="font-semibold truncate max-w-[200px]">{product.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Click to open files</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProductListPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ProductListContent />
        </Suspense>
    );
}
