import fs from 'node:fs'

const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=')
        return [key, rest.join('=')]
      }),
  )
}

const env = {
  ...readEnvFile('.env.local'),
  ...readEnvFile('supabase/.env.local'),
  ...process.env,
}

const projectRef =
  env.SUPABASE_PROJECT_REF ||
  new URL(env.VITE_SUPABASE_URL || env.SUPABASE_URL).hostname.split('.')[0]
const accessToken = env.SUPABASE_ACCESS_TOKEN
const sqlFile = process.argv[2]

if (!projectRef || !accessToken || !sqlFile) {
  throw new Error(
    'Usage: SUPABASE_ACCESS_TOKEN=... node scripts/apply-supabase-sql.mjs path/to/migration.sql',
  )
}

const query = fs.readFileSync(sqlFile, 'utf8')
const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  },
)

const text = await res.text()
if (!res.ok) {
  throw new Error(`${res.status} ${res.statusText}: ${text}`)
}

console.log(`Applied ${sqlFile} to ${projectRef}`)
