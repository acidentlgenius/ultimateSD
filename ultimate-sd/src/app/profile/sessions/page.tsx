import { auth } from "@/auth";
import { SessionDashboardClient } from "@/components/profile/SessionDashboardClient";

export const metadata = {
    title: "Offline Sessions | Ultimate SD",
    description: "Manage your local browser offline practice sessions.",
};

export default async function OfflineSessionsPage() {
    const session = await auth();

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <SessionDashboardClient isLoggedIn={!!session?.user} />
        </div>
    );
}
