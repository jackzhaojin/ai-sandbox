import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Get the DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL

// Only create the connection if we have a valid DATABASE_URL
// This allows the app to build without requiring a database connection
let client: ReturnType<typeof postgres> | null = null

if (connectionString) {
  // Create the postgres client with connection pooling
  client = postgres(connectionString, {
    max: 10, // Maximum number of connections
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
  })
}

// Create Drizzle instance with schema
// If no client, db operations will fail at runtime (not build time)
export const db = client ? drizzle(client, { schema }) : null as any

// Export client for direct access if needed
export { client }

// Export all schema tables and types
export * from './schema'
