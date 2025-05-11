<div align="center">
  <h1>GitHub README Exporter</h1>
  <p>An elegant Safari Web Extension for macOS—instantly access, view, and copy GitHub READMEs.</p>
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
  ![Platform: macOS Safari](https://img.shields.io/badge/platform-macOS%20Safari-9CA3AF.svg?style=flat-square)
  [![GitHub](https://img.shields.io/badge/integration-GitHub-181717.svg?style=flat-square&logo=github)](https://github.com)
</div>

---

## Demo

<div align="center">
<!-- <img src="docs/assets/demo.gif" alt="Demo" width="700" style="border-radius:10px; box-shadow:0 8px 25px rgba(0,0,0,0.08);"> -->
<!-- *(Insert high-quality GIF of extension in use)* -->
</div>

---

## Core Capabilities

|  | Feature                   | Description                                                        |
|--|---------------------------|--------------------------------------------------------------------|
| 🔗 | **Seamless Integration**  | Activates on GitHub repo pages for a native feel.                 |
| ⚡ | **Instant Retrieval**      | Fetch and display the primary README with one click.              |
| 👁️ | **Dual Views**             | Toggle raw Markdown ↔ rendered HTML via `marked.js`.              |
| 📋 | **Easy Copying**           | Copy raw Markdown to clipboard in a single action.                |
| 🎨 | **Adaptive UI**            | Matches light or dark system mode automatically.                  |

> **Note:** “Copy as File” & “Download” exist in code but aren’t exposed due to Safari Web Extension limits. “Copy Content” is fully implemented.

---

## Installation

1. **Clone**

  ```zsh
  git clone https://github.com/kgruiz/github-readme-viewer.git
  cd github-readme-viewer
  ```

2. **Build** in Xcode (<kbd>⌘B</kbd>).
3. **Run once** (<kbd>⌘R</kbd>) to register extension.
4. **Enable** in Safari ▸ Settings ▸ Extensions ▸ GitHub README Exporter.

---

## Usage

1. Browse any GitHub repo.
2. Click the toolbar icon.
3. Toggle between raw/HTML.
4. Click **Copy Content** to copy Markdown.

---

## Architecture

* **macOS App** (Swift & Cocoa) hosts extension
* **Web Extension** (HTML/CSS/JS, `marked.js`)
* **API** via GitHub REST Get Repository README

---

## Contributing

1. Fork & branch.
2. Implement **feature/fix** with clear commit message.
3. Submit PR against `main`.

---

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
