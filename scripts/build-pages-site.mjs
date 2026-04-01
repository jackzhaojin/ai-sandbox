import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const repoName = path.basename(repoRoot)
const repoBasePath = `/${repoName}/`
const projectsRoot = path.join(repoRoot, 'projects')
const siteRoot = path.join(repoRoot, 'site')
const viteConfigNames = ['vite.config.js', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.ts']

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

/**
 * Recursively discover deployable Vite projects under projectsRoot.
 * A deployable project is any directory containing both package.json and a vite config.
 * The relative path from projectsRoot is preserved (e.g. react/2026-03-31/finance-dashboard-claude).
 */
async function findDeployableProjects(searchDir, relativePrefix = '') {
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
      // Not a project — recurse deeper (e.g. into react/, 2026-03-31/)
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

async function buildProject(project) {
  const basePath = `${repoBasePath}projects/${project.relativePath}/`

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

  const stagedProjectDir = path.join(siteRoot, 'projects', project.relativePath)
  await fs.mkdir(path.dirname(stagedProjectDir), { recursive: true })
  await fs.cp(distDir, stagedProjectDir, { recursive: true })

  return {
    ...project,
    basePath,
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

/**
 * Group projects by their date folder (second segment of relativePath, e.g. "2026-03-31").
 * Returns a Map<dateString, project[]> sorted by date descending.
 */
function groupProjectsByDate(projects) {
  const groups = new Map()

  for (const project of projects) {
    // relativePath looks like: react/2026-03-31/finance-dashboard-claude
    const segments = project.relativePath.split('/')
    const dateSegment = segments.length >= 2 ? segments[1] : 'other'
    if (!groups.has(dateSegment)) {
      groups.set(dateSegment, [])
    }
    groups.get(dateSegment).push(project)
  }

  // Sort date keys descending (newest first)
  const sorted = new Map(
    [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)),
  )

  return sorted
}

async function writeLandingPage(projects) {
  const grouped = groupProjectsByDate(projects)

  let sectionsHtml = ''
  for (const [date, dateProjects] of grouped) {
    const cards = dateProjects
      .map((project) => {
        const href = `./projects/${project.relativePath}/`
        return `
          <a class="card" href="${href}">
            <span class="slug">${escapeHtml(project.name)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.relativePath)}</p>
          </a>
        `
      })
      .join('\n')

    sectionsHtml += `
      <h2>${escapeHtml(date)}</h2>
      <section class="grid">
        ${cards}
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

      * {
        box-sizing: border-box;
      }

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

      h2 {
        margin: 36px 0 14px;
        font-size: 1.15rem;
        color: var(--accent);
        letter-spacing: 0.08em;
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
      <p class="meta">GitHub Pages monorepo site</p>
      <h1>${repoName}</h1>
      <p class="intro">
        Deployable Vite projects from this repo, grouped by date.
        Each card links to its live subpath on GitHub Pages.
      </p>
      ${sectionsHtml}
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
        var projectsPrefix = repoBase + '/projects/';
        var pathname = window.location.pathname;

        if (pathname.startsWith(projectsPrefix)) {
          var remainder = pathname.slice(projectsPrefix.length);
          var segments = remainder.split('/').filter(Boolean);

          // Deep path: projects/react/YYYY-MM-DD/project-name/[spa-route]
          // We need at least 3 segments (category/date/project) to identify the app root
          if (segments.length >= 3) {
            var appRoot = segments.slice(0, 3).join('/');
            var spaRoute = segments.slice(3).join('/');
            var suffix = spaRoute || window.location.search || window.location.hash
              ? '?gh_path=' + encodeURIComponent(spaRoute + window.location.search + window.location.hash)
              : '';

            window.location.replace(repoBase + '/projects/' + appRoot + '/' + suffix);
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
  const projects = await findDeployableProjects(projectsRoot)
  if (projects.length === 0) {
    throw new Error('No deployable Vite projects found under projects/')
  }

  console.log(`Found ${projects.length} deployable project(s):`)
  for (const project of projects) {
    console.log(`  - ${project.relativePath} (${project.title})`)
  }

  await fs.rm(siteRoot, { recursive: true, force: true })
  await fs.mkdir(path.join(siteRoot, 'projects'), { recursive: true })

  const builtProjects = []
  for (const project of projects) {
    console.log(`\nBuilding ${project.relativePath}...`)
    builtProjects.push(await buildProject(project))
  }

  await writeLandingPage(builtProjects)
  await writePagesFallback()
  await fs.writeFile(path.join(siteRoot, '.nojekyll'), '', 'utf8')

  console.log(`\nStaged ${builtProjects.length} project(s) into ${path.relative(repoRoot, siteRoot)}/`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
