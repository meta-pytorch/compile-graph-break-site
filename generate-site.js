const fs = require('fs');
const path = require('path');

const REGISTRY_URL = 'https://raw.githubusercontent.com/pytorch/pytorch/main/torch/_dynamo/graph_break_registry.json';

async function getRegistryData() {
  try {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch registry JSON: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching registry data:', error);
    process.exit(1);
  }
}

async function generateSite() {
  const registry = await getRegistryData();

  const outputDir = 'gbid_directory';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate _config.yml for Jekyll
  const jekyllConfig = `\
# Site settings
title: Graph-Break Registry
description: A registry of PyTorch Dynamo graph breaks.

# Base URL for the site
# This is crucial for correct linking on GitHub Pages
baseurl: "/docs/repo/compile-graph-break" # Adjust this based on your actual GitHub Pages path

# Build settings
theme: jekyll-theme-minimal # Or any other Jekyll theme you prefer
remote_theme: pages-themes/minimal@v0.2.0 # For GitHub Pages remote theme
plugins:
  - jekyll-remote-theme

# Exclude build-related files from Jekyll processing
exclude:
  - node_modules
  - package.json
  - package-lock.json
  - generate-site.js
  - README.md
  - .gitignore
  - .github
`;
  fs.writeFileSync(path.join(outputDir, '_config.yml'), jekyllConfig);
  console.log('Generated _config.yml');

  // Generate index.md
  let indexMd = `# Graph-Break Registry

Below are all known graph breaks detected by Dynamo.

<!-- Search input - This will require client-side JavaScript if desired.
     For a pure Markdown site, search functionality would typically be handled
     by Jekyll plugins or an external search service. -->
<!-- <input type="text" placeholder="Search GBID, type, explanation..." class="search-input" id="search-input"> -->

`;

  // Add registry items to index.md
  Object.entries(registry).forEach(([id, entries]) => {
    const entry = entries[0]; // Assuming first entry is sufficient for list view
    indexMd += `- [${id}](gb/${id.toLowerCase()}.md) — ${entry.Gb_type}
`;
  });

  fs.writeFileSync(path.join(outputDir, 'index.md'), indexMd);
  console.log('Generated index.md');

  // Generate individual GBID pages
  const gbDir = path.join(outputDir, 'gb');
  if (!fs.existsSync(gbDir)) {
    fs.mkdirSync(gbDir, { recursive: true });
  }

  Object.entries(registry).forEach(([id, entries]) => {
    const entry = entries[0]; // Assuming first entry for the detail page

    let detailMd = `# ${id}

## Graph-Break Type
*Short name describing what triggered the graph break*
${entry.Gb_type}

## Context
*Values or code snippet captured at the break point*
${entry.Context || '*No context provided.*'}

## Explanation
*Why this specific graph break happened*
${entry.Explanation || '*No explanation provided.*'}

## Hints
*Suggestions for fixing or working around the break*
${entry.Hints?.length ? entry.Hints.map(h => `- ${h}`).join('\n') : '*No hints provided.*'}

${entry.Additional_Info?.length ? `
## Additional Information
${entry.Additional_Info.map(info => `- ${info}`).join('\n')}
` : ''}

[Back to Registry](../index.md)
`;
    fs.writeFileSync(path.join(gbDir, `${id.toLowerCase()}.md`), detailMd);
  });
  console.log(`Generated ${Object.keys(registry).length} individual GBID pages`);
}

generateSite(); 