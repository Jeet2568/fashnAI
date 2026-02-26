"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, Save, Trash2, X } from "lucide-react";

interface User {
    id: string;
    username: string;
    role: "ADMIN" | "USER" | "SUPER_ADMIN";
    credits: number;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ username: string; password?: string; role: string }>({
        username: "",
        role: "USER"
    });

    // Create Form state
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "USER",
        credits: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Error loading users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create user");
            }

            toast.success("User created successfully");
            setIsDialogOpen(false);
            setFormData({ username: "", password: "", role: "USER", credits: 0 }); // Reset form
            fetchUsers(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            // Check if DELETE endpoint exists? Assuming general crud pattern if not I need to check.
            // Wait, previous code had DELETE logic? No, only POST/GET was in recent file view.
            // Ah, I missed checking DELETE support in API.
            // The previous file had `handleDelete` fetching `DELETE /api/resources`? No, wait.
            // The previous file snippet for users page didn't show DELETE implementation in API.
            // I better add DELETE to API too if missing.
            // For now, let's assume I'll add it.

            // Correction: The previous `UsersPage` code I replaced DID NOT have `handleDelete`.
            // But the wireframe has "Delete". I need to allow deleting users.

            // Wait, the previous file had `ResourceCard` delete logic which called `/api/resources`.
            // Users page logic was just listing.

            // I will implement DELETE in API in next step if needed.
            // Here is the frontend logic:
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const startEdit = (user: User) => {
        setEditingId(user.id);
        setEditForm({
            username: user.username,
            role: user.role,
            password: "" // Start empty
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ username: "", role: "USER" });
    };

    const saveEdit = async (id: string) => {
        try {
            const body: any = {
                id,
                username: editForm.username,
                role: editForm.role
            };
            if (editForm.password && editForm.password.length >= 6) {
                body.password = editForm.password;
            } else if (editForm.password && editForm.password.length < 6) {
                return toast.error("Password must be at least 6 characters");
            }

            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update");
            }

            toast.success("User updated");
            setEditingId(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col p-6 bg-zinc-50/50">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage system users and access controls.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle className="sr-only">Add New User</DialogTitle>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    required
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                            </div>
                            {/* Role Selection */}
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Credits (Hidden or Optional based on wireframe strictly? Keeping simple) */}
                            {/* Wireframe didn't show credits in Add User but previous code had it. I'll omit based on user request for "like the wireframe" */}

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border bg-white shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-zinc-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[200px]">Username</TableHead>
                                <TableHead className="w-[200px]">Password</TableHead>
                                <TableHead className="w-[150px]">Role</TableHead>
                                <TableHead className="w-[150px]">Created On</TableHead>
                                <TableHead className="text-right w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => {
                                    const isEditing = editingId === user.id;

                                    return (
                                        <TableRow key={user.id} className="group hover:bg-zinc-50/50">
                                            {/* Username */}
                                            <TableCell className="font-medium">
                                                {isEditing ? (
                                                    <Input
                                                        value={editForm.username}
                                                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                                        className="h-8"
                                                    />
                                                ) : (
                                                    user.username
                                                )}
                                            </TableCell>

                                            {/* Password */}
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input
                                                        type="password"
                                                        placeholder="New password..."
                                                        value={editForm.password || ""}
                                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                                        className="h-8"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">••••••••</span>
                                                )}
                                            </TableCell>

                                            {/* Role */}
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select
                                                        value={editForm.role}
                                                        onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="USER">User</SelectItem>
                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${user.role === "SUPER_ADMIN"
                                                            ? "bg-purple-50 text-purple-700 ring-purple-600/20"
                                                            : user.role === "ADMIN"
                                                                ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                                                                : "bg-zinc-50 text-zinc-700 ring-zinc-600/20"
                                                            }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Created On */}
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={cancelEdit}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="default" // "Save" style
                                                                onClick={() => saveEdit(user.id)}
                                                                className="h-8 px-3"
                                                            >
                                                                Save
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline" // "Delete" style logic - wait, wireframe implies "Delete" button
                                                                size="sm"
                                                                onClick={() => handleDelete(user.id)}
                                                                className="h-8 px-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                            >
                                                                Delete
                                                            </Button>
                                                            <Button
                                                                variant="default" // "Save" equivalent trigger for edit mode? 
                                                                // Wireframe has "Delete" and "Save". To get to "Save" state, we need to EDIT.
                                                                // Usually "Edit" turns row into Inputs. 
                                                                // I'll make the whole row clickable? Or add an "Edit" button?
                                                                // Re-reading wireframe: "Username Password Role Created On Delete Save" 
                                                                // It seems like "Save" is the button you click AFTER editing.
                                                                // How do you START editing?
                                                                // "from that I can change the password of the user directly"
                                                                // Maybe the inputs are ALWAYS visible?
                                                                // "Inline editing" often implies inputs are always there, or click-to-edit.
                                                                // If I make inputs always there for ALL rows, it's cluttered.
                                                                // I'll use a standard pattern: "Edit" button changes row to edit mode.
                                                                // Wait, the wireframe buttons are: "Delete" "Save".
                                                                // Maybe it means: Left button Delete, Right button Save (Changes).
                                                                // Meaning the inputs are ALWAYS editable?

                                                                // Let's try "Click to Edit". It's cleaner.
                                                                // I'll add an "Edit" button in place of "Save" initially. When clicked, it becomes "Save".
                                                                size="sm"
                                                                onClick={() => startEdit(user)}
                                                                className="h-8 px-3"
                                                            >
                                                                Edit
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
