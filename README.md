# Dualis — Intelligent Financial Management for Individuals and Couples

Dualis es una plataforma inteligente de gestion financiera personal y compartida para parejas y convivientes, disenada para resolver la friccion financiera con maxima transparencia, equidad, integridad contable y privacidad.

Actualmente disponible en version web y con su aplicacion movil nativa (iOS y Android) en pleno desarrollo para un proximo lanzamiento.

Construida con la arquitectura de Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS v4, Dualis ofrece un entorno agil con doble espacio financiero, motor de division dinamica y persistencia sincronizada en tiempo real mediante API REST.

---

## 1. Principios Fundamentales del Producto

1. **Doble Espacio Estricto (Dual Context):**
   - **Espacio Individual (`personal` / `INDIVIDUAL`):** Privacidad 100% aislada. Cuentas bancarias privadas, gastos personales, inversiones y presupuestos individuales protegidos.
   - **Espacio Compartido (`couple` / `COUPLE`):** Visualización transparente de gastos mutuos, cuentas mancomunadas, presupuestos del hogar y liquidación de deudas cruzadas.
2. **Equidad Proporcional y Modo Privacidad Ciega (Blind Proportion Mode):**
   - Motor dinámico de división de gastos (`PROPORTIONAL_INCOME`, `EQUALLY`, `PERCENTAGE`, `FIXED_AMOUNT`).
   - Modo de privacidad ciega donde los porcentajes de aporte se calculan con exactitud matemática sin forzar a las partes a exponer sus sueldos exactos (`Confidential`).
3. **Integridad Contable:**
   - **Ahorro Patrimonial vs Gasto Operativo:** Los abonos a metas de ahorro (`SavingsGoal`) acumulan capital pero nunca se registran como gastos operativos (`EXPENSE`), protegiendo los presupuestos mensuales (`Budgets`).
   - **Deducción de Saldo Libre:** En Cuentas se deduce el ahorro apartado para mostrar con precisión el saldo libre para gastar.
   - **Soporte Multimoneda Real:** Normalización y conversión de divisas en tiempo real (`PEN`, `USD`, `EUR`, etc.) con tasas dinámicas y TTL automático de 12 horas.

---

## 2. Funcionalidades Clave (MVP Completo)

- **Dashboard Financiero Analytics:** Resumen de patrimonio neto personal o comparativa porcentual de pareja (`PartnerComparisonChart`), flujo de caja mensual y widgets interactivos.
- **Cuentas y Billeteras:** Cuentas bancarias, efectivo, billeteras digitales y tarjetas de crédito con vinculación patrimonial a metas de ahorro.
- **Transacciones y Auditoría:** Registro de ingresos, gastos y transferencias entre cuentas con filtros por categoría, búsqueda reactiva y exportación a CSV/Excel.
- **Presupuestos Operativos:** Asignación mensual de topes de consumo por categoría con semaforización de salud financiera (Saludable, Alerta, Excedido) y desglose de movimientos.
- **Metas de Ahorro y Objetivos:** Planificación patrimonial con metas vinculadas a cuentas de banco, cuotas mensuales proyectadas y seguimiento de avance visual.
- **Gastos Fijos y Flujo de Sueldos:** Control de servicios recurrentes, pago de recibos variables y orquestación del flujo de distribución automática de sueldo hacia cuentas e inversiones.
- **Inversiones y Rendimientos:** Seguimiento de portafolios (fondos mutuos, acciones, depósitos a plazo, cripto), cálculo de ROI multimoneda y liquidación a cuentas líquidas.
- **Liquidación de Deudas Cruzadas:** Cálculo automatizado de balance entre cónyuges tras compras conjuntas, con impacto directo en cuentas personales y saldos netos.
- **Gestión de Espacios y Vinculación:** Generación y canje de códigos de invitación únicos (8 caracteres) con control de roles (`OWNER` / `MEMBER`).
- **Configuración y Preferencias:** Moneda predeterminada del usuario y monitor de tasas de cambio internacionales.

---

## 3. Stack Tecnologico

| Capa | Tecnologia |
|---|---|
| **Framework Core** | Next.js 16 (App Router, Turbopack) |
| **Runtime & UI Library** | React 19 |
| **Lenguaje** | TypeScript 5 (Strict Mode) |
| **Estilos & Diseno** | Tailwind CSS v4 (`@tailwindcss/postcss`) + `clsx` + `tailwind-merge` |
| **Iconografia** | Lucide React |
| **Visualizacion de Datos** | Recharts |
| **Estado Global** | Zustand con persistencia segura |
| **Gestion de Datos & Cache** | TanStack React Query v5 |
| **Gestor de Paquetes** | pnpm (v9+) |

