/**
 * Database Seed Script
 *
 * This script populates the database with sample data for development and testing.
 * Run with: npm run db:seed
 */

import { db } from './index'
import { users, analyticsEvents, analyticsMetrics, savedReports, type NewAnalyticsEvent, type NewAnalyticsMetric } from './schema'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create sample users
    console.log('📝 Creating sample users...')
    const [user1, user2] = await db.insert(users).values([
      {
        email: 'admin@retrodash.dev',
        name: 'Admin User',
        emailVerified: new Date(),
      },
      {
        email: 'demo@retrodash.dev',
        name: 'Demo User',
        emailVerified: new Date(),
      },
    ]).returning()

    console.log(`✅ Created ${2} users`)

    // Create sample analytics events
    console.log('📊 Creating sample analytics events...')
    const events: NewAnalyticsEvent[] = []
    const eventTypes = ['page_view', 'button_click', 'form_submit', 'error', 'navigation']
    const eventNames = ['Dashboard View', 'Reports View', 'Settings Click', 'Login', 'Export Data']
    const paths = ['/dashboard', '/reports', '/analytics', '/settings', '/profile']

    // Generate 100 sample events over the past 30 days
    for (let i = 0; i < 100; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 30)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - randomDaysAgo)
      timestamp.setHours(Math.floor(Math.random() * 24))
      timestamp.setMinutes(Math.floor(Math.random() * 60))

      events.push({
        userId: Math.random() > 0.5 ? user1.id : user2.id,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        eventName: eventNames[Math.floor(Math.random() * eventNames.length)],
        path: paths[Math.floor(Math.random() * paths.length)],
        metadata: {
          browser: Math.random() > 0.5 ? 'chrome' : 'firefox',
          device: Math.random() > 0.7 ? 'mobile' : 'desktop',
          duration: Math.floor(Math.random() * 5000),
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp,
        sessionId: `session_${Math.floor(Math.random() * 10)}`,
      })
    }

    await db.insert(analyticsEvents).values(events)
    console.log(`✅ Created ${events.length} analytics events`)

    // Create sample aggregated metrics
    console.log('📈 Creating sample analytics metrics...')
    const metrics: NewAnalyticsMetric[] = []
    const metricTypes = ['daily_page_views', 'hourly_clicks', 'daily_unique_users', 'conversion_rate']

    // Generate metrics for the past 7 days
    for (let i = 0; i < 7; i++) {
      const startTime = new Date()
      startTime.setDate(startTime.getDate() - i)
      startTime.setHours(0, 0, 0, 0)

      const endTime = new Date(startTime)
      endTime.setHours(23, 59, 59, 999)

      metricTypes.forEach((metricType) => {
        metrics.push({
          metricType,
          metricName: `${metricType}_${startTime.toISOString().split('T')[0]}`,
          metricValue: (Math.random() * 1000).toFixed(2),
          dimensions: {
            date: startTime.toISOString().split('T')[0],
            source: Math.random() > 0.5 ? 'organic' : 'direct',
          },
          startTime,
          endTime,
        })
      })
    }

    await db.insert(analyticsMetrics).values(metrics)
    console.log(`✅ Created ${metrics.length} analytics metrics`)

    // Create sample saved reports
    console.log('📋 Creating sample saved reports...')
    await db.insert(savedReports).values([
      {
        userId: user1.id,
        name: 'Weekly Traffic Report',
        description: 'Shows page views and unique visitors for the past 7 days',
        config: {
          timeRange: 'last_7_days',
          metrics: ['page_views', 'unique_users'],
          chartType: 'line',
          groupBy: 'day',
        },
        isPublic: false,
      },
      {
        userId: user1.id,
        name: 'User Engagement Dashboard',
        description: 'Tracks user interactions and button clicks',
        config: {
          timeRange: 'last_30_days',
          metrics: ['button_clicks', 'form_submissions', 'session_duration'],
          chartType: 'bar',
          groupBy: 'day',
        },
        isPublic: true,
      },
      {
        userId: user2.id,
        name: 'Error Monitoring',
        description: 'Tracks application errors and their frequency',
        config: {
          timeRange: 'last_24_hours',
          metrics: ['errors'],
          chartType: 'line',
          groupBy: 'hour',
          filters: {
            eventType: 'error',
          },
        },
        isPublic: false,
      },
    ])

    console.log(`✅ Created ${3} saved reports`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Users: 2`)
    console.log(`   - Analytics Events: ${events.length}`)
    console.log(`   - Analytics Metrics: ${metrics.length}`)
    console.log(`   - Saved Reports: 3`)
    console.log('\n🔑 Test Credentials:')
    console.log(`   - admin@retrodash.dev`)
    console.log(`   - demo@retrodash.dev`)
    console.log('\n💡 Tip: Run "npm run db:studio" to explore the data in Drizzle Studio')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

// Run the seed function
seed()
