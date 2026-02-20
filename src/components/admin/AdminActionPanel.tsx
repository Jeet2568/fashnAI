import { Button } from "@/components/ui/button";
import { Settings, Users } from "lucide-react";
import Link from "next/link";

export function AdminActionPanel() {
    return (
        <div className="flex flex-col gap-4">
            <Link href="/admin/settings">
                <Button variant="outline" className="w-full h-16 justify-start text-lg bg-card hover:bg-accent border-2">
                    <Settings className="mr-3 h-6 w-6" />
                    Manage API
                </Button>
            </Link>
            <Link href="/admin/users">
                <Button variant="outline" className="w-full h-16 justify-start text-lg bg-card hover:bg-accent border-2">
                    <Users className="mr-3 h-6 w-6" />
                    Manage Users
                </Button>
            </Link>
        </div>
    );
}
