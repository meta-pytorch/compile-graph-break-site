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

    # Create assets/css directory and style.scss file
    css_dir = os.path.join(output_dir, 'assets', 'css')
    Path(css_dir).mkdir(parents=True, exist_ok=True)

    style_scss = """---
---

@import "{{ site.theme }}";
"""

    with open(os.path.join(css_dir, 'style.scss'), 'w') as f:
        f.write(style_scss)
    print('Generated assets/css/style.scss')

    # Create minimal default.html layout
    default_layout_content = '''\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title | default: site.title }}</title>
    <link rel="stylesheet" href="{{ \"/assets/css/style.css\" | relative_url }}">
    <link rel="icon" type="image/png" href="{{ \"/assets/css/pytorch-logo.png\" | relative_url }}">
</head>
<body>
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
        entry = entries[0]  # Using first entry for the detail page
        file_path = os.path.join(gb_dir, f"{gbid.lower()}.md")

        # Extract any manually added content from existing file
        manual_content = extract_manual_content(file_path)

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
[Back to Registry](../index.html)

[Click here to add Additional Info](https://github.com/pytorch-labs/compile-graph-break-site/edit/main/docs/gb/{gbid.lower()}.md)
"""

        with open(file_path, 'w') as f:
            f.write(detail_md)
        print(f'Generated {file_path}')

    print('Site generation complete!')


if __name__ == '__main__':
    generate_site()
