import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config as loadDotenv } from 'dotenv'

// 로컬 개발 환경에서만 .env.local 로드 (Vercel에는 없음)
loadDotenv({ path: path.resolve(process.cwd(), '.env.local') })

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  ...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
})
