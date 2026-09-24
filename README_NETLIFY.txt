TNO — NETLIFY CONNECTED V6
==========================
Public site: TNO_SITE/
Admin: TNO_SITE/admin/
Backend: netlify/functions/api.mjs
Storage: Netlify Blobs (tno-data)
Seed data: netlify/seed/*.json

Required Netlify environment variables:
ADMIN_EMAIL
ADMIN_PASSWORD
TNO_ADMIN_SECRET

The old TNO_ADMIN_SERVER folder is retained as the local Node/JSON version for reference.
For Netlify deployment, use the repository root containing netlify.toml, package.json, TNO_SITE and netlify/.
