import { z } from "zod";

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const RootSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const SkillSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  codeHash: RootSchema,
  permissions: z.array(z.string())
});

export const ManifestSchema = z.object({
  schema: z.literal("poi/v0.1"),
  name: z.string().min(1),
  description: z.string().min(1),
  inft: z.object({
    chainId: z.number().int().positive(),
    contract: AddressSchema,
    tokenId: z.string().min(1),
    standard: z.string().min(1)
  }),
  identity: z.object({
    owner: AddressSchema,
    ens: z.string().optional()
  }),
  storage: z.object({
    manifestRoot: RootSchema,
    intelligenceBundleRoot: RootSchema,
    memoryRoot: RootSchema,
    latestRunRoot: RootSchema
  }),
  compute: z.object({
    provider: z.string().min(1),
    models: z.array(z.string().min(1)),
    latestRunIds: z.array(z.string().min(1))
  }),
  skills: z.array(SkillSchema).min(1),
  memory: z.object({
    type: z.string().min(1),
    checkpointRoot: RootSchema,
    historyRoot: RootSchema
  }),
  proof: z.object({
    status: z.string().min(1),
    certificateId: z.string().optional(),
    issuedAt: z.string().optional()
  }),
  permissions: z.object({
    publicProfile: z.boolean(),
    ownerCanDecrypt: z.boolean(),
    allowedActions: z.array(z.string())
  })
});

export const IntelligenceBundleSchema = z.object({
  schema: z.literal("poi-intelligence/v0.1"),
  agent: z.string(),
  encrypted: z.boolean(),
  algorithm: z.string(),
  ciphertext: z.string(),
  iv: z.string(),
  authTag: z.string(),
  publicSummary: z.object({
    agent: z.string().optional(),
    goals: z.array(z.string()),
    behaviorPolicy: z.string(),
    toolPermissions: z.array(z.string()),
    skills: z.array(z.string()),
    capabilities: z.array(z.string()).optional(),
    storage: z.string().optional(),
    compute: z.string().optional(),
    version: z.string()
  })
});

export const MemoryStateSchema = z.object({
  schema: z.literal("poi-memory/v0.1"),
  agent: z.string(),
  checkpoint: z.object({
    runCount: z.number().int().nonnegative(),
    lastFinding: z.string(),
    stateRoot: RootSchema
  }),
  history: z.array(
    z.object({
      runId: z.string(),
      version: z.number().int().positive().optional(),
      summary: z.string(),
      learnedPattern: z.string().optional(),
      memoryDelta: z.string().optional(),
      at: z.string().optional(),
      source: z.enum(["live", "hybrid", "mock"]).optional(),
      root: RootSchema
    })
  )
});

export const RunTraceSchema = z.object({
  schema: z.literal("poi-run/v0.1"),
  runId: z.string(),
  agent: z.string(),
  source: z.enum(["live", "hybrid", "mock"]),
  task: z.string(),
  events: z.array(
    z.object({
      type: z.string(),
      at: z.string(),
      detail: z.record(z.unknown()),
      root: RootSchema.optional()
    })
  ),
  result: z.object({
    issue: z.string(),
    patch: z.string(),
    critique: z.string(),
    accepted: z.boolean(),
    memoryRoot: RootSchema.optional(),
    policyUpgrade: z.unknown().optional()
  })
});

export const ComputeRunsSchema = z.object({
  schema: z.literal("poi-compute-runs/v0.1"),
  provider: z.string(),
  model: z.string(),
  runs: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["analysis", "critic"]),
      promptHash: RootSchema,
      outputHash: RootSchema,
      at: z.string(),
      source: z.enum(["live", "hybrid", "mock"])
    })
  )
});

export const CertificateSchema = z.object({
  schema: z.literal("poi-certificate/v0.1"),
  certificateId: z.string(),
  agent: z.string(),
  tier: z.number().int().min(0).max(6),
  issuedAt: z.string(),
  issuer: z.string(),
  evidence: z.object({
    inft: z.object({
      chainId: z.number().int().positive(),
      contract: AddressSchema,
      tokenId: z.string()
    }),
    intelligenceBundleRoot: RootSchema,
    memoryRoot: RootSchema,
    latestRunRoot: RootSchema,
    computeRunIds: z.array(z.string())
  })
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type IntelligenceBundle = z.infer<typeof IntelligenceBundleSchema>;
export type MemoryState = z.infer<typeof MemoryStateSchema>;
export type RunTrace = z.infer<typeof RunTraceSchema>;
export type ComputeRuns = z.infer<typeof ComputeRunsSchema>;
export type Certificate = z.infer<typeof CertificateSchema>;

export function verifyManifest(value: unknown): Manifest {
  return ManifestSchema.parse(value);
}
