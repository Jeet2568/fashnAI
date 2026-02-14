import { redirect } from "next/navigation";

export default function StudioPage() {
    // Redirect to the Composer UI
    redirect("/studio/product-to-model");
}
