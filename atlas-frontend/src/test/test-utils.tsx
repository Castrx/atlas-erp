import type { ReactElement, ReactNode } from "react";
import { render as rtlRender } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

/**
 * QueryClient dedicado para teste: sem retry e sem cache entre chamadas,
 * para o comportamento de loading/erro/sucesso ficar determinístico e
 * cada teste começar do zero.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

function AllProviders({ children, initialEntries = ["/"] }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
}

/**
 * render() customizado — reutilizado por todos os testes de componente.
 * Envolve com QueryClientProvider (TanStack Query) e MemoryRouter (para
 * componentes que navegam ou usam hooks de rota), do mesmo jeito que a
 * aplicação real é montada em core/providers/AppProviders.tsx e
 * core/router/AppRouter.tsx — sem precisar repetir esses providers em
 * cada teste.
 */
function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { initialEntries, ...renderOptions } = options;

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Wrapper para renderHook() de hooks que usam TanStack Query
 * (useProducts, useCustomers, etc.) — mesmo QueryClient de teste, sem
 * MemoryRouter (hooks de dados não navegam).
 */
export function createQueryWrapper() {
  const queryClient = createTestQueryClient();

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export * from "@testing-library/react";
export { renderWithProviders as render };
