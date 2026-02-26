"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Trash2, Send, Megaphone, Save, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
    id: string;
    username: string;
}

interface Notification {
    id: string;
    userId: string;
    user: { username: string };
    message: string;
    status: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Compose State
    const [selectedUser, setSelectedUser] = useState<string>(""); // User ID
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Marquee State
    const [marqueeMessages, setMarqueeMessages] = useState<string[]>([]);
    const [isSavingMarquee, setIsSavingMarquee] = useState(false);
    const [newMarqueeText, setNewMarqueeText] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, notifRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/notifications")
            ]);

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }
            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setNotifications(notifData);
            }

            const settingsRes = await fetch("/api/settings");
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.marquee_messages) {
                    setMarqueeMessages(settingsData.marquee_messages);
                } else if (settingsData.marquee_text) {
                    setMarqueeMessages([settingsData.marquee_text]);
                }
            }
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        console.log("Sending check - User:", selectedUser, "Message:", message);
        if (!selectedUser || !message.trim()) {
            toast.error("Please select a user and enter a message");
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser, message }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to send");
            }

            toast.success("Notification sent");
            setMessage("");
            // Refresh list
            const notifRes = await fetch("/api/admin/notifications");
            if (notifRes.ok) setNotifications(await notifRes.json());

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send notification");
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Are you sure you want to delete ALL notifications?")) return;

        try {
            const res = await fetch("/api/admin/notifications?all=true", {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("All notifications deleted");
            setNotifications([]);
        } catch (error) {
            toast.error("Failed to delete notifications");
        }
    };

    const handleDeleteDraft = () => {
        setSelectedUser("");
        setMessage("");
        toast.info("Draft cleared");
    }

    const handleSaveMarquee = async (updatedMessages: string[]) => {
        setIsSavingMarquee(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ globalMarquee: JSON.stringify(updatedMessages) }),
            });

            if (!res.ok) throw new Error("Failed to save marquee");
            setMarqueeMessages(updatedMessages);
            toast.success("Marquee list updated");
        } catch (error) {
            toast.error("Failed to update marquee");
        } finally {
            setIsSavingMarquee(false);
        }
    };

    const addMarqueeMessage = () => {
        if (!newMarqueeText.trim()) return;
        handleSaveMarquee([...marqueeMessages, newMarqueeText.trim()]);
        setNewMarqueeText("");
    };

    const removeMarqueeMessage = (index: number) => {
        const updated = marqueeMessages.filter((_, i) => i !== index);
        handleSaveMarquee(updated);
    };

    return (
        <div className="space-y-6 h-full flex flex-col p-6 bg-zinc-50/50">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Communications</h2>
                    <p className="text-muted-foreground">
                        Manage global marquee and individual user notifications.
                    </p>
                </div>
            </div>

            {/* Marquee Section */}
            <div className="rounded-xl border border-indigo-100 bg-white shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Megaphone className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Global Marquee Messages</h3>
                            <p className="text-xs text-muted-foreground font-medium">Add or remove messages scrolling on user dashboards</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Add a new scrolling message..."
                        className="flex-1 border-indigo-50 focus-visible:ring-indigo-500"
                        value={newMarqueeText}
                        onChange={(e) => setNewMarqueeText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addMarqueeMessage()}
                    />
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2 shrink-0"
                        onClick={addMarqueeMessage}
                        disabled={isSavingMarquee || !newMarqueeText.trim()}
                    >
                        {isSavingMarquee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add Message
                    </Button>
                </div>

                <div className="space-y-2">
                    {marqueeMessages.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground bg-zinc-50 rounded-lg border border-dashed">
                            No active marquee messages.
                        </div>
                    ) : (
                        marqueeMessages.map((msg, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-lg group">
                                <span className="text-sm font-medium text-indigo-900">{msg}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-indigo-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeMarqueeMessage(idx)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Compose Section */}
            <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        Send Direct Notification
                    </h3>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select User" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="font-bold text-indigo-600">All Users (Broadcast)</SelectItem>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleDeleteDraft} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button onClick={handleSend} disabled={isSending} className="gap-2">
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send
                        </Button>
                    </div>
                </div>

                <Textarea
                    placeholder="Message Box: This is message to user"
                    className="min-h-[100px] resize-none text-base p-4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </div>

            {/* History Section */}
            <div className="rounded-xl border bg-white shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b bg-zinc-50/50">
                    <h3 className="font-semibold text-lg">Past Notifications</h3>
                    <Button variant="ghost" size="sm" onClick={handleDeleteAll} className="text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            No past notifications.
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-zinc-50 transition-colors">
                                <div className="flex-1">
                                    <span className="font-semibold text-indigo-600 mr-2">{notif.user.username}:</span>
                                    <span className="text-foreground">{notif.message}</span>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="shrink-0 ml-4">
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                        {notif.status === "SENT" ? "Sent / Unread" : "Read Receipt"}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
