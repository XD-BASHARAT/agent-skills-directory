import { z } from "zod"

export const skillSubmissionSchema = z.object({
  repoUrl: z.string().url().refine((url) => {
    try {
      const parsed = new URL(url)
      return parsed.hostname === "github.com"
    } catch {
      return false
    }
  }, "Must be a valid GitHub URL"),
  skillPath: z.string().optional(),
  submittedBy: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
})

export type SkillSubmission = z.infer<typeof skillSubmissionSchema>

export const skillUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  isVerifiedOrg: z.boolean().optional(),
})

export type SkillUpdate = z.infer<typeof skillUpdateSchema>