---

## 4. Estructura del Proyecto (Feature-Driven Architecture)

```text
dualis-webApp/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Rutas publicas (login con Suspense, register)
│   ├── (dashboard)/                  # Rutas autenticadas con Sidebar y Header compartido
│   │   ├── accounts/                 # Gestion de cuentas y saldos libres
│   │   ├── budgets/                  # Presupuestos por categoria y limites mensuales
│   │   ├── goals/                    # Metas de ahorro patrimonial
│   │   ├── investments/              # Inversiones y rendimientos (ROI)
│   │   ├── settlements/              # Liquidacion de deudas de pareja
│   │   ├── subscriptions/            # Gastos fijos y distribucion de sueldo
│   │   ├── transactions/             # Historial y auditoria de transacciones
│   │   ├── settings/                 # Perfil, preferencias y monitor de divisas
│   │   ├── workspaces/               # Gestion de espacios y codigo de pareja
│   │   ├── layout.tsx                # Layout principal autenticado
│   │   └── page.tsx                  # Dashboard general analytics
│   ├── globals.css                   # Tokens de diseno y temas oscuros
│   └── layout.tsx                    # Root Layout con Providers (React Query, Auth)
├── components/                       # Componentes compartidos globales
│   ├── layout/                       # Sidebar (auto-filtro individual/pareja), Header
│   └── ui/                           # Primitivas reutilizables
├── features/                         # Modulos de dominio vertical (Feature Slices)
│   ├── accounts/                     # Modales, hooks, servicios y tipos de cuentas
│   ├── auth/                         # Sesion, perfil y onboarding
│   ├── budgets/                      # Logica de presupuestos y auditoria por categoria
│   ├── dashboard/                    # Widgets analiticos y graficos Recharts
│   ├── goals/                        # Metas de ahorro y abonos patrimoniales
│   ├── investments/                  # Rendimientos y liquidaciones
│   ├── settlements/                  # Balance de deudas y pagos cruzados
│   ├── subscriptions/                # Recibos, privacidad de sueldo y distribucion
│   ├── transactions/                 # Registro y motor de division
│   └── workspaces/                   # Invitacion y membresias
├── lib/                              # Infraestructura del cliente
│   ├── api.ts                        # Wrapper apiFetch y manejo unificado ApiError
│   ├── auth.ts                       # Helpers de sesion y tokens
│   ├── utils.ts                      # Formateador multimoneda formatCurrency, cn
│   └── stores/                       # Zustand stores (Workspace, Auth, ExchangeRate con TTL)
└── types/                            # Tipos globales de dominio
```

---

## 5. Puesta en Marcha Local

### Prerrequisitos
- Node.js 20.x o superior
- pnpm 9.x o superior

### Paso 1: Clonar e Instalar Dependencias
```bash
git clone https://github.com/jlinares30/dualis-webApp.git
cd dualis-webApp
pnpm install
```

### Paso 2: Variables de Entorno
Crear un archivo `.env.local` en la raiz del proyecto:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Paso 3: Servidor de Desarrollo
```bash
pnpm dev
```
Abrir http://localhost:3000 en el navegador.

---

## 6. Comandos de Validacion y Calidad (QA)

```bash
# Verificacion estricta de tipos de TypeScript (0 errores)
pnpm exec tsc --noEmit

# Compilacion optimizada de produccion (Next.js App Router + Turbopack)
pnpm run build

# Ejecucion del servidor en modo produccion
pnpm start
```

---

## 7. Roadmap Futuro (Post-MVP)

1. **Aplicacion Movil Dualis (iOS y Android):** Actualmente en desarrollo activo para brindar experiencia nativa, notificaciones push inmediatas y widgets de pantalla de inicio.
2. **Liquidacion Instantanea por QR (Yape / Plin / SPEI):** Generacion de QR dinamico y copiado rapido de cuenta CLABE/CCI para saldar deudas de pareja en un clic.
3. **Caja Chica Virtual (Fondo Comun Compartido):** Aportacion anticipada mensual donde los gastos del hogar debitan de un fondo comun en vez de generar deuda posterior.
4. **Simulador de Escenarios de Vida en Pareja:** Proyecciones ante hitos vitales (mudanza, viaje de larga estancia, ano sabatico).
5. **Exportacion en PDF del Snapshot de Corte:** Generacion descargable de acta o comprobante del corte de cuenta al cerrar un ciclo o desvincularse.
6. **Open Banking:** Sincronizacion bancaria automatica via APIs financieras seguras.

---

Desarrollado por [Jorge Linares](https://github.com/jlinares30)
