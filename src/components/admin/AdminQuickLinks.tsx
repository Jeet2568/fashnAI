import { Button } from "@/components/ui/button";
import { UserCircle, Shirt } from "lucide-react";
import Link from "next/link";

export function AdminQuickLinks() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/clients">
                <Button variant="secondary" className="w-full h-12 text-md">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Client List
                </Button>
            </Link>
            <Link href="/admin/products">
                <Button variant="secondary" className="w-full h-12 text-md">
                    <Shirt className="mr-2 h-5 w-5" />
                    Product List
                </Button>
            </Link>
        </div>
    );
}
