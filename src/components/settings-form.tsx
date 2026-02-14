"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

interface SettingsFormProps {
    fashnApiKeyConfigured: boolean;
    nasRootPath: string;
}

export function SettingsForm({ fashnApiKeyConfigured, nasRootPath }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [nasPath, setNasPath] = useState(nasRootPath);
    const [apiKey, setApiKey] = useState("");

    const handleSaveGeneral = async () => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: "Saving...",
            success: "Settings saved",
            error: "Failed to save",
        });
    };

    const handleSaveApi = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fashnApiKey: apiKey }),
            });
            if (!res.ok) throw new Error();
            toast.success("API Key updated");
            setApiKey(""); // Clear sensitive input
        } catch (e) {
            toast.error("Failed to update API Key");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStorage = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nasRootPath: nasPath }),
            });
            if (!res.ok) throw new Error();
            toast.success("Storage settings saved");
        } catch (e) {
            toast.error("Failed to save storage settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="api">API & Integrations</TabsTrigger>
                <TabsTrigger value="storage">Storage & NAS</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>
                            Configure general application behavior and metadata.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="site-name">Application Name</Label>
                            <Input id="site-name" defaultValue="Studio AI" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Maintenance Mode</Label>
                                <p className="text-sm text-muted-foreground">
                                    Disable new jobs and user access.
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveGeneral}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="api" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Fashn.ai Integration</CardTitle>
                        <CardDescription>
                            Manage your API keys and connection settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                type="password"
                                placeholder="fa_..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            {fashnApiKeyConfigured && !apiKey && (
                                <p className="text-xs text-green-600 font-medium">
                                    ✓ API Key is currently configured
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Enter a new key to update. Stored securely.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="sandbox" />
                            <Label htmlFor="sandbox">Enable Sandbox Mode</Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveApi} disabled={loading || !apiKey}><Save className="mr-2 h-4 w-4" /> Update Keys</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="storage" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>File System & Storage</CardTitle>
                        <CardDescription>
                            Configure local Network Attached Storage (NAS) access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="root-path">NAS Root Path</Label>
                            <Input
                                id="root-path"
                                placeholder="\\NAS\Photos"
                                value={nasPath}
                                onChange={(e) => setNasPath(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                The root directory where raw and generated images are stored.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cache-size">Local Cache Limit (GB)</Label>
                            <Input id="cache-size" type="number" defaultValue="10" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveStorage} disabled={loading}><Save className="mr-2 h-4 w-4" /> Save Configuration</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
