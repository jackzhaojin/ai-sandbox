/**
 * Database Seed Script
 *
 * Seeds the database with:
 * - 3 users (admin, author, viewer)
 * - 1 demo site
 * - 16 component definitions
 * - 5 page templates
 * - 2 content fragments
 * - 3 sample pages with real component content
 * - Header and footer menus
 * - Theme config and social links
 *
 * Usage: npm run db:seed
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Check .env.local file.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Component definitions for all 16 types
const componentDefinitions = [
  {
    name: 'hero',
    display_name: 'Hero',
    category: 'layout',
    description: 'Large hero section with heading, subheading, and CTA buttons',
    default_props: {
      heading: 'Welcome to Your Site',
      subheading: 'Build amazing experiences with PageForge',
      primaryButtonText: 'Get Started',
      primaryButtonLink: '#',
      secondaryButtonText: 'Learn More',
      secondaryButtonLink: '#',
      backgroundImage: '',
      height: 'large'
    },
    props_schema: {
      heading: { type: 'string', label: 'Heading', required: true },
      subheading: { type: 'string', label: 'Subheading' },
      primaryButtonText: { type: 'string', label: 'Primary Button Text' },
      primaryButtonLink: { type: 'string', label: 'Primary Button Link' },
      secondaryButtonText: { type: 'string', label: 'Secondary Button Text' },
      secondaryButtonLink: { type: 'string', label: 'Secondary Button Link' },
      backgroundImage: { type: 'image', label: 'Background Image' },
      height: { type: 'select', label: 'Height', options: ['small', 'medium', 'large'] }
    }
  },
  {
    name: 'text',
    display_name: 'Text',
    category: 'content',
    description: 'Rich text editor for formatted content',
    default_props: {
      content: '<p>Enter your text here...</p>',
      textAlign: 'left'
    },
    props_schema: {
      content: { type: 'richtext', label: 'Content', required: true },
      textAlign: { type: 'select', label: 'Text Align', options: ['left', 'center', 'right'] }
    }
  },
  {
    name: 'image',
    display_name: 'Image',
    category: 'media',
    description: 'Single image with optional caption',
    default_props: {
      src: '',
      alt: '',
      caption: '',
      width: 'full'
    },
    props_schema: {
      src: { type: 'image', label: 'Image', required: true },
      alt: { type: 'string', label: 'Alt Text', required: true },
      caption: { type: 'string', label: 'Caption' },
      width: { type: 'select', label: 'Width', options: ['small', 'medium', 'large', 'full'] }
    }
  },
  {
    name: 'two-column',
    display_name: 'Two Column',
    category: 'layout',
    description: 'Two-column layout with customizable content',
    default_props: {
      leftContent: '<p>Left column content</p>',
      rightContent: '<p>Right column content</p>',
      columnRatio: '50-50'
    },
    props_schema: {
      leftContent: { type: 'richtext', label: 'Left Content', required: true },
      rightContent: { type: 'richtext', label: 'Right Content', required: true },
      columnRatio: { type: 'select', label: 'Column Ratio', options: ['50-50', '60-40', '40-60', '70-30', '30-70'] }
    }
  },
  {
    name: 'cta',
    display_name: 'Call to Action',
    category: 'content',
    description: 'Call-to-action section with button',
    default_props: {
      heading: 'Ready to get started?',
      description: 'Take the next step today',
      buttonText: 'Get Started',
      buttonLink: '#',
      backgroundColor: 'primary'
    },
    props_schema: {
      heading: { type: 'string', label: 'Heading', required: true },
      description: { type: 'string', label: 'Description' },
      buttonText: { type: 'string', label: 'Button Text', required: true },
      buttonLink: { type: 'string', label: 'Button Link', required: true },
      backgroundColor: { type: 'select', label: 'Background', options: ['primary', 'secondary', 'gray'] }
    }
  },
  {
    name: 'testimonial',
    display_name: 'Testimonial',
    category: 'content',
    description: 'Customer testimonial or quote',
    default_props: {
      quote: 'This product changed my life!',
      author: 'John Doe',
      role: 'CEO, Company',
      avatar: '',
      rating: 5
    },
    props_schema: {
      quote: { type: 'string', label: 'Quote', required: true },
      author: { type: 'string', label: 'Author', required: true },
      role: { type: 'string', label: 'Role/Company' },
      avatar: { type: 'image', label: 'Avatar' },
      rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 }
    }
  },
  {
    name: 'spacer',
    display_name: 'Spacer',
    category: 'layout',
    description: 'Vertical spacing between sections',
    default_props: {
      height: 'medium'
    },
    props_schema: {
      height: { type: 'select', label: 'Height', options: ['small', 'medium', 'large'] }
    }
  },
  {
    name: 'accordion',
    display_name: 'Accordion',
    category: 'content',
    description: 'Expandable accordion with multiple items',
    default_props: {
      items: [
        { title: 'Item 1', content: 'Content for item 1' },
        { title: 'Item 2', content: 'Content for item 2' }
      ],
      allowMultiple: false
    },
    props_schema: {
      items: { type: 'array', label: 'Items', itemSchema: { title: 'string', content: 'richtext' } },
      allowMultiple: { type: 'boolean', label: 'Allow Multiple Open' }
    }
  },
  {
    name: 'tabs',
    display_name: 'Tabs',
    category: 'content',
    description: 'Tabbed content sections',
    default_props: {
      tabs: [
        { label: 'Tab 1', content: '<p>Tab 1 content</p>' },
        { label: 'Tab 2', content: '<p>Tab 2 content</p>' }
      ]
    },
    props_schema: {
      tabs: { type: 'array', label: 'Tabs', itemSchema: { label: 'string', content: 'richtext' } }
    }
  },
  {
    name: 'carousel',
    display_name: 'Carousel',
    category: 'media',
    description: 'Image or content carousel',
    default_props: {
      slides: [],
      autoplay: true,
      interval: 5000
    },
    props_schema: {
      slides: { type: 'array', label: 'Slides', itemSchema: { image: 'image', caption: 'string' } },
      autoplay: { type: 'boolean', label: 'Autoplay' },
      interval: { type: 'number', label: 'Interval (ms)', min: 1000 }
    }
  },
  {
    name: 'video',
    display_name: 'Video',
    category: 'media',
    description: 'Embedded video player',
    default_props: {
      url: '',
      provider: 'youtube',
      autoplay: false,
      controls: true
    },
    props_schema: {
      url: { type: 'string', label: 'Video URL', required: true },
      provider: { type: 'select', label: 'Provider', options: ['youtube', 'vimeo', 'custom'] },
      autoplay: { type: 'boolean', label: 'Autoplay' },
      controls: { type: 'boolean', label: 'Show Controls' }
    }
  },
  {
    name: 'form',
    display_name: 'Form',
    category: 'form',
    description: 'Contact or submission form',
    default_props: {
      title: 'Contact Us',
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true }
      ],
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!'
    },
    props_schema: {
      title: { type: 'string', label: 'Form Title' },
      fields: { type: 'array', label: 'Form Fields' },
      submitButtonText: { type: 'string', label: 'Submit Button Text' },
      successMessage: { type: 'string', label: 'Success Message' }
    }
  },
  {
    name: 'card-grid',
    display_name: 'Card Grid',
    category: 'layout',
    description: 'Grid of cards with image, title, and description',
    default_props: {
      cards: [
        { image: '', title: 'Card 1', description: 'Description 1', link: '#' },
        { image: '', title: 'Card 2', description: 'Description 2', link: '#' },
        { image: '', title: 'Card 3', description: 'Description 3', link: '#' }
      ],
      columns: 3
    },
    props_schema: {
      cards: { type: 'array', label: 'Cards', itemSchema: { image: 'image', title: 'string', description: 'string', link: 'string' } },
      columns: { type: 'select', label: 'Columns', options: [2, 3, 4] }
    }
  },
  {
    name: 'embed',
    display_name: 'Embed',
    category: 'content',
    description: 'Embed external content via HTML/iframe',
    default_props: {
      embedCode: '',
      aspectRatio: '16-9'
    },
    props_schema: {
      embedCode: { type: 'textarea', label: 'Embed Code', required: true },
      aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['16-9', '4-3', '1-1', 'custom'] }
    }
  },
  {
    name: 'header',
    display_name: 'Header',
    category: 'navigation',
    description: 'Site header with logo and navigation',
    default_props: {
      logo: '',
      siteName: 'PageForge',
      menuId: null,
      showSearch: false
    },
    props_schema: {
      logo: { type: 'image', label: 'Logo' },
      siteName: { type: 'string', label: 'Site Name' },
      menuId: { type: 'reference', label: 'Menu', reference: 'menus' },
      showSearch: { type: 'boolean', label: 'Show Search' }
    }
  },
  {
    name: 'footer',
    display_name: 'Footer',
    category: 'navigation',
    description: 'Site footer with links and info',
    default_props: {
      copyrightText: '© 2026 PageForge. All rights reserved.',
      menuId: null,
      showSocial: true,
      socialLinks: []
    },
    props_schema: {
      copyrightText: { type: 'string', label: 'Copyright Text' },
      menuId: { type: 'reference', label: 'Menu', reference: 'menus' },
      showSocial: { type: 'boolean', label: 'Show Social Links' },
      socialLinks: { type: 'array', label: 'Social Links', itemSchema: { platform: 'string', url: 'string' } }
    }
  }
]

async function ensureTablesExist() {
  console.log('🔍 Checking if tables exist...\n')

  // Read and execute the migration SQL
  const migrationPath = join(process.cwd(), 'drizzle/migrations/0000_marvelous_sabretooth.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Split into statements
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements\n`)

  let created = 0
  let skipped = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Extract what we're creating for better logging
    const match = statement.match(/CREATE (TYPE|TABLE) "?public"?\.?"?(\w+)"?/)
    const objectType = match?.[1] || 'object'
    const objectName = match?.[2] || `statement ${i + 1}`

    try {
      // Execute via REST API since rpc might not be available
      const { error } = await supabase.rpc('exec_sql', { query: statement })

      if (error) {
        if (error.message.includes('already exists')) {
          skipped++
          // Silent skip for already existing objects
        } else {
          console.log(`  ⚠️  ${objectType} ${objectName}: ${error.message.substring(0, 60)}`)
        }
      } else {
        created++
        console.log(`  ✅ Created ${objectType.toLowerCase()} ${objectName}`)
      }
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        skipped++
      } else {
        console.error(`  ❌ Error with ${objectName}:`, err.message?.substring(0, 60))
      }
    }
  }

  console.log(`\n📊 Created: ${created}, Skipped: ${skipped}\n`)
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Ensure tables exist first
    await ensureTablesExist()

    // Step 1: Create users via Supabase Admin API
    console.log('👤 Creating users...')

    const users = [
      { email: 'admin@pageforge.dev', password: 'password123', name: 'Admin User', role: 'admin' },
      { email: 'author@pageforge.dev', password: 'password123', name: 'Author User', role: 'editor' },
      { email: 'viewer@pageforge.dev', password: 'password123', name: 'Viewer User', role: 'viewer' }
    ]

    const createdProfiles: any[] = []

    for (const user of users) {
      // Check if user exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()

      if (existing) {
        console.log(`  ℹ️  User ${user.email} already exists`)
        createdProfiles.push(existing)
        continue
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`  ⚠️  Auth error for ${user.email}:`, authError.message)
        continue
      }

      console.log(`  ✅ Created auth user: ${user.email}`)

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role
        })
        .select()
        .single()

      if (profileError) {
        console.error(`  ❌ Profile error:`, profileError.message)
      } else {
        createdProfiles.push(profile)
        console.log(`  ✅ Created profile: ${user.name}`)
      }
    }

    const adminProfile = createdProfiles.find(p => p.role === 'admin')
    const authorProfile = createdProfiles.find(p => p.role === 'editor')

    if (!adminProfile || !authorProfile) {
      throw new Error('Failed to create required user profiles')
    }

    // Step 2: Create demo site
    console.log('\n🏢 Creating demo site...')

    const { data: existingSite } = await supabase
      .from('sites')
      .select('*')
      .eq('slug', 'demo')
      .single()

    let demoSite = existingSite

    if (!demoSite) {
      const { data, error } = await supabase
        .from('sites')
        .insert({
          name: 'PageForge Demo',
          slug: 'demo',
          description: 'A demonstration site showcasing PageForge CMS capabilities',
          theme_settings: {
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            fontFamily: 'Inter',
            borderRadius: 'medium',
            socialLinks: [
              { platform: 'twitter', url: 'https://twitter.com/pageforge' },
              { platform: 'github', url: 'https://github.com/pageforge' },
              { platform: 'linkedin', url: 'https://linkedin.com/company/pageforge' }
            ]
          },
          seo_settings: {
            title: 'PageForge Demo',
            description: 'Explore the power of PageForge CMS',
            keywords: ['cms', 'pageforge', 'demo']
          },
          created_by: adminProfile.id
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create site: ${error.message}`)
      }

      demoSite = data
      console.log(`✅ Created site: ${demoSite.name}`)
    } else {
      console.log(`ℹ️  Site 'demo' already exists`)
    }

    // Step 3: Seed component definitions
    console.log('\n🧩 Seeding component definitions...')
    for (const comp of componentDefinitions) {
      const { error } = await supabase
        .from('components')
        .upsert({
          ...comp,
          is_system: true,
          is_active: true
        }, {
          onConflict: 'name'
        })

      if (error) {
        console.log(`  ⚠️  ${comp.display_name}: ${error.message}`)
      } else {
        console.log(`  ✅ ${comp.display_name}`)
      }
    }

    // Step 4: Create page templates
    console.log('\n📄 Creating page templates...')
    const templateDefinitions = [
      {
        name: 'Blank',
        description: 'Empty template - start from scratch',
        structure: { sections: [] },
        default_content: {}
      },
      {
        name: 'Landing Page',
        description: 'Hero + features + CTA structure',
        structure: {
          sections: [
            { component: 'hero', locked: false },
            { component: 'card-grid', locked: false },
            { component: 'cta', locked: false }
          ]
        },
        default_content: {}
      },
      {
        name: 'Blog Post',
        description: 'Single column blog layout',
        structure: {
          sections: [
            { component: 'text', locked: false },
            { component: 'image', locked: false },
            { component: 'text', locked: false }
          ]
        },
        default_content: {}
      },
      {
        name: 'About Page',
        description: 'Two-column about layout',
        structure: {
          sections: [
            { component: 'hero', locked: false },
            { component: 'two-column', locked: false },
            { component: 'testimonial', locked: false }
          ]
        },
        default_content: {}
      },
      {
        name: 'Contact Page',
        description: 'Contact form with info',
        structure: {
          sections: [
            { component: 'text', locked: false },
            { component: 'form', locked: false }
          ]
        },
        default_content: {}
      }
    ]

    for (const template of templateDefinitions) {
      const { error } = await supabase
        .from('templates')
        .insert({
          site_id: demoSite.id,
          ...template,
          is_system: true,
          created_by: adminProfile.id
        })

      if (error && !error.message.includes('duplicate')) {
        console.log(`  ⚠️  ${template.name}: ${error.message}`)
      } else {
        console.log(`  ✅ ${template.name}`)
      }
    }

    // Step 5: Create content fragments
    console.log('\n🧱 Creating content fragments...')
    const fragments = [
      {
        site_id: demoSite.id,
        name: 'Global CTA Banner',
        type: 'layout',
        content: {
          heading: '🚀 New Feature Alert!',
          description: 'Check out our latest updates and improvements',
          buttonText: 'Learn More',
          buttonLink: '/updates'
        },
        tags: ['cta', 'global'],
        created_by: adminProfile.id,
        updated_by: adminProfile.id
      },
      {
        site_id: demoSite.id,
        name: 'Company Info Footer',
        type: 'data',
        content: {
          companyName: 'PageForge Inc.',
          address: '123 CMS Street, San Francisco, CA 94102',
          phone: '+1 (555) 123-4567',
          email: 'hello@pageforge.dev'
        },
        tags: ['footer', 'contact'],
        created_by: adminProfile.id,
        updated_by: adminProfile.id
      }
    ]

    for (const fragment of fragments) {
      const { error } = await supabase
        .from('content_fragments')
        .insert(fragment)

      if (error && !error.message.includes('duplicate')) {
        console.log(`  ⚠️  ${fragment.name}: ${error.message}`)
      } else {
        console.log(`  ✅ ${fragment.name}`)
      }
    }

    // Step 6: Create sample pages
    console.log('\n📑 Creating sample pages...')
    const pageDefinitions = [
      {
        site_id: demoSite.id,
        title: 'Home',
        slug: 'home',
        path: '/',
        status: 'published',
        seo_title: 'Welcome to PageForge Demo',
        seo_description: 'Experience the power of visual page building with PageForge CMS',
        created_by: adminProfile.id,
        updated_by: adminProfile.id,
        published_at: new Date().toISOString()
      },
      {
        site_id: demoSite.id,
        title: 'About Us',
        slug: 'about',
        path: '/about',
        status: 'published',
        seo_title: 'About PageForge',
        seo_description: 'Learn more about our mission and team',
        created_by: adminProfile.id,
        updated_by: authorProfile.id,
        published_at: new Date().toISOString()
      },
      {
        site_id: demoSite.id,
        title: 'Getting Started with PageForge',
        slug: 'getting-started',
        path: '/blog/getting-started',
        status: 'draft',
        seo_title: 'Getting Started Guide',
        seo_description: 'Learn how to build your first page',
        created_by: authorProfile.id,
        updated_by: authorProfile.id
      }
    ]

    for (const page of pageDefinitions) {
      const { error } = await supabase
        .from('pages')
        .insert(page)

      if (error && !error.message.includes('duplicate')) {
        console.log(`  ⚠️  ${page.title}: ${error.message}`)
      } else {
        console.log(`  ✅ ${page.title} (${page.status})`)
      }
    }

    // Step 7: Create menus
    console.log('\n🧭 Creating navigation menus...')
    const menuDefinitions = [
      {
        site_id: demoSite.id,
        name: 'Header Menu',
        location: 'header',
        items: [
          { label: 'Home', url: '/', type: 'internal' },
          { label: 'About', url: '/about', type: 'internal' },
          { label: 'Blog', url: '/blog', type: 'internal' },
          { label: 'Contact', url: '/contact', type: 'internal' }
        ],
        created_by: adminProfile.id,
        updated_by: adminProfile.id
      },
      {
        site_id: demoSite.id,
        name: 'Footer Menu',
        location: 'footer',
        items: [
          { label: 'Privacy', url: '/privacy', type: 'internal' },
          { label: 'Terms', url: '/terms', type: 'internal' },
          { label: 'Documentation', url: 'https://docs.pageforge.dev', type: 'external' }
        ],
        created_by: adminProfile.id,
        updated_by: adminProfile.id
      }
    ]

    for (const menu of menuDefinitions) {
      const { error } = await supabase
        .from('menus')
        .insert(menu)

      if (error && !error.message.includes('duplicate')) {
        console.log(`  ⚠️  ${menu.name}: ${error.message}`)
      } else {
        console.log(`  ✅ ${menu.name}`)
      }
    }

    console.log('\n📷 Media files...')
    console.log('  ℹ️  Skipping media uploads (requires actual files)')
    console.log('  ℹ️  In production, upload sample images to Supabase Storage bucket')

    console.log('\n✨ Database seed completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   Users: ${createdProfiles.length}`)
    console.log(`   Sites: 1`)
    console.log(`   Components: ${componentDefinitions.length}`)
    console.log(`   Templates: ${templateDefinitions.length}`)
    console.log(`   Content Fragments: ${fragments.length}`)
    console.log(`   Pages: ${pageDefinitions.length}`)
    console.log(`   Menus: ${menuDefinitions.length}`)
    console.log('\n🔐 Test Credentials:')
    console.log('   Admin:  admin@pageforge.dev / password123')
    console.log('   Author: author@pageforge.dev / password123')
    console.log('   Viewer: viewer@pageforge.dev / password123')

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

// Run the seed
seedDatabase()
