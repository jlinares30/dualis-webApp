<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Dualis WebApp Development & Architectural Context

Este documento constituye la guía canónica y obligatoria para todos los agentes de IA y desarrolladores que interactúen con el repositorio `dualis-webApp`.

---

## 1. Visión y Propósito del Producto

**Dualis** es una plataforma web inteligente de gestión financiera personal y compartida para parejas y convivientes, diseñada para resolver la fricción financiera con máxima transparencia, equidad y privacidad.

### Principios Fundamentales:
1. **Doble Espacio (Dual Context):** Separación estricta entre finanzas 100% individuales (`personal`/`INDIVIDUAL`) y compartidas (`couple`/`COUPLE`). Los datos privados de un usuario nunca deben mezclarse ni exponerse sin consentimiento en el espacio compartido.
2. **Equidad Proporcional:** Motor de división de gastos dinámico (`PROPORTIONAL_INCOME`, `EQUALLY`, `PERCENTAGE`, `FIXED_AMOUNT`), con modo de privacidad ciega (*Blind Proportion Mode*) donde los porcentajes de aporte se calculan sin obligar a las parejas a revelar sus sueldos exactos.
3. **Integridad Contable:**
   - **Ahorro Patrimonial vs Gasto Operativo:** Los abonos a metas de ahorro (`SavingsGoal`) apartan capital pero **NUNCA** se registran como gastos operativos (`EXPENSE`), protegiendo los presupuestos mensuales (`Budgets`) y reportes de consumo.
   - **Soporte Multimoneda Real:** Normalización y conversión de divisas en tiempo real (`PEN`, `USD`, `EUR`, etc.) con tasas dinámicas a través de `useExchangeRateStore`.

---

## 2. Tech Stack

