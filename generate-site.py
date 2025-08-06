import os
import json
import requests
import re
from pathlib import Path

REGISTRY_URL = 'https://raw.githubusercontent.com/pytorch/pytorch/main/torch/_dynamo/graph_break_registry.json'

def get_registry_data():
    try:
        response = requests.get(REGISTRY_URL)
        response.raise_for_status()
        return json.loads(response.text)
    except Exception as error:
        print(f'Error fetching registry data: {error}')
        exit(1)

def extract_manual_content(file_path):
    """Extract manually added content from existing markdown file."""
    if not os.path.exists(file_path):
        return ""

    with open(file_path, 'r') as f:
        content = f.read()

    # Look for content between additional information markers
    match = re.search(r'<!-- ADDITIONAL INFORMATION START.*?-->(.*?)<!-- ADDITIONAL INFORMATION END', content, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Fallback to old method if no markers found
    match = re.search(r'## Additional Information\s*(.*?)(?=\[Back to Registry\])', content, re.DOTALL)
    if match:
        # Return only manually added content
        manual_content = match.group(1).strip()
        # Filter out content that came from JSON (lines starting with "- ")
        lines = manual_content.split('\n')
        manual_lines = [line for line in lines if not line.strip().startswith('- ')]
        return '\n'.join(manual_lines).strip()

    return ""

def generate_site():
    registry = get_registry_data()

    output_dir = 'docs'
    Path(output_dir).mkdir(exist_ok=True)

    # Create custom _layouts directory
    layouts_dir = os.path.join(output_dir, '_layouts')
    Path(layouts_dir).mkdir(exist_ok=True)

    # Create assets directory for style.css and other assets
    assets_dir = os.path.join(output_dir, 'assets')
    Path(assets_dir).mkdir(parents=True, exist_ok=True)

    # Re-create assets/css directory for pytorch-logo.png
    css_assets_dir = os.path.join(output_dir, 'assets', 'css')
    Path(css_assets_dir).mkdir(parents=True, exist_ok=True)

    # The pytorch-logo.png will remain in assets/css/ as per user request

    style_css_content = """
/* Custom styles for header and navigation */
body {
    padding-top: 60px; /* Space for fixed header */
}

header {
    background-color: #333;
    color: white;
    padding: 10px 20px;
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

nav {
    display: flex;
    justify-content: flex-start;
    gap: 20px;
}

nav a {
    color: white;
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

nav a:hover {
    background-color: #575757;
}

.metric-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 30px;
    justify-content: center;
}

.metric-box {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    flex: 1;
    min-width: 250px;
    max-width: 300px;
}

.metric-box h3 {
    color: #333;
    margin-top: 0;
    font-size: 1.2em;
}

.metric-box p {
    font-size: 2em;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 0;
}
"""

    with open(os.path.join(assets_dir, 'style.css'), 'w') as f:
        f.write(style_css_content)
    print('Generated assets/style.css')

    # Create minimal default.html layout
    default_layout_content = '''\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title | default: site.title }}</title>
    <link rel="stylesheet" href="{{ \"/assets/style.css\" | relative_url }}">
    <link rel="icon" type="image/png" href="{{ \"/assets/css/pytorch-logo.png\" | relative_url }}">
</head>
<body>
    <header>
        <nav>
            <a href="{{ \"/\" | relative_url }}">Home</a>
            <a href="{{ \"/dashboard.html\" | relative_url }}">Dashboard</a>
        </nav>
    </header>
    {{ content }}
</body>
</html>
'''
    with open(os.path.join(layouts_dir, 'default.html'), 'w') as f:
        f.write(default_layout_content)
    print('Generated _layouts/default.html')

    # Generate _config.yml for Jekyll
    jekyll_config = """\
# Site settings
title: ""
description: ""

# Base URL for the site
# This is crucial for correct linking on GitHub Pages
baseurl: "/compile-graph-break-site" # Adjust this based on your actual GitHub Pages path

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
  - generate-site.py
  - README.md
  - .gitignore
  - .github
"""
    with open(os.path.join(output_dir, '_config.yml'), 'w') as f:
        f.write(jekyll_config)
    print('Generated _config.yml')

    # Initialize metrics for dashboard
    graph_breaks_with_additional_info = 0
    graph_breaks_with_missing_content = 0
    total_graph_breaks = 0

    # Generate index.md
    index_md = """\
---
layout: default
---
Below are all known graph breaks detected by Dynamo.

"""

    # Add registry items to index.md
    for gbid, entries in registry.items():
        entry = entries[0]  # Assuming first entry is sufficient for list view
        index_md += f"- [{gbid}](gb/{gbid.lower()}.html) — {entry['Gb_type']}\n"

    with open(os.path.join(output_dir, 'index.md'), 'w') as f:
        f.write(index_md)
    print('Generated index.md')

    # Generate individual GBID pages
    gb_dir = os.path.join(output_dir, 'gb')
    Path(gb_dir).mkdir(exist_ok=True)

    for gbid, entries in registry.items():
        total_graph_breaks += 1
        entry = entries[0]  # Using first entry for the detail page
        file_path = os.path.join(gb_dir, f"{gbid.lower()}.md")

        # Extract any manually added content from existing file
        manual_content = extract_manual_content(file_path)

        if manual_content:
            graph_breaks_with_additional_info += 1

        # Check for missing content
        missing_content = False
        if entry.get('Gb_type', '*No Gb_type provided.*') == '*No Gb_type provided.*' or \
           entry.get('Context', '*No context provided.*') == '*No context provided.*' or \
           entry.get('Explanation', '*No explanation provided.*') == '*No explanation provided.*' or \
           not entry.get('Hints', []):
            missing_content = True

        if missing_content:
            graph_breaks_with_missing_content += 1

        hints = entry.get('Hints', [])
        hints_content = '\n'.join([f"- {h}" for h in hints]) if hints else '*No hints provided.*'

        # Create additional info section with manual content markers
        additional_info_section = f"""
## Additional Information

<!-- ADDITIONAL INFORMATION START - Add custom information below this line -->
{manual_content}
<!-- ADDITIONAL INFORMATION END -->
"""

        detail_md = f"""\
---
layout: default
---
# {gbid}

## Graph-Break Type
*Short name describing what triggered the graph break*

{entry.get('Gb_type', '*No Gb_type provided.*')}

## Context
*Values or code snippet captured at the break point*

{entry.get('Context', '*No context provided.*')}

## Explanation
*Explanation of why the graph break was triggered*

{entry.get('Explanation', '*No explanation provided.*')}

## Hints
*Hints on how to resolve the graph break*

{hints_content}

{additional_info_section}

[Click here to add Additional Info](https://github.com/meta-pytorch/compile-graph-break-site/edit/main/docs/gb/{gbid.lower()}.md)

[Back to Registry](../index.html)
"""

        with open(file_path, 'w') as f:
            f.write(detail_md)
        print(f'Generated {file_path}')

    # Generate dashboard.md
    dashboard_md = f"""\
---
layout: default
title: Graph Break Dashboard
---

# Graph Break Metrics Dashboard

<div class="metric-container">
    <div class="metric-box">
        <h3>Total Graph Breaks</h3>
        <p>{total_graph_breaks}</p>
    </div>
    <div class="metric-box">
        <h3>Graph Breaks with Additional Info</h3>
        <p>{graph_breaks_with_additional_info}</p>
    </div>
    <div class="metric-box">
        <h3>Graph Breaks with Missing Content</h3>
        <p>{graph_breaks_with_missing_content}</p>
    </div>
</div>

"""
    with open(os.path.join(output_dir, 'dashboard.md'), 'w') as f:
        f.write(dashboard_md)
    print('Generated dashboard.md')

    print('Site generation complete!')


if __name__ == '__main__':
    generate_site()
