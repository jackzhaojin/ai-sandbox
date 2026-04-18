import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const repoName = 'ai-sandbox'
const repoBasePath = `/${repoName}/`
const siteRoot = path.join(repoRoot, 'site')
const tempSourcesRoot = path.join(repoRoot, '.tmp-sources')
const viteConfigNames = ['vite.config.js', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.ts']

// Sources to aggregate into the site. Each source contributes its own
// projects/ tree under its own URL prefix on the published site.
//
// - label: human-friendly name shown on the landing page
// - branch: git branch to materialize (null = use the current checkout as-is)
// - urlSegment: subpath under the repo base on GitHub Pages (empty = repo root)
const SOURCES = [
  {
    label: 'main',
    description: 'Current showcases merged to main.',
    branch: null,
    urlSegment: '',
  },
  {
    label: 'monorepo/legacy-v2.2',
    description: 'Pre-rebaseline monorepo archive (per-project subfolders).',
    branch: 'monorepo/legacy-v2.2',
    urlSegment: 'branches/legacy-v2.2',
  },
]

const cliFlags = new Set(process.argv.slice(2))
const shouldInstall = !cliFlags.has('--skip-install')
const shouldBuild = !cliFlags.has('--skip-build')

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function run(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      ...options,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

function sanitizeForPath(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-')
}

/**
 * Recursively discover deployable Vite projects under searchDir.
 * A deployable project is any directory containing both package.json and a vite config.
 */
async function findDeployableProjects(searchDir, relativePrefix = '') {
  if (!(await pathExists(searchDir))) {
    return []
  }

  const entries = await fs.readdir(searchDir, { withFileTypes: true })
  const projects = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
      continue
    }

    const fullDir = path.join(searchDir, entry.name)
    const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name

    const hasPackageJson = await pathExists(path.join(fullDir, 'package.json'))
    const hasViteConfig = await Promise.any(
      viteConfigNames.map(async (filename) => {
        if (await pathExists(path.join(fullDir, filename))) {
          return true
        }
        throw new Error('missing')
      }),
    ).catch(() => false)

    if (hasPackageJson && hasViteConfig) {
      projects.push({
        name: entry.name,
        relativePath,
        dir: fullDir,
        title: await readProjectTitle(fullDir, entry.name),
      })
    } else {
      const nested = await findDeployableProjects(fullDir, relativePath)
      projects.push(...nested)
    }
  }

  return projects.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

async function readProjectTitle(projectDir, fallbackName) {
  const candidateFiles = [
    path.join(projectDir, 'public', 'manifest.json'),
    path.join(projectDir, 'manifest.json'),
    path.join(projectDir, 'package.json'),
  ]

  for (const candidateFile of candidateFiles) {
    if (!(await pathExists(candidateFile))) {
      continue
    }

    try {
      const raw = await fs.readFile(candidateFile, 'utf8')
      const parsed = JSON.parse(raw)
      if (typeof parsed.title === 'string' && parsed.title.trim()) {
        return parsed.title.trim()
      }

      if (typeof parsed.name === 'string' && parsed.name.trim()) {
        return parsed.name.trim()
      }
    } catch {
      // Ignore malformed metadata and fall back to the directory name.
    }
  }

  return fallbackName
}

async function installProjectDependencies(projectDir) {
  const hasLockfile = await pathExists(path.join(projectDir, 'package-lock.json'))
  if (hasLockfile) {
    await run('npm', ['ci'], { cwd: projectDir })
    return
  }

  await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: projectDir })
}

async function buildProject(project, source) {
  const sitePrefix = source.urlSegment ? `${source.urlSegment}/` : ''
  const basePath = `${repoBasePath}${sitePrefix}projects/${project.relativePath}/`

  if (shouldInstall) {
    await installProjectDependencies(project.dir)
  }

  if (shouldBuild) {
    await run('npm', ['run', 'build', '--', `--base=${basePath}`], { cwd: project.dir })
  }

  const distDir = path.join(project.dir, 'dist')
  if (!(await pathExists(distDir))) {
    throw new Error(`Expected build output at ${distDir}`)
  }

  const stagedProjectDir = path.join(siteRoot, source.urlSegment, 'projects', project.relativePath)
  await fs.mkdir(path.dirname(stagedProjectDir), { recursive: true })
  await fs.cp(distDir, stagedProjectDir, { recursive: true })

  return {
    ...project,
    basePath,
    sourceLabel: source.label,
  }
}

