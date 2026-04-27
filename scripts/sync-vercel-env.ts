import {
  loadLocalEnv,
  readJson,
  writeSafeJson,
  zeroGEnv,
} from "./live-helpers";

loadLocalEnv();

const deployment =
  readJson<Record<string, string>>("deployments/0g-galileo.json") ?? {};
const vercelDeployment =
  readJson<{ url?: string }>("deployments/vercel.json") ?? {};
const publicEnv = {
  NEXT_PUBLIC_APP_NAME:
    process.env.NEXT_PUBLIC_APP_NAME ?? "Proof-of-Intelligence Explorer",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    vercelDeployment.url ??
    "https://proof-of-intelligence-explorer.vercel.app",
  NEXT_PUBLIC_POI_PUBLIC_MODE:
    process.env.NEXT_PUBLIC_POI_PUBLIC_MODE ?? "hybrid",
  NEXT_PUBLIC_0G_CHAIN_ID:
    process.env.NEXT_PUBLIC_0G_CHAIN_ID ?? zeroGEnv("CHAIN_ID") ?? "16602",
  NEXT_PUBLIC_0G_RPC_URL:
    process.env.NEXT_PUBLIC_0G_RPC_URL ??
    zeroGEnv("RPC_URL") ??
    "https://evmrpc-testnet.0g.ai",
  NEXT_PUBLIC_POI_REGISTRY_ADDRESS:
    process.env.NEXT_PUBLIC_POI_REGISTRY_ADDRESS ??
    deployment.registryAddress ??
    "",
  NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS:
    process.env.NEXT_PUBLIC_POI_DEMO_INFT_ADDRESS ??
    deployment.demoInftAddress ??
    "",
  NEXT_PUBLIC_POI_DEMO_OWNER:
    process.env.NEXT_PUBLIC_POI_DEMO_OWNER ?? deployment.deployer ?? "",
  NEXT_PUBLIC_CODEGUARDIAN_INFT_ID:
    process.env.NEXT_PUBLIC_CODEGUARDIAN_INFT_ID ??
    deployment.codeguardianTokenId ??
    "",
  NEXT_PUBLIC_FAKEAGENT_INFT_ID:
    process.env.NEXT_PUBLIC_FAKEAGENT_INFT_ID ??
    deployment.fakeagentTokenId ??
    "",
  NEXT_PUBLIC_POI_PASSPORT_ID:
    process.env.NEXT_PUBLIC_POI_PASSPORT_ID ??
    deployment.codeguardianPassportId ??
    "",
  NEXT_PUBLIC_POI_CERTIFICATE_ID:
    process.env.NEXT_PUBLIC_POI_CERTIFICATE_ID ??
    deployment.codeguardianCertificateId ??
    "",
};

const serverOnlyEnvNames = [
  "POI_ADMIN_TOKEN",
  "0G_PRIVATE_KEY",
  "ZERO_G_PRIVATE_KEY",
  "0G_WALLET_ADDRESS",
  "ZERO_G_WALLET_ADDRESS",
  "0G_RPC_URL",
  "ZERO_G_RPC_URL",
  "0G_STORAGE_INDEXER_RPC",
  "ZERO_G_STORAGE_INDEXER_RPC",
  "0G_COMPUTE_BEARER_TOKEN",
  "ZERO_G_COMPUTE_BEARER_TOKEN",
  "0G_COMPUTE_PROVIDER",
  "ZERO_G_COMPUTE_PROVIDER",
  "0G_COMPUTE_MODEL",
  "ZERO_G_COMPUTE_MODEL",
  "0G_COMPUTE_SERVICE_URL",
  "ZERO_G_COMPUTE_SERVICE_URL",
  "POI_DEMO_ENCRYPTION_KEY",
];

writeSafeJson("deployments/vercel-env-plan.json", {
  project: "proof-of-intelligence-explorer",
  publicEnv,
  serverOnlyEnvNames,
  commands: [
    "vercel link --project proof-of-intelligence-explorer",
    "vercel env add NEXT_PUBLIC_APP_NAME production",
    "vercel env add POI_ADMIN_TOKEN production --sensitive",
    "pnpm dlx vercel@52.0.0 --prod",
  ],
  note: "This plan intentionally records public values and server-only env names only. It does not record secret values or whether local secrets are configured.",
});

console.log("wrote deployments/vercel-env-plan.json");
