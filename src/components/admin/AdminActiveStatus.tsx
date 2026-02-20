import { Card, CardContent } from "@/components/ui/card";

export function AdminActiveStatus() {
    return (
        <div className="grid gap-4">
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Users Active</div>
                    <div className="text-xl font-bold">3 / 6</div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Today Processed</div>
                    <div className="text-xl font-bold">142</div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">Today Failed</div>
                    <div className="text-xl font-bold text-red-600">2</div>
                </CardContent>
            </Card>
        </div>
    );
}
