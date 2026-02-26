"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Search, Loader2, ScanFace, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ResourceCard } from "@/components/admin/ResourceCard";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  type: string;
  name: string;
  prompt: string;
  thumbnail?: string;
  createdAt: string;
}

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/resource-categories");
      if (res.ok) {
        const data = await res.json();
        // Extract values from category objects
        setCategories(data.map((c: any) => c.value));
      }
    } catch (e) {
      console.error("Failed to load categories");
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resources");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResources(data);
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const res = await fetch(`/api/resources?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Resource deleted");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || r.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (resource: Resource) => {
    setEditingResource({ ...resource });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingResource),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Resource updated successfully");
      setIsEditModalOpen(false);
      fetchResources();
    } catch (error) {
      toast.error("Failed to update resource");
    } finally {
      setIsSaving(false);
    }
  };

  const mainCategories = categories.filter(c => !["earrings", "necklace", "bracelet", "rings", "shoes", "watch", "handbag"].includes(c));
  const accessoryCategories = categories.filter(c => ["earrings", "necklace", "bracelet", "rings", "shoes", "watch", "handbag"].includes(c));

  return (
    <div className="p-6 space-y-6 flex flex-col h-full bg-background">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              Manage prompts and presets for the Studio.
            </p>
          </div>
          <Button
            className="gap-2 shrink-0"
            onClick={() => router.push("/admin/resources/add")}
          >
            <PlusCircle className="h-4 w-4" />
            Add New Resource
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full shrink-0"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "model" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("model")}
              className="rounded-full shrink-0 gap-2"
            >
              <ScanFace className="h-3.5 w-3.5" />
              Models
            </Button>
            {mainCategories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full capitalize whitespace-nowrap shrink-0"
              >
                {cat.replace(/_/g, " ")}
              </Button>
            ))}

            {accessoryCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-full capitalize whitespace-nowrap shrink-0",
                      accessoryCategories.includes(selectedCategory) && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {accessoryCategories.includes(selectedCategory) ? selectedCategory.replace(/_/g, " ") : "Accessories"}
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[160px]">
                  {accessoryCategories.map(cat => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn("cursor-pointer capitalize", selectedCategory === cat && "bg-zinc-100 font-medium")}
                    >
                      {cat.replace(/_/g, " ")}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="ml-auto w-full sm:w-auto relative flex-1 sm:max-w-xs shrink-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the details for this studio resource.
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingResource.name}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingResource.type}
                  onValueChange={(val) => setEditingResource({ ...editingResource, type: val })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model" className="font-semibold text-indigo-600">Model</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={`edit-${c}`} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-thumbnail">Thumbnail URL (Optional)</Label>
                <Input
                  id="edit-thumbnail"
                  value={editingResource.thumbnail || ""}
                  onChange={(e) => setEditingResource({ ...editingResource, thumbnail: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt">Generation Prompt</Label>
                <Textarea
                  id="edit-prompt"
                  rows={4}
                  value={editingResource.prompt}
                  onChange={(e) => setEditingResource({ ...editingResource, prompt: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content: Card List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="space-y-4 pb-10">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
            No resources found matching your criteria.
          </div>
        )}
      </div>
    </div >
  );
}
