import { z } from "zod";

/**
 * Shape checks for what Gemini returns. They only require the fields the app
 * reads. Anything extra passes through untouched, and numbers that arrive as
 * strings ("650") are converted. If a response fails, askGeminiJSON retries.
 */

const num = z.coerce.number().finite();

export const synthesisSchema = z
    .object({
        humanSummary: z.string().optional(),
    })
    .passthrough();

export const recommendationsSchema = z
    .object({
        recommendations: z.array(
            z
                .object({
                    name: z.string().min(1),
                    score: num,
                    estimatedBudgetPerPerson: num,
                    reasoning: z.string().default(""),
                    pros: z.array(z.string()).default([]),
                    cons: z.array(z.string()).default([]),
                })
                .passthrough()
        ),
    })
    .passthrough();

export const itinerarySchema = z
    .object({
        days: z
            .array(
                z
                    .object({
                        activities: z.array(z.object({ name: z.string().min(1) }).passthrough()),
                    })
                    .passthrough()
            )
            .min(1),
        budget_summary: z
            .object({
                per_person: z.record(z.object({ total: num }).passthrough()).optional(),
                group_total: num.optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

/** Turns a schema into the validate function askGeminiJSON expects. */
export function validator<S extends z.ZodTypeAny>(schema: S) {
    return (raw: unknown): z.infer<S> => schema.parse(raw);
}
