import { getCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus } from "lucide-react";
import { createAdmin, deleteUser } from "./actions";

export default async function SuperAdminPage() {
    const user = await getCurrentUser();
    if (user.role !== "SUPER_ADMIN") redirect("/");

    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "desc" }
    });

    const totalJobs = await prisma.job.count();
    const totalUsers = await prisma.user.count();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-red-500">SUPER ADMIN CONSOLE</h1>
                    <p className="text-zinc-500">Restricted Access • Clearance Level 5</p>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="text-red-400 border-red-900">
                        {user.username}
                    </Badge>
                </div>
            </header>

            <Tabs defaultValue="admins" className="space-y-6">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="admins">Admin Management</TabsTrigger>
                    <TabsTrigger value="analytics">Global Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="admins">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Administrators</CardTitle>
                            <form action={createAdmin}>
                                <Button size="sm" variant="destructive">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Spawn Admin
                                </Button>
                            </form>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {admins.map(admin => (
                                    <div key={admin.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                                {admin.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{admin.username}</p>
                                                <p className="text-xs text-zinc-500">Credits: {admin.credits}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <form action={deleteUser.bind(null, admin.id)}>
                                                <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                                {admins.length === 0 && (
                                    <p className="text-center text-zinc-500 py-8">No Admin agents found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="grid grid-cols-3 gap-6">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-400 text-sm">Total Accounts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-mono font-bold">{totalUsers}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-400 text-sm">Total Jobs Processed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-mono font-bold text-green-500">{totalJobs}</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