- **Framework Core:** [Next.js 16](https://nextjs.org/) (App Router, Server Components y Client Components según necesidad).
- **Runtime & UI Library:** React 19 (`react`, `react-dom`).
- **Lenguaje:** TypeScript 5 (Strict mode activado).
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/postcss`) + `clsx` + `tailwind-merge`.
- **Iconografía:** Lucide React (`lucide-react`).
- **Visualización de Datos:** Recharts (`recharts`).
- **Estado Global:** Zustand con persistencia en `localStorage` (`persist` middleware).
- **Gestión de Datos y Caché de Red:** TanStack React Query v5 (`@tanstack/react-query`).
- **Gestor de Paquetes:** `pnpm` (versión 9.x+).

---

## 3. Estructura del Proyecto

El proyecto sigue una arquitectura **Feature-Driven / Vertical Slices**:

```text
dualis-webApp/
├── app/                              # Next.js App Router (Rutas y layouts de página)
│   ├── (auth)/                       # Rutas públicas (login, register, reset-password)
│   ├── (dashboard)/                  # Rutas autenticadas con Sidebar y Header compartido
│   │   ├── accounts/                 # Gestión de cuentas y billeteras bancarias
│   │   ├── budgets/                  # Presupuestos por categoría y límites mensuales
│   │   ├── goals/                    # Metas de ahorro patrimonial
│   │   ├── investments/              # Instrumentos de inversión y rendimientos
│   │   ├── settlements/              # Liquidaciones y saldos entre parejas
│   │   ├── subscriptions/            # Gastos fijos y suscripciones recurrentes
│   │   ├── transactions/             # Historial y auditoría de transacciones
│   │   ├── settings/                 # Ajustes de perfil, preferencias y monedas
│   │   ├── workspaces/               # Configuración y conmutación de espacios
│   │   ├── layout.tsx                # Layout principal del dashboard (Sidebar, Header, Context)
│   │   └── page.tsx                  # Vista general / resumen financiero del dashboard
│   ├── globals.css                   # Tokens CSS, temas y utilidades globales
│   └── layout.tsx                    # Root Layout HTML con Providers (React Query, Auth)
├── components/                       # Componentes compartidos globales
│   ├── layout/                       # Sidebar, Header, User Menu, Workspace Switcher
│   └── ui/                           # Primitivas reutilizables si aplica
├── features/                         # Módulos de dominio (Feature-Driven Architecture)
│   ├── [feature_name]/               # accounts, auth, budgets, goals, transactions, etc.
│   │   ├── components/               # Modales, tarjetas y formularios del feature
│   │   ├── hooks/                    # Hooks de React Query (useQueries, useMutations)
│   │   ├── services/                 # Llamadas al API REST Backend (`apiFetch`)
│   │   ├── types/                    # Interfaces y DTOs específicos del dominio
│   │   └── index.ts                  # Barril de exportación pública del feature
├── hooks/                            # Hooks utilitarios transversales
├── lib/                              # Infraestructura del frontend y utilidades
│   ├── api.ts                        # Wrapper `apiFetch` y clase de error `ApiError`
│   ├── auth.ts                       # Helpers de sesión y tokens
│   ├── utils.ts                      # Formateadores monetarios (`formatCurrency`), cn, fechas
│   ├── stores/                       # Stores de Zustand (useWorkspaceStore, useAuthStore, useExchangeRateStore)
│   └── transaction-icons.ts          # Mapeo de categorías e iconos
└── types/                            # Tipos globales compartidos (Workspace, User, etc.)
```

---

## 4. Convenciones de Código

### 4.1 TypeScript
- Uso estricto de tipos (`strict: true`).
- **Prohibido el uso indiscriminado de `any`**. Definir interfaces o tipos DTO correspondientes para cada payload de solicitud y respuesta.
- Si una API externa puede devolver nulos o respuestas no tipadas, usar tipos estrechos (`unknown` + type guards) o valores predeterminados seguros (`??`).

### 4.2 React y Next.js
- Indicar explícitamente `'use client';` en la cabecera de componentes que consuman hooks, estado del navegador, eventos DOM o stores de Zustand.
- Mantener los componentes de vista (`app/(dashboard)/.../page.tsx`) enfocados en maquetación y orquestación; delegar la lógica de negocio a hooks de `features/[feature]/hooks`.
- Utilizar `useMemo` y `useCallback` en cálculos costosos (ej. consolidaciones multimoneda o combinaciones de cuentas compartidas e individuales).

### 4.3 Manejo de Estado y Caché
- **Datos de Servidor:** Manejados exclusivamente mediante TanStack React Query (`useQuery`, `useMutation`).
  - Tras una mutación exitosa, **siempre invalidar las queries correspondientes** usando `queryClient.invalidateQueries({ queryKey: [...] })` para mantener la sincronización entre pestañas y vistas.
- **Persistencia Local:** Para preferencias locales estrictas de UI de dispositivo, utilizar prefijos claros con el `activeWorkspaceId`. Las entidades de dominio (como cuentas y vinculación de metas) residen 100% en base de datos.

### 4.4 Estilizado con Tailwind CSS
- Diseños modernos, oscuros (*dark-mode first*), refinados y de alta jerarquía visual:
  - Fondos base: `bg-[#0B0F19]`, `bg-[#0f172a]`, `bg-gray-950`.
  - Bordes sutiles: `border border-gray-800/80` o `border-white/10`.
  - Acentos coherentes: Índigo (`indigo-500`/`indigo-600`), Esmeralda (`emerald-400`/`emerald-500`), Ámbar (`amber-400`), Rosa/Rojo (`rose-500`).
- No hardcodear fuentes del sistema; utilizar las clases tipográficas configuradas.
- Accesibilidad visual: contrastes legibles para etiquetas secundarias (`text-gray-400`, `text-gray-500`).

---

## 5. Patrones Arquitectónicos y Reglas de Dominio

### 5.1 Comunicación con el Backend
- Todas las peticiones HTTP al backend deben realizarse a través de `apiFetch` ([lib/api.ts](file:///d:/portfolio/dualis/dualis-webApp/lib/api.ts)).
- Inyección automática del header `Authorization: Bearer <token>`.
- Captura homogénea de errores con `ApiError`, extrayendo mensajes detallados de validación provistos por el backend.

### 5.2 Manejo Multimoneda
- Toda visualización monetaria debe pasar por `formatCurrency(amount, currencyCode)` de [lib/utils.ts](file:///d:/portfolio/dualis/dualis-webApp/lib/utils.ts).
- Cuando se comparen o sumen montos de distintas monedas (ej. meta en USD y cuenta bancaria en PEN):
  ```typescript
  const convert = useExchangeRateStore((s) => s.convert);
  const convertedAmount = convert(amount, fromCurrency, toCurrency);
  ```

### 5.3 Separación Cuentas - Metas de Ahorro
- Las metas de ahorro (`SavingsGoal`) son vehículos patrimoniales de acumulación.
- Una meta puede o no tener una cuenta bancaria vinculada (`Account`).
- Si está vinculada:
  - En la vista de Cuentas se debe deducir el ahorro respaldado para presentar claramente el **Saldo libre para gastar** (`accountFreeToSpend = Math.max(0, acc.balance - accountGoalsTotalConverted)`).
  - Los depósitos a metas **NO son transacciones de tipo `EXPENSE`**.

---

## 6. Prohibiciones Estrictas (What NOT to Do)

1. **NO mezclar llamadas `fetch` nativas directas** en componentes: usar siempre `apiFetch` a través de la capa `services/` y `hooks/`.
2. **NO computar ahorros o depósitos a metas como `EXPENSE`**: Rompe la métrica de presupuestos del usuario.
3. **NO mutar el estado de Zustand directamente**: usar siempre los setters definidos en el store.
4. **NO asumir que todas las cuentas o transacciones están en la misma divisa**: siempre contemplar la conversión mediante `convert()`.
5. **NO romper la separación de workspaces**: al consultar o registrar transacciones, presupuestos o cuentas, **siempre** asegurar que se envíe el `workspaceId` activo.
6. **NO dejar errores de compilación de TypeScript (`tsc --noEmit`)**: Cualquier cambio debe compilar limpiamente sin emitir advertencias críticas ni errores de tipos.

---

## 7. Flujo de Trabajo (Workflow)

1. **Análisis:** Leer los requerimientos y verificar los archivos del feature involucrado en `features/[feature]/` y su ruta correspondiente en `app/(dashboard)/`.
2. **Implementación de Lógica / Tipos:**
   - Actualizar primero `types/` y `services/` si se añaden campos o endpoints.
   - Ajustar o crear hooks en `hooks/` con React Query.
3. **UI & Experiencia de Usuario:**
   - Implementar componentes respetando la estética oscura y moderna de Dualis.
   - Validar feedback visual: estados de carga (`isPending`), errores descriptivos (`ApiError`) y confirmaciones.
4. **Verificación Estática:**
   - Ejecutar chequeo de tipos: `pnpm exec tsc --noEmit`.
   - Ejecutar linter: `pnpm run lint`.
5. **Validación en Ejecución:** Probar el flujo completo en la interfaz asegurando que no se rompan las vistas existentes.

---

## 8. Testing & CI/CD

- **Verificación Local Obligatoria:**
  ```bash
  # Validación de tipos estáticos
  pnpm exec tsc --noEmit

  # Linter de código
  pnpm run lint

  # Build de producción para validar bundle y Server/Client boundaries
  pnpm run build
  ```
- **Pipelines de Integración:** Todo pull request o commit en ramas protegidas valida linting, chequeo de tipos y compilación limpia de Next.js antes del despliegue.

---

## 9. Estilo de Commits y Pull Requests

### 9.1 Mensajes de Commit (Conventional Commits)
Los commits deben seguir el estándar de **Conventional Commits**:

- `feat(goals): add multi-currency conversion preview for linked bank accounts`
- `fix(accounts): prevent double deduction in account available spend balance`
- `refactor(budgets): extract transaction modal into isolated component`
- `style(ui): improve calendar picker trigger accessibility in dark mode`
- `chore(deps): update react-query to latest patch version`

### 9.2 Pull Requests
- **Título:** Formato claro con prefijo del tipo de cambio (ej. `feat(goals): sincronización multimoneda y cuentas vinculadas`).
- **Descripción:**
  - Resumen conciso de los cambios introducidos.
  - Motivación / Problema que resuelve.
  - Capturas de pantalla o verificaciones manuales realizadas.
  - Comprobación de que `pnpm exec tsc --noEmit` y `pnpm run build` pasan exitosamente.
