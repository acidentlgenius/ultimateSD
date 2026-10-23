import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StepFeedbackPanel from "../StepFeedbackPanel";
import { updateStreak } from "@/app/actions/gamification";

vi.mock("@/app/actions/gamification", () => ({
  updateStreak: vi.fn(),
}));

vi.mock("@/components/LockedFeatureButton", () => ({
  LockedFeatureButton: ({ label }: { label: string }) => (
    <button type="button">{label}</button>
  ),
}));

const baseFeedback = {
  score: 1,
  accuracy: 10,
  strengths: ["Named shorten"],
  weaknesses: ["Too thin"],
  missed: ["Redirect"],
  isAcceptable: false,
};

describe("StepFeedbackPanel Streak Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles server action errors from updateStreak", async () => {
    const errorLogSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(updateStreak).mockResolvedValue({
      error: "Streak update failed",
    } as any);

    await act(async () => {
      render(
        <StepFeedbackPanel
          feedback={{ ...baseFeedback, isAcceptable: true }}
          probeEntitled={false}
          onStartProbe={() => {}}
        />,
      );
    });

    expect(updateStreak).toHaveBeenCalled();
    expect(errorLogSpy).toHaveBeenCalledWith(
      "Error updating streak:",
      "Streak update failed",
    );
    errorLogSpy.mockRestore();
  });

  it("handles network errors from updateStreak", async () => {
    const errorLogSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const networkError = new Error("Network error");
    vi.mocked(updateStreak).mockRejectedValue(networkError);

    await act(async () => {
      render(
        <StepFeedbackPanel
          feedback={{ ...baseFeedback, isAcceptable: true }}
          probeEntitled={false}
          onStartProbe={() => {}}
        />,
      );
    });

    expect(updateStreak).toHaveBeenCalled();
    expect(errorLogSpy).toHaveBeenCalledWith(
      "Error updating streak:",
      networkError,
    );
    errorLogSpy.mockRestore();
  });
});
