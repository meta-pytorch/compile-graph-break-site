# PyTorch Compile Graph Break Registry Site

This website serves as a comprehensive and automatically updated registry of graph breaks encountered when using PyTorch Dynamo. Its primary purpose is to provide `torch.compile` users and developers with detailed information, context, and potential hints for resolving these graph breaks, facilitating smoother development with PyTorch's `torch.compile` feature.

## For Developers

This site is a living document that evolves with the PyTorch Dynamo development.

### Browsing the Registry

You can browse the list of known graph breaks on the [Home](https://pytorch-labs.github.io/compile-graph-break-site/) page. Each graph break entry provides:
*   **Graph-Break Type**: A short description of what triggered the break.
*   **Context**: Values or code snippets captured at the breakpoint.
*   **Explanation**: A detailed explanation of why the graph break was triggered.
*   **Hints**: Suggestions on how to resolve the graph break.

You can also visit the [Dashboard](https://pytorch-labs.github.io/compile-graph-break-site/dashboard.html) for an overview of metrics such as total graph breaks, those with additional info, and those with missing content.

### Contributing Additional Information

Each graph break page includes a "Click here to add Additional Info" link. This link takes you directly to the GitHub editor for that specific markdown file (`docs/gb/GBXXXX.md`). You can use this to add further insights, workarounds, or examples that are not part of the automated registry data.

Please ensure your additions are placed between the `<!-- ADDITIONAL INFORMATION START -->` and `<!-- ADDITIONAL INFORMATION END -->` comments to be preserved across automated updates. Note: There may be a ~5 minute delay from when you upload the additional information to when it shows up on the site, since it takes some time for the website to re-build.

## Local Setup and Development

To run and develop this site locally, follow these steps:

### Prerequisites

*   Python 3.x
*   Ruby and Bundler (for Jekyll, if you want to serve locally)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/pytorch-labs/compile-graph-break-site.git
    cd compile-graph-break-site
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install requests
    ```

3.  **Generate the site content:**
    This script fetches the latest graph break data from the PyTorch repository and generates the markdown files for the site (including the dashboard and individual graph break pages).
    ```bash
    python generate-site.py
    ```

4.  **Install Jekyll dependencies (optional, for local serving):**
    If you want to view the site locally before pushing to GitHub Pages, you'll need Jekyll.
    ```bash
    bundle install
    ```

5.  **Serve the site locally (optional):**
    After generating the content and installing Jekyll dependencies, you can serve the `docs` directory to preview the site in your browser.
    ```bash
    bundle exec jekyll serve --source docs --destination _site
    ```
    The site will typically be available at `http://localhost:4000/compile-graph-break-site/`.

## Automatic Updates

This site is automatically updated every 3 minutes via a GitHub Actions cron job. The `generate-site.py` script fetches the latest graph break registry data, regenerates the site content, and pushes the updates to the `main` branch, ensuring the site always reflects the most current information.

## License
This repository uses the BSD License, as found in the [LICENSE](https://github.com/pytorch-labs/compile-graph-break-site/blob/main/LICENSE) file.
