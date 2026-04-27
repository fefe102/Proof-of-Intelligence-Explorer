# API

Public APIs are read-only and never return server secrets.

```text
GET /api/health
GET /api/verify?agent=codeguardian
GET /api/verify?agent=fakeagent
GET /api/verify?chainId=16602&contract=0x...&tokenId=1
GET /api/passport/16602/0x.../1
GET /api/run/codeguardian-run-001
GET /api/certificate/poi-cert-codeguardian-001
GET /badge/16602/0x.../1.svg
```

`/api/verify` returns the full verification report. `/api/passport` returns a normalized Passport plus the report. The badge route returns a cacheable SVG label: Tier 6, Partial, Failed, or Unknown.
