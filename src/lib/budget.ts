/**
 * Budget rules that run in code, not in the prompt. Kept free of any
 * framework or database imports so they can be unit tested.
 */

export interface MemberBudget {
    name: string;
    budget: number;
}

export interface BudgetWarning {
    user: string;
    budget: number;
    estimated_total: number;
    over_by: number;
    suggestion: unknown;
}

interface PersonSummary {
    total: number;
    savings_tips?: unknown;
}

interface ItineraryLike {
    budget_summary?: {
        per_person?: Record<string, PersonSummary>;
    } | null;
}

/** The member with the smallest budget, or null if nobody has one. */
export function lowestBudgetMember(members: MemberBudget[]): MemberBudget | null {
    if (members.length === 0) return null;
    return members.reduce((min, m) => (m.budget < min.budget ? m : min));
}

/** Keep only destinations the tightest budget can afford. */
export function filterAffordable<T extends { estimatedBudgetPerPerson: number }>(
    recommendations: T[],
    lowestBudget: number
): T[] {
    return recommendations.filter((r) => r.estimatedBudgetPerPerson <= lowestBudget);
}

/**
 * Compare each member's estimated total with their own stated budget.
 * Names are matched exactly first, then ignoring case, because the model
 * sometimes changes the capitalisation of a name.
 */
export function findOverages(
    itinerary: ItineraryLike | null | undefined,
    members: MemberBudget[]
): BudgetWarning[] {
    const perPerson = itinerary?.budget_summary?.per_person;
    if (!perPerson) return [];

    const warnings: BudgetWarning[] = [];
    for (const member of members) {
        let summary = perPerson[member.name];
        if (!summary) {
            const key = Object.keys(perPerson).find(
                (k) => k.toLowerCase() === member.name.toLowerCase()
            );
            if (key) summary = perPerson[key];
        }
        if (!summary) continue;

        if (summary.total > member.budget) {
            const overBy = summary.total - member.budget;
            warnings.push({
                user: member.name,
                budget: member.budget,
                estimated_total: summary.total,
                over_by: overBy,
                suggestion:
                    summary.savings_tips ||
                    `${member.name} could save ~$${overBy} by choosing budget-friendly options for accommodation and meals.`,
            });
        }
    }
    return warnings;
}

/** Total dollars over budget across all members. Lower is better. */
export function totalOverage(warnings: BudgetWarning[]): number {
    return warnings.reduce((sum, w) => sum + w.over_by, 0);
}

/** A short instruction to send back to the model when a plan went over budget. */
export function overageFeedback(warnings: BudgetWarning[]): string {
    const lines = warnings.map(
        (w) =>
            `- ${w.user}: your plan estimates $${w.estimated_total} but their budget is $${w.budget} ($${w.over_by} over)`
    );
    return `\n\nYour previous plan went over budget for some members:\n${lines.join(
        "\n"
    )}\nRevise the plan so each of these members stays at or below their budget. Use cheaper lodging, free activities or cheaper meals for them. Keep the same names and the same JSON format.`;
}
