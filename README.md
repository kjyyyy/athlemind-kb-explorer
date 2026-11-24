# AthleMind KB Explorer

Public Next.js app: evidence chat + citation / topic knowledge graph. Server routes proxy to the throttled API Gateway entry for `kb-api`.

## Setup

```bash
npm install
cp .env.example .env.local
# set KB_API_URL (terraform output kb_public_api_url) and KB_API_TOKEN
npm run dev
```

## Deploy (Vercel)

```bash
vercel login
vercel link
vercel env add KB_API_URL production
vercel env add KB_API_TOKEN production
vercel --prod
```

## Backend prerequisites

1. `terraform apply` in `athlemind-kb/infra/kb/envs/dev` (module `api_gateway`, refreshed AWS SSO).
2. CodeBuild `athlemind-kb-dev-api-image` + ECS roll after kb-api changes.
3. Run migration `0014_kb_triples` before using **Entities** graph mode.
4. Optional: Lambda `{"action":"extract_triples","cost_check":true,"limit":50}` then set `triples_enabled=true` for inserts.