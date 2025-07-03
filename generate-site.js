const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

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

  // Create the 'GBID directory' directory if it doesn't exist
  const outputDir = 'GBID directory';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate index.html
  let indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph-Break Registry</title>
    <style>
        /* Basic Tailwind-like styles for demonstration */
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f8f8; color: #333; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .search-input { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; }
        .text-sm { font-size: 0.875rem; }
        .text-gray-500 { color: #6b7280; }
        .italic { font-style: italic; }
        .font-bold { font-weight: bold; }
        pre { background-color: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Graph-Break Registry</h1>
        <p class="text-sm text-gray-500 mb-4">Below are all known graph breaks detected by&nbsp;Dynamo.</p>

        <!-- Search input - will require JS for functionality -->
        <input type="text" placeholder="Search GBID, type, explanation..." class="search-input" id="search-input">

        <ul id="registry-list">
`;

  // Add registry items to index.html
  Object.entries(registry).forEach(([id, entries]) => {
    const entry = entries[0]; // Assuming first entry is sufficient for list view
    indexHtml += `
            <li data-gbid="${id}" data-type="${entry.Gb_type}" data-explanation="${entry.Explanation || ''}">
                <a href="/gb/${id.toLowerCase()}">${id}</a> —
                ${entry.Gb_type}
            </li>
`;
  });

  indexHtml += `
        </ul>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.getElementById('search-input');
            const registryList = document.getElementById('registry-list');
            const listItems = Array.from(registryList.getElementsByTagName('li'));

            searchInput.addEventListener('input', (event) => {
                const query = event.target.value.toLowerCase();

                listItems.forEach(item => {
                    const gbid = item.getAttribute('data-gbid').toLowerCase();
                    const type = item.getAttribute('data-type').toLowerCase();
                    const explanation = item.getAttribute('data-explanation').toLowerCase();

                    if (gbid.includes(query) || type.includes(query) || explanation.includes(query)) {
                        item.style.display = ''; // Show item
                    } else {
                        item.style.display = 'none'; // Hide item
                    }
                });
            });
        });
    </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
  console.log('Generated index.html');

  // Generate individual GBID pages
  const gbDir = path.join(outputDir, 'gb');
  if (!fs.existsSync(gbDir)) {
    fs.mkdirSync(gbDir, { recursive: true });
  }

  Object.entries(registry).forEach(([id, entries]) => {
    const entry = entries[0]; // Assuming first entry for the detail page

    let detailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GBID ${id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f8f8; color: #333; }
        .container { max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        p { margin-bottom: 10px; }
        pre { background-color: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; }
        ul { list-style: disc; padding-left: 20px; }
        li { margin-bottom: 5px; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .text-sm { font-size: 0.875rem; }
        .text-gray-500 { color: #6b7280; }
        .section-header { margin-top: 20px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${id}</h1>

        <p class="font-bold section-header">Graph-Break Type <span class="italic font-normal text-sm text-gray-500">— short name describing what triggered the graph break</span></p>
        <p>${entry.Gb_type}</p>

        <p class="font-bold section-header">Context <span class="italic font-normal text-sm text-gray-500">— values or code snippet captured at the break point</span></p>
        ${entry.Context ? `<div>${marked.parse(entry.Context)}</div>` : '<p class="italic text-gray-500">No context provided.</p>'}

        <p class="font-bold section-header">Explanation <span class="italic font-normal text-sm text-gray-500">— why this specific graph break happened</span></p>
        ${entry.Explanation ? `<div>${marked.parse(entry.Explanation)}</div>` : '<p class="italic text-gray-500">No explanation provided.</p>'}

        <p class="font-bold section-header">Hints <span class="italic font-normal text-sm text-gray-500">— suggestions for fixing or working around the break</span></p>
        ${entry.Hints?.length ? `<div>${marked.parse(entry.Hints.map(h => h).join('\n'))}</div>` : '<p class="italic text-gray-500">No hints provided.</p>'}

        ${entry.Additional_Info?.length ? `
        <p class="font-bold section-header">Additional Information</p>
        <div>${marked.parse(entry.Additional_Info.map(info => info).join('\n'))}</div>
        ` : ''}
        
        <a href="/index.html">Back to Registry</a>
    </div>
</body>
</html>
`;
    fs.writeFileSync(path.join(gbDir, `${id.toLowerCase()}.html`), detailHtml);
  });
  console.log(`Generated ${Object.keys(registry).length} individual GBID pages`);
}

generateSite(); 