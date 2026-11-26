import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: class {
        getGenerativeModel() {
            return { generateContent };
        }
    },
}));

import { askGeminiJSON } from "./gemini";
import { itinerarySchema, validator } from "./schemas";

const reply = (text: string) => ({ response: { text: () => text } });
const goodPlan = JSON.stringify({ days: [{ activities: [{ name: "Walk" }] }] });

describe("askGeminiJSON", () => {
    beforeEach(() => {
        generateContent.mockReset();
        vi.useFakeTimers();
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("retries when the JSON does not parse", async () => {
        generateContent.mockResolvedValueOnce(reply("not json")).mockResolvedValueOnce(reply(goodPlan));
        const promise = askGeminiJSON("sys", "user");
        await vi.advanceTimersByTimeAsync(5000);
        await expect(promise).resolves.toMatchObject({ days: expect.any(Array) });
        expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it("retries when the JSON parses but fails validation", async () => {
        generateContent
            .mockResolvedValueOnce(reply(JSON.stringify({ days: [] })))
            .mockResolvedValueOnce(reply(goodPlan));
        const promise = askGeminiJSON("sys", "user", 2, false, validator(itinerarySchema));
        await vi.advanceTimersByTimeAsync(5000);
        await expect(promise).resolves.toMatchObject({ days: expect.any(Array) });
        expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it("gives up with a clear error after the retries are used", async () => {
        generateContent.mockResolvedValue(reply(JSON.stringify({ days: [] })));
        const promise = askGeminiJSON("sys", "user", 1, false, validator(itinerarySchema));
        const assertion = expect(promise).rejects.toThrow(/Gemini failed after 2 attempts/);
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
        expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it("strips markdown fences before parsing", async () => {
        generateContent.mockResolvedValueOnce(reply("```json\n" + goodPlan + "\n```"));
        await expect(askGeminiJSON("sys", "user")).resolves.toMatchObject({ days: expect.any(Array) });
    });
});
