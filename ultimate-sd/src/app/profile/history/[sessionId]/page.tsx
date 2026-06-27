import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getSessionDetail } from "@/app/actions/progress";
import { SessionPhaseReview } from "@/components/profile/SessionPhaseReview";

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const detail = await getSessionDetail(sessionId);
    return {
        title: detail
            ? `${detail.problemTitle} · Session Review | Ultimate SD`
            : "Session Review | Ultimate SD",
    };
}

export default async function SessionDetailPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const authSession = await auth();
    if (!authSession?.user?.id) {
        redirect("/login");
    }

    const { sessionId } = await params;
    const detail = await getSessionDetail(sessionId);
    if (!detail) {
        notFound();
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <SessionPhaseReview session={detail} />
        </div>
    );
}
