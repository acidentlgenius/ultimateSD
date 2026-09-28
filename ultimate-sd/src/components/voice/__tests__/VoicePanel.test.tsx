import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import VoicePanel from "../VoicePanel";
import * as fetchUtils from "@/lib/fetchUtils";

// Mock matchMedia to prevent jsdom crash
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock user media
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable = null;
  onstop = null;
  start = vi.fn();
  stop = vi.fn(function (this: any) {
    if (this.onstop) this.onstop();
  });
}
(window as any).MediaRecorder = MockMediaRecorder;

vi.mock("@/lib/fetchUtils", async () => {
  const actual = await vi.importActual("@/lib/fetchUtils");
  return {
    ...actual,
    fetchWithRetry: vi.fn(),
  };
});

describe("VoicePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles start session network failure gracefully", async () => {
    vi.mocked(fetchUtils.fetchWithRetry).mockRejectedValueOnce(
      new Error("fetchWithRetry: Exceeded retries"),
    );

    render(<VoicePanel slug="test-problem" problemTitle="Test Problem" />);

    fireEvent.click(screen.getByTestId("voice-start"));

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(
        "fetchWithRetry: Exceeded retries",
      );
    });
  });

  it("handles reply network failure gracefully", async () => {
    // Start session mock
    vi.mocked(fetchUtils.fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: "test-session", question: "Hello?" }),
    } as any);

    // Speak mock
    vi.mocked(fetchUtils.fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(),
    } as any);

    // Fake audio
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    (window as any).Audio = class {
      play = mockPlay;
      onended: any = null;
      onerror: any = null;
      constructor() {
        setTimeout(() => {
          if (this.onended) this.onended();
        }, 0);
      }
    };
    (window as any).URL.createObjectURL = vi.fn();

    render(<VoicePanel slug="test-problem" problemTitle="Test Problem" />);
    fireEvent.click(screen.getByTestId("voice-start"));

    // Wait for the session to start and idle phase
    await waitFor(() => {
      expect(screen.getByTestId("voice-status")).toHaveTextContent(
        "Hold the button and speak",
      );
    });

    // Press and hold
    const talkBtn = screen.getByTestId("voice-talk");
    fireEvent.pointerDown(talkBtn);

    await waitFor(() => {
      expect(screen.getByTestId("voice-status")).toHaveTextContent(
        "Listening… release to send",
      );
    });

    // Transcribe mock (success)
    vi.mocked(fetchUtils.fetchWithRetry).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transcript: "Hi there" }),
    } as any);

    // Reply mock (fails)
    vi.mocked(fetchUtils.fetchWithRetry).mockRejectedValueOnce(
      new Error("Network disconnected"),
    );

    // Release to send
    fireEvent.pointerUp(talkBtn);

    await waitFor(() => {
      expect(screen.getByTestId("voice-error")).toHaveTextContent(
        "Network disconnected",
      );
    });
  });
});
