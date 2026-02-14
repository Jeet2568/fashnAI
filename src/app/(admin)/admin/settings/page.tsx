import { Separator } from "@/components/ui/separator";
import { SettingsForm } from "@/components/settings-form";
import { getSetting, SETTINGS_KEYS } from "@/lib/settings";

export default async function AdminSettingsPage() {
    const fashnApiKey = await getSetting(SETTINGS_KEYS.FASHN_API_KEY);
    const nasRootPath = await getSetting(SETTINGS_KEYS.NAS_ROOT_PATH);

    // We pass a boolean for API key existence to avoid exposing it if we wanted to be extra safe,
    // but SettingsForm expects to manage it. 
    // Actually SettingsForm logic: defaultValue={fashnApiKeyConfigured ? "••••••••••••••••" : ""}
    // So we can pass the existence check or the value if we want to allow editing. 
    // The current form logic uses `fashnApiKeyConfigured` to show a mask.
    const fashnApiKeyConfigured = !!fashnApiKey || !!process.env.FASHN_API_KEY;

    // Prefer DB value, fallback to Env, fallback to empty
    const effectiveNasPath = nasRootPath || process.env.NAS_ROOT_PATH || "";

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-3xl font-bold tracking-tight">Settings</h3>
                <p className="text-muted-foreground">
                    Manage your application configurations and preferences.
                </p>
            </div>
            <Separator />
            <SettingsForm fashnApiKeyConfigured={fashnApiKeyConfigured} nasRootPath={effectiveNasPath} />
        </div>
    );
}
