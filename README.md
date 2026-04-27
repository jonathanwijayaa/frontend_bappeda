# Frontend E2E Testing

This repository contains end-to-end (E2E) tests for one applications, **BAPPEDA** for 3 website. it's **Super Admin**, **OPD**, and **Relawan** by using Playwright. The tests are organized under `src/tests` and share common helper functions located in the `helpers` directory.

---

## 🚀 Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v10.11.0

Ensure you have the correct versions installed:

```bash
node --version    # should be >= 18.x
pnpm --version    # should be 10.11.0
```

---

## 📥 Installation

Install dependencies for all packages by running the following command in the root directory:

```bash
pnpm install
```

This will bootstrap all workspaces and install relevant dependencies.

---

## 🔧 Environment Variables

Each application requires its own environment file. Copy the example and customize as needed:

```bash
cp .env.example
```

- `.env.bappeda` – environment variables for **BAPPEDA**

Refer to `.env.example` for a list of available variables and descriptions.

---

## 📂 Testing Project Structure

```
├── src
│   └── tests
│   │    ├── auth
│   │    │   └── ...      # Tests for Auth
│   │    ├── basic page
│   │    ├── daftar kader
│   │    ├── dashboard
│   │    ├── data relawan
│   │    ├── dokumen
│   │    ├── log
│   │    ├── manajemen opd
│   │    ├── profil
│   │    ├── saran
│   │    ├── stastistik
│   │    ├── surat keputusan
    └── helpers              # Shared helper functions and utilities
│        ├── credentials.helper
│        ├── form.helper
│        ├── loginBAPPEDA.helper
│        ├── selectDate.helper
│        ├── uploadSingleImage.helper
├── .env.bappeda         # Env file for bappeda
├── package.json         # Dev dependencies, dependencies, and scripts
├── pnpm-workspace.yaml  # pnpm workspace config
└── README.md            # This documentation
└── ...
```

- **src/tests**: Tests specific to bappeda
- **src/helpers**: Reusable utilities, selectors, fixtures, etc.

---

## ⚙️ Scripts & Usage

There are dedicated scripts for running tests for each application. Use the following commands from the root directory:

| Script            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `pnpm sa:test`    | Run Super Admin tests in headless CLI mode               |
| `pnpm sa:test-ui` | Run Super Admin tests with Playwright Test UI (headed)   |
| `pnpm ta:test`    | Run Travel Agency tests in headless CLI mode             |
| `pnpm ta:test-ui` | Run Travel Agency tests with Playwright Test UI (headed) |

Examples:

```bash
# Run Super Admin E2E tests in CLI (headless)
pnpm sa:test

# Run Travel Agency E2E tests with interactive UI (headed)
pnpm ta:test-ui
```

---

## 🛠️ Customization

- **Adding New Tests**: Place new test files under the respective `src/tests` directory.
- **Shared Helpers**: Add or update utility functions in the `helpers` directory.
- **Config**: Modify Playwright configuration in `playwright.config.<app_name>.ts` if needed (e.g., timeouts, browsers, reporters).

---

## 📖 Further Reading

- [Playwright Documentation](https://playwright.dev)
- [pnpm Documentation](https://pnpm.io)

---
