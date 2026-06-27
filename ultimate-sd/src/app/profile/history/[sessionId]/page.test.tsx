// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionDetailPage from "./page";
import { auth } from "@/auth";
import { getSessionDetail } from "@/app/actions/progress";

vi.mock("@/auth", () => ({
    auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/app/actions/progress", () => ({
    getSessionDetail: vi.fn(),
}));

vi.mock("@/components/profile/SessionPhaseReview", () => ({
    SessionPhaseReview: ({ session }: { session: { problemTitle: string } }) => (
        <div data-testid="session-phase-review">
            <h1>{session.problemTitle}</h1>
        </div>
    ),
}));

const mockSessionDetail = {
    id: "session-1",
    problemTitle: "Design TinyURL",
    problemSlug: "tinyurl",
    status: "COMPLETED" as const,
    startedAt: new Date("2026-06-01"),
    completedAt: new Date("2026-06-01"),
    finalScore: 85,
    attemptNumber: 1,
    phases: [],
};

describe("SessionDetailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders problem title when authenticated and session exists", async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
        vi.mocked(getSessionDetail).mockResolvedValue(mockSessionDetail);

        const Component = await SessionDetailPage({
            params: Promise.resolve({ sessionId: "session-1" }),
        });
        const html = renderToStaticMarkup(Component);

        expect(getSessionDetail).toHaveBeenCalledWith("session-1");
        expect(html).toContain("Design TinyURL");
        expect(html).toContain("session-phase-review");
    });

    it("redirects to login when unauthenticated", async () => {
        vi.mocked(auth).mockResolvedValue(null);

        await expect(
            SessionDetailPage({ params: Promise.resolve({ sessionId: "session-1" }) })
        ).rejects.toThrow("NEXT_REDIRECT");
    });

    it("calls notFound when session is missing", async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
        vi.mocked(getSessionDetail).mockResolvedValue(null);

        await expect(
            SessionDetailPage({ params: Promise.resolve({ sessionId: "missing" }) })
        ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    });
});
