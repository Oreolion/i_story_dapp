import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecordPage from "../app/record/page";

// --- 1. MOCK DEPENDENCIES ---

// Mock the Browser API (getUserMedia) since JSDOM doesn't have a microphone
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  writable: true,
});

// Mock MediaRecorder
global.MediaRecorder = class {
  state = "inactive";
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop();
  }
  //   ondataavailable(e: any) {}
  onstop() {}
  //   constructor(stream: any) {}
} as any;

// Mock Supabase (Data Layer)
vi.mock("../app/utils/supabase/supabaseClient", () => ({
  supabaseClient: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: () => ({
        eq: () => ({
          single: vi.fn(),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: "test/path" }, error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({
            data: { publicUrl: "https://mock-storage.com/audio.webm" },
          }),
      }),
    },
  },
}));

// Mock IPFS (Decentralized Storage)
vi.mock("../app/utils/ipfsService", () => ({
  ipfsService: {
    uploadMetadata: vi.fn().mockResolvedValue({ hash: "QmMockHash123" }),
  },
}));

// Mock Auth (Simulate User Logged In)
vi.mock("../components/AuthProvider", () => ({
  useAuth: () => ({
    id: "test-user-123",
    wallet_address: "0x123...abc",
  }),
}));

// Mock Web3 Provider (Simulate Wallet Connected)
vi.mock("../components/Provider", () => ({
  useApp: () => ({
    isConnected: true,
  }),
}));

// --- 2. TEST SUITE ---

describe("RecordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main recording interface", () => {
    render(<RecordPage />);

    // Check Title
    expect(screen.getByText("Record Your Story")).toBeInTheDocument();

    // Check "Audio Recording" section
    expect(screen.getByText("Audio Recording")).toBeInTheDocument();

    // Check "Entry Title" input exists
    expect(
      screen.getByPlaceholderText("Give your story a title...")
    ).toBeInTheDocument();
  });

  it("shows the microphone button", () => {
    render(<RecordPage />);
    // The button usually contains an SVG, but we can check for the text around it or role
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("handles text input for title and transcription", () => {
    render(<RecordPage />);

    const titleInput = screen.getByPlaceholderText(
      "Give your story a title..."
    );
    const transcriptionArea = screen.getByPlaceholderText(
      /Your transcribed text/i
    );

    fireEvent.change(titleInput, { target: { value: "My Day" } });
    fireEvent.change(transcriptionArea, {
      target: { value: "This is a test entry." },
    });

    expect((titleInput as HTMLInputElement).value).toBe("My Day");
    expect((transcriptionArea as HTMLTextAreaElement).value).toBe(
      "This is a test entry."
    );
  });

  it("shows save button", () => {
    render(<RecordPage />);
    expect(screen.getByText("Save & IPFS")).toBeInTheDocument();
  });
});
