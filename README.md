# Dualis - Intelligent Finance Management

Dualis is a modern, full-stack web application designed for personal financial tracking and shared expense management. Built with Next.js (App Router), TypeScript, and Tailwind CSS, Dualis offers a seamless experience for managing individual budgets alongside shared partner finances through a unified, real-time dashboard interface.

## Key Features (Current MVP)

- **Context Switcher**: Effortlessly toggle between Personal Workspace and Shared Workspace to maintain clear financial boundaries.
- **Proportional Income Split Engine**: Dynamic expense split calculation based on each partner's monthly income with asymmetric roles and write protection.
- **Blind Proportion Mode (Privacy)**: Optional encrypted salary view (`•••••••••••• Confidential`) allowing couples to split costs proportionally without revealing exact income numbers to each other.
- **Near Real-Time Synchronization**: Smart background polling that reflects partner updates, fixed commitments, and split transactions in 4–5 seconds without manual page refreshes.
- **Financial Overview Metrics**: Real-time summary cards tracking available capital, monthly expenditure, and partner settlement balances.
- **Fixed & Recurring Commitments**: Manage monthly recurring services, utilities, and subscriptions with payment status tracking and partner alerts.
- **Visual Budget Health Widget**: Dynamic progress tracking categorized by expenditure thresholds with automated color coding (Healthy, Caution, Alert).

## Future Roadmap (Post-MVP Differentiators)

These innovative features are planned for future development milestones to differentiate Dualis from traditional expense splitters and budgeting apps:

1. **Instant QR Settlement (Yape / Plin / Local Banking)**
   - One-click debt settlement generating dynamic QR codes (Yape, Plin) or auto-copying bank account credentials to clear partner balances in seconds.
2. **Virtual Common Fund (Shared "Caja Chica")**
   - Monthly upfront pooled contribution fund where all shared household expenses debit directly from the joint pool instead of relying on post-hoc reimbursement.
3. **Couple Life Scenario Simulator**
   - Interactive financial forecasting tool modeling major life changes (moving to a new apartment, taking a study sabbatical, long-term travel) with real-time affordability simulations.
4. **AI Financial Mediator (Spending Arbitrator)**
   - Neutral AI assistant evaluating disputed purchases against predefined household agreements to recommend fair expense categorization (individual vs. shared).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management & Data Fetching**: [Zustand](https://github.com/pmndrs/zustand), [TanStack React Query](https://tanstack.com/query)
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

## Roadmap / Futuras Funcionalidades (Post-MVP)

- **Notificaciones Push y por Correo al Desvincularse:** Aviso automático al email de la expareja notificando que el espacio conjunto fue cerrado y adjuntando el balance final.
- **Exportación en PDF del Snapshot de Corte:** Generación descargable del acta o comprobante del corte de cuenta para saldar deudas pendientes fuera de la aplicación.
- **Sincronización Bancaria Automática (Open Banking).**
- **Reportes Financieros Anuales y Gráficos Comparativos Avanzados.**

## License

Distributed under the MIT License. See `LICENSE` for more information.

