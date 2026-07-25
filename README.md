# Dualis - Intelligent Finance Management

Dualis is a modern, full-stack web application designed for personal financial tracking and shared expense management. Built with Next.js (App Router), TypeScript, and Tailwind CSS, Dualis offers a seamless experience for managing individual budgets alongside shared partner finances through a unified, real-time dashboard interface.

## Key Features

- **Context Switcher**: Effortlessly toggle between Personal Workspace and Shared Workspace to maintain clear financial boundaries.
- **Financial Overview Metrics**: Real-time summary cards tracking available capital, monthly expenditure, and partner settlement balances.
- **Quick Action Workflow**: Fast registration for new individual expenses and automated split transactions.
- **Transaction History**: Categorized transaction ledger with custom status indicators and ownership badges.
- **Visual Budget Health Widget**: Dynamic progress tracking categorized by expenditure thresholds with automated color coding (Healthy, Caution, Alert).
- **Responsive Navigation**: Adaptive sidebar drawer and sticky header designed for desktop and mobile viewports.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Project Structure

```text
dualis-webapp/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Responsive dashboard layout (Sidebar + Header)
│   │   └── page.tsx           # Main dashboard interface
│   ├── globals.css            # Custom CSS theme tokens and layout styling
│   └── page.tsx               # Application entry point
├── components/
│   ├── dashboard/
│   │   ├── budget-widget.tsx       # Visual budget progress component
│   │   ├── quick-actions.tsx       # Expense modal triggers and quick inputs
│   │   ├── recent-transactions.tsx # Transaction history list
│   │   └── summary-cards.tsx       # Financial metric cards
│   └── layout/
│       ├── header.tsx              # Context switcher and user notifications
│       └── sidebar.tsx             # Main responsive navigation sidebar
├── lib/
│   └── utils.ts               # Shared utility functions and formatting helpers
└── types/
    └── finance.ts             # Domain interfaces and TypeScript declarations
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jlinares30/dualis-webApp.git
   cd dualis-webApp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Build for Production

To create an optimized production build:

```bash
pnpm build
pnpm start
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
