import { describe, expect, it } from "vitest";
import {
    filterAffordable,
    findOverages,
    lowestBudgetMember,
    overageFeedback,
    totalOverage,
} from "./budget";

const plan = (perPerson: Record<string, { total: number; savings_tips?: string }>) => ({
    budget_summary: { per_person: perPerson },
});

describe("lowestBudgetMember", () => {
    it("returns the member with the smallest budget", () => {
        const m = lowestBudgetMember([
            { name: "Tom", budget: 2500 },
            { name: "Mike", budget: 450 },
            { name: "Ron", budget: 500 },
        ]);
        expect(m).toEqual({ name: "Mike", budget: 450 });
    });

    it("returns null when nobody has a budget", () => {
        expect(lowestBudgetMember([])).toBeNull();
    });
});

describe("filterAffordable", () => {
    const recs = [
        { name: "A", estimatedBudgetPerPerson: 400 },
        { name: "B", estimatedBudgetPerPerson: 450 },
        { name: "C", estimatedBudgetPerPerson: 451 },
    ];

    it("keeps destinations at or under the lowest budget", () => {
        expect(filterAffordable(recs, 450).map((r) => r.name)).toEqual(["A", "B"]);
    });

    it("returns nothing when every destination is too expensive", () => {
        expect(filterAffordable(recs, 100)).toEqual([]);
    });
});

describe("findOverages", () => {
    it("flags only members whose estimate is above their own budget", () => {
        const warnings = findOverages(
            plan({ Ron: { total: 600 }, Jon: { total: 700 } }),
            [
                { name: "Ron", budget: 500 },
                { name: "Jon", budget: 800 },
            ]
        );
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatchObject({ user: "Ron", budget: 500, estimated_total: 600, over_by: 100 });
    });

    it("does not flag a plan that is exactly on budget", () => {
        expect(findOverages(plan({ Ron: { total: 500 } }), [{ name: "Ron", budget: 500 }])).toEqual([]);
    });

    it("matches names ignoring case", () => {
        const warnings = findOverages(plan({ ron: { total: 600 } }), [{ name: "Ron", budget: 500 }]);
        expect(warnings).toHaveLength(1);
    });

    it("skips members missing from the plan", () => {
        expect(findOverages(plan({ Jon: { total: 900 } }), [{ name: "Ron", budget: 500 }])).toEqual([]);
    });

    it("uses the model's savings tips when present, else a default suggestion", () => {
        const withTips = findOverages(plan({ Ron: { total: 600, savings_tips: "Stay in a hostel" } }), [
            { name: "Ron", budget: 500 },
        ]);
        expect(withTips[0].suggestion).toBe("Stay in a hostel");

        const without = findOverages(plan({ Ron: { total: 600 } }), [{ name: "Ron", budget: 500 }]);
        expect(String(without[0].suggestion)).toContain("Ron could save ~$100");
    });

    it("returns nothing when the plan has no budget summary", () => {
        expect(findOverages({}, [{ name: "Ron", budget: 500 }])).toEqual([]);
        expect(findOverages(null, [{ name: "Ron", budget: 500 }])).toEqual([]);
    });
});

describe("totalOverage and overageFeedback", () => {
    const warnings = findOverages(
        plan({ Ron: { total: 600 }, Jon: { total: 950 } }),
        [
            { name: "Ron", budget: 500 },
            { name: "Jon", budget: 800 },
        ]
    );

    it("adds up the dollars over budget", () => {
        expect(totalOverage(warnings)).toBe(250);
        expect(totalOverage([])).toBe(0);
    });

    it("names each member and amount in the feedback", () => {
        const text = overageFeedback(warnings);
        expect(text).toContain("Ron");
        expect(text).toContain("$100 over");
        expect(text).toContain("Jon");
        expect(text).toContain("$150 over");
    });
});
