import { describe, expect, it } from "vitest";
import { itinerarySchema, recommendationsSchema, validator } from "./schemas";

describe("itinerarySchema", () => {
    const validate = validator(itinerarySchema);

    it("accepts a normal plan and keeps extra fields", () => {
        const plan = {
            days: [{ day_number: 1, activities: [{ name: "Beach", lat: 1, lng: 2 }] }],
            accommodation: { recommended: "Hilton" },
            budget_summary: { per_person: { Ron: { total: 650 } }, group_total: 2600 },
        };
        const out = validate(plan);
        expect(out.accommodation).toEqual({ recommended: "Hilton" });
        expect(out.days[0].activities[0]).toMatchObject({ name: "Beach", lat: 1 });
    });

    it("converts totals that arrive as strings", () => {
        const out = validate({
            days: [{ activities: [{ name: "Walk" }] }],
            budget_summary: { per_person: { Ron: { total: "650" } } },
        });
        expect(out.budget_summary?.per_person?.Ron.total).toBe(650);
    });

    it("rejects a plan with no days", () => {
        expect(() => validate({ days: [] })).toThrow();
        expect(() => validate({})).toThrow();
    });

    it("rejects an activity with no name", () => {
        expect(() => validate({ days: [{ activities: [{ description: "x" }] }] })).toThrow();
    });

    it("rejects a person whose total is missing", () => {
        expect(() =>
            validate({
                days: [{ activities: [{ name: "Walk" }] }],
                budget_summary: { per_person: { Ron: { food: 10 } } },
            })
        ).toThrow();
    });

    it("accepts a plan with no budget summary", () => {
        expect(() => validate({ days: [{ activities: [{ name: "Walk" }] }] })).not.toThrow();
    });
});

describe("recommendationsSchema", () => {
    const validate = validator(recommendationsSchema);

    it("fills defaults and converts numbers", () => {
        const out = validate({
            recommendations: [{ name: "Austin, TX", score: "88", estimatedBudgetPerPerson: "620" }],
        });
        expect(out.recommendations[0]).toMatchObject({
            name: "Austin, TX",
            score: 88,
            estimatedBudgetPerPerson: 620,
            pros: [],
            cons: [],
            reasoning: "",
        });
    });

    it("rejects a recommendation with no estimated cost", () => {
        expect(() => validate({ recommendations: [{ name: "Austin, TX", score: 80 }] })).toThrow();
    });

    it("allows an empty list", () => {
        expect(validate({ recommendations: [] }).recommendations).toEqual([]);
    });
});
