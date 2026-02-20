"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Search, Save, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/ui/file-uploader";
import { cn } from "@/lib/utils";

interface Category {
    label: string;
    value: string;
    thumbnail: string;
}

interface PendingResource {
    id: string; // Temporary ID
    name: string;
    prompt: string;
    thumbnail: string;
}

export default function AddResourcePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // New Category Dialog
    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const [newCatThumb, setNewCatThumb] = useState("");

    // Edit Category Dialog
    const [isEditCatDialogOpen, setIsEditCatDialogOpen] = useState(false);
    const [editCatName, setEditCatName] = useState("");
    const [editCatThumb, setEditCatThumb] = useState("");

    // Sync edit state when active category changes
    useEffect(() => {
        const cat = categories.find(c => c.value === selectedCategory);
        if (cat) {
            setEditCatName(cat.label);
            setEditCatThumb(cat.thumbnail || "");
        }
    }, [selectedCategory, categories]);

    // Resource List State
    const [pendingResources, setPendingResources] = useState<PendingResource[]>([]);

    // Current Pending Resource Form
    const [currentItem, setCurrentItem] = useState({
        name: "",
        prompt: "",
        thumbnail: ""
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/resource-categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
                // Select first category if available and none selected
                if (data.length > 0 && !selectedCategory) {
                    setSelectedCategory(data[0].value);
                }
            }
        } catch (error) {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName) return toast.error("Category name required");

        const value = newCatName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const newCat = { label: newCatName, value, thumbnail: newCatThumb };

        const updatedCategories = [...categories, newCat];
        await saveCategories(updatedCategories);

        toast.success("Category added");
        setSelectedCategory(value);
        setIsCatDialogOpen(false);
        setNewCatName("");
        setNewCatThumb("");
    };

    const handleUpdateCategory = async () => {
        if (!editCatName) return toast.error("Name required");

        const updatedCategories = categories.map(c =>
            c.value === selectedCategory
                ? { ...c, label: editCatName, thumbnail: editCatThumb }
                : c
        );

        await saveCategories(updatedCategories);
        toast.success("Category updated");
        setIsEditCatDialogOpen(false);
    };

    const handleDeleteCategory = async () => {
        if (!confirm("Delete this category? Items will remain but may lose their grouping.")) return;

        const updatedCategories = categories.filter(c => c.value !== selectedCategory);
        await saveCategories(updatedCategories);

        toast.success("Category deleted");
        setIsEditCatDialogOpen(false);
        setSelectedCategory("");
    };

    const saveCategories = async (newCategories: Category[]) => {
        setCategories(newCategories);
        try {
            const res = await fetch("/api/admin/resource-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCategories),
            });
            if (!res.ok) throw new Error("Failed to save");
        } catch (e) {
            toast.error("Failed to save category changes");
        }
    };

    const handleAddItemToList = () => {
        if (!currentItem.name || !currentItem.prompt || !currentItem.thumbnail) {
            return toast.error("Please fill all item fields");
        }

        const newItem: PendingResource = {
            id: crypto.randomUUID(),
            ...currentItem
        };

        setPendingResources([...pendingResources, newItem]);
        setCurrentItem({ name: "", prompt: "", thumbnail: "" });
        toast.success("Item added to list");
    };

    const handleRemoveItem = (id: string) => {
        setPendingResources(pendingResources.filter(i => i.id !== id));
    };

    const handleSaveAll = async () => {
        if (pendingResources.length === 0) return toast.error("No items to save");
        if (!selectedCategory) return toast.error("No category selected");

        try {
            // Save each resource
            const promises = pendingResources.map(item =>
                fetch("/api/resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: selectedCategory,
                        name: item.name,
                        prompt: item.prompt,
                        thumbnail: item.thumbnail
                    })
                })
            );

            await Promise.all(promises);
            toast.success(`Saved ${pendingResources.length} resources!`);

            // Clear list or redirect?
            setPendingResources([]);
        } catch (error) {
            toast.error("Failed to save resources");
        }
    };

    const activeActiveCategoryData = categories.find(c => c.value === selectedCategory);

    return (
        <div className="p-6 space-y-6 h-full flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add New Resource</h1>
                        <p className="text-muted-foreground">Create categories and add items.</p>
                    </div>
                </div>
            </div>

            {/* Top Controls: Type & Add Category */}
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1 max-w-xs">
                    <Label className="mb-2 block">Category Type</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-6 gap-2">
                            <PlusCircle className="h-4 w-4" /> Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Category</DialogTitle>
                            <DialogDescription>Define a new resource type (e.g., "Boots", "Hair Styles").</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Category Name</Label>
                                <Input
                                    placeholder="e.g. Earrings"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category Thumbnail</Label>
                                <FileUploader
                                    value={newCatThumb}
                                    onValueChange={setNewCatThumb}
                                    folder="_categories"
                                    className="h-32"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddCategory}>Create Category</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left: Category Context (Visual Only as per wireframe) */}
                <Card className="lg:col-span-3 flex flex-col h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Category Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-square bg-muted rounded-md overflow-hidden border relative group">
                            {activeActiveCategoryData?.thumbnail ? (
                                <img src={activeActiveCategoryData.thumbnail} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No Thumbnail</div>
                            )}
                        </div>
                        <div className="text-center font-semibold text-xl">
                            {activeActiveCategoryData?.label || "Select Category"}
                        </div>

                        <Dialog open={isEditCatDialogOpen} onOpenChange={setIsEditCatDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" size="sm" disabled={!selectedCategory}>
                                    Edit Category
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Category</DialogTitle>
                                    <DialogDescription>Update category details.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Category Name</Label>
                                        <Input
                                            value={editCatName}
                                            onChange={(e) => setEditCatName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category Thumbnail</Label>
                                        <FileUploader
                                            value={editCatThumb}
                                            onValueChange={setEditCatThumb}
                                            folder="_categories"
                                            className="h-32"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="destructive" onClick={handleDeleteCategory}>Delete</Button>
                                    <Button onClick={handleUpdateCategory}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Right: Item Editor */}
                <Card className="lg:col-span-9 flex flex-col">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Add Items to "{activeActiveCategoryData?.label}"</CardTitle>
                                <p className="text-sm text-muted-foreground">Fill details and add to list before saving.</p>
                            </div>
                            <Button onClick={handleSaveAll} disabled={pendingResources.length === 0} className="gap-2">
                                <Save className="h-4 w-4" /> Save {pendingResources.length} Items
                            </Button>
                        </div>
                    </CardHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* 1. Input Area */}
                        <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-primary/20 space-y-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-primary" />
                                New Item Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Thumbnail Input */}
                                <div className="md:col-span-4">
                                    <Label className="mb-2 block">Item Thumbnail</Label>
                                    <FileUploader
                                        value={currentItem.thumbnail}
                                        onValueChange={(url) => setCurrentItem({ ...currentItem, thumbnail: url })}
                                        folder={`_resources/${selectedCategory}`}
                                        label="Upload Item Image"
                                    />
                                </div>

                                {/* Text Inputs */}
                                <div className="md:col-span-8 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Item Name</Label>
                                        <Input
                                            placeholder="e.g. Gold Hoop Earrings"
                                            value={currentItem.name}
                                            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Prompt</Label>
                                        <Textarea
                                            placeholder="Prompt that triggers this item..."
                                            className="h-24 resize-none"
                                            value={currentItem.prompt}
                                            onChange={(e) => setCurrentItem({ ...currentItem, prompt: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleAddItemToList} variant="secondary" className="w-full sm:w-auto">
                                            Add Item to List
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 2. Pending List */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Pending Items ({pendingResources.length})</h3>
                            {pendingResources.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-lg">
                                    List is empty. Add items above.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {pendingResources.map((item, idx) => (
                                        <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors group">
                                            <div className="h-20 w-20 shrink-0 bg-muted rounded-md overflow-hidden border">
                                                <img src={item.thumbnail} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">{item.name}</span>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground font-mono line-clamp-2">{item.prompt}</p>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <Badge variant="outline" className="text-[10px] h-5">Pending Save</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </Card>
            </div>
        </div>
    );
}

// Helper Badge component since imports might be missing/different
function Badge({ children, className, variant = "default" }: any) {
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variant === "secondary" ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" :
                "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            className
        )}>
            {children}
        </span>
    );
}