/**
 * Materialize a source for building. For branch-backed sources, create a temp
 * worktree under .tmp-sources/. Returns the directory containing projects/.
 */
async function materializeSource(source) {
  if (source.branch === null) {
    return repoRoot
  }

  const worktreePath = path.join(tempSourcesRoot, sanitizeForPath(source.branch))

  // Always start from a clean state.
  await safeRemoveWorktree(worktreePath)

  await fs.mkdir(tempSourcesRoot, { recursive: true })
  await run('git', ['worktree', 'add', '--force', worktreePath, source.branch])

  return worktreePath
}

async function safeRemoveWorktree(worktreePath) {
  if (!(await pathExists(worktreePath))) {
    return
  }

  try {
    await run('git', ['worktree', 'remove', '--force', worktreePath])
  } catch {
    // Fall back to a hard rm if git no longer tracks it.
    await fs.rm(worktreePath, { recursive: true, force: true })
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function groupProjectsByDate(projects) {
  const groups = new Map()

  for (const project of projects) {
    const segments = project.relativePath.split('/')
    const dateSegment = segments.length >= 2 ? segments[1] : 'other'
    if (!groups.has(dateSegment)) {
      groups.set(dateSegment, [])
    }
    groups.get(dateSegment).push(project)
  }

  return new Map([...groups.entries()].sort(([a], [b]) => b.localeCompare(a)))
}

async function writeLandingPage(sectionsBySource) {
  let sourcesHtml = ''

  for (const { source, builtProjects } of sectionsBySource) {
    const sitePrefix = source.urlSegment ? `${source.urlSegment}/` : ''
    let dateSectionsHtml = ''

    if (builtProjects.length === 0) {
      dateSectionsHtml = `<p class="empty">No deployable projects on this source yet.</p>`
    } else {
      const grouped = groupProjectsByDate(builtProjects)
      for (const [date, dateProjects] of grouped) {
        const cards = dateProjects
          .map((project) => {
            const href = `./${sitePrefix}projects/${project.relativePath}/`
            return `
              <a class="card" href="${href}">
                <span class="slug">${escapeHtml(project.name)}</span>
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.relativePath)}</p>
              </a>
            `
          })
          .join('\n')

        dateSectionsHtml += `
          <h3 class="date">${escapeHtml(date)}</h3>
          <section class="grid">
            ${cards}
          </section>
        `
      }
    }

    sourcesHtml += `
      <section class="source">
        <h2>${escapeHtml(source.label)}</h2>
        <p class="source-desc">${escapeHtml(source.description)}</p>
        ${dateSectionsHtml}
      </section>
    `
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${repoName} deployments</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe8;
        --panel: rgba(255, 255, 255, 0.82);
        --ink: #1f2937;
        --muted: #556070;
        --border: rgba(31, 41, 55, 0.12);
        --accent: #0f766e;
        --accent-2: #c2410c;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Space Grotesk", "Avenir Next", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 38%),
          radial-gradient(circle at bottom right, rgba(194, 65, 12, 0.12), transparent 32%),
          var(--bg);
      }

      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 64px 24px 72px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: clamp(2.5rem, 4vw, 4.25rem);
        line-height: 0.95;
      }

      .source {
        margin-top: 48px;
        padding-top: 28px;
        border-top: 1px solid var(--border);
      }

      .source h2 {
        margin: 0 0 6px;
        font-size: 1.6rem;
        color: var(--ink);
      }

      .source-desc {
        margin: 0 0 18px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      h3.date {
        margin: 24px 0 12px;
        font-size: 1.0rem;
        color: var(--accent);
        letter-spacing: 0.08em;
      }

      .empty {
        margin: 8px 0 0;
        color: var(--muted);
        font-style: italic;
      }

      .intro {
        max-width: 720px;
        margin-bottom: 32px;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.6;
      }

      .meta {
        margin: 0 0 18px;
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }

      .card {
        display: block;
        padding: 22px;
        border: 1px solid var(--border);
        border-radius: 22px;
        background: var(--panel);
        box-shadow: 0 16px 40px rgba(31, 41, 55, 0.08);
        text-decoration: none;
        color: inherit;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .card:hover {
        transform: translateY(-3px);
        border-color: rgba(15, 118, 110, 0.28);
        box-shadow: 0 24px 54px rgba(31, 41, 55, 0.12);
      }

      .card h3 {
        margin: 12px 0 10px;
        font-size: 1.25rem;
      }

      .card p {
        margin: 0;
        color: var(--muted);
        font-size: 0.85rem;
        line-height: 1.55;
      }

      .slug {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.08);
        color: var(--accent);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="meta">GitHub Pages aggregator</p>
      <h1>${repoName}</h1>
      <p class="intro">
        AI-built showcase projects, aggregated across branches.
        Each section below is one branch in the repo; cards link to the live build.
      </p>
      ${sourcesHtml}
    </main>
  </body>
</html>
`

  await fs.writeFile(path.join(siteRoot, 'index.html'), html, 'utf8')
}

async function writePagesFallback() {
  const repoBase = repoBasePath.replace(/\/$/, '')
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting...</title>
    <script>
      (function () {
        var repoBase = ${JSON.stringify(repoBase)};
        var pathname = window.location.pathname;

        // Match either /<repo>/projects/... or /<repo>/<branchSegment>/projects/...
        var projectsIdx = pathname.indexOf('/projects/');
        if (projectsIdx !== -1 && pathname.startsWith(repoBase + '/')) {
          var prefix = pathname.slice(0, projectsIdx + '/projects/'.length);
          var remainder = pathname.slice(projectsIdx + '/projects/'.length);
          var segments = remainder.split('/').filter(Boolean);

          // Need at least 3 segments (category/date/project) to identify the app root
          if (segments.length >= 3) {
            var appRoot = segments.slice(0, 3).join('/');
            var spaRoute = segments.slice(3).join('/');
            var suffix = spaRoute || window.location.search || window.location.hash
              ? '?gh_path=' + encodeURIComponent(spaRoute + window.location.search + window.location.hash)
              : '';

            window.location.replace(prefix + appRoot + '/' + suffix);
            return;
          }
        }

        window.location.replace(repoBase + '/');
      })();
    </script>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
    </style>
  </head>
  <body>
    <p>Redirecting…</p>
  </body>
</html>
`

  await fs.writeFile(path.join(siteRoot, '404.html'), html, 'utf8')
}

async function main() {
  await fs.rm(siteRoot, { recursive: true, force: true })
  await fs.mkdir(siteRoot, { recursive: true })

  const sectionsBySource = []
  const tempWorktrees = []
  let totalProjects = 0

  try {
    for (const source of SOURCES) {
      console.log(`\n=== Source: ${source.label} ===`)

      const sourceDir = await materializeSource(source)
      if (source.branch !== null) {
        tempWorktrees.push(sourceDir)
      }

      const projectsDir = path.join(sourceDir, 'projects')
      const projects = await findDeployableProjects(projectsDir)

      console.log(`Found ${projects.length} deployable project(s) on ${source.label}.`)
      for (const project of projects) {
        console.log(`  - ${project.relativePath} (${project.title})`)
      }

      const builtProjects = []
      for (const project of projects) {
        console.log(`\nBuilding ${source.label}::${project.relativePath}...`)
        builtProjects.push(await buildProject(project, source))
      }

      sectionsBySource.push({ source, builtProjects })
      totalProjects += builtProjects.length
    }

    if (totalProjects === 0) {
      throw new Error('No deployable Vite projects found across any source.')
    }

    await writeLandingPage(sectionsBySource)
    await writePagesFallback()
    await fs.writeFile(path.join(siteRoot, '.nojekyll'), '', 'utf8')

    console.log(`\nStaged ${totalProjects} project(s) across ${sectionsBySource.length} source(s) into ${path.relative(repoRoot, siteRoot)}/`)
  } finally {
    for (const worktreePath of tempWorktrees) {
      await safeRemoveWorktree(worktreePath)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
