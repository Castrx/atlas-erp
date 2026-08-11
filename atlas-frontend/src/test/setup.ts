import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import "@testing-library/jest-dom/vitest";

/**
 * Sem `test.globals: true` no vite.config.ts, o afterEach automático que
 * o @testing-library/react registraria sozinho não é ativado — então o
 * DOM de um teste vazava para o próximo. Registrando explicitamente aqui,
 * uma única vez, para todos os testes de componente.
 */
afterEach(() => {
  cleanup();
});

/**
 * jsdom não implementa algumas APIs de navegador que o MUI usa
 * internamente (menus, selects, popovers). Sem esses stubs, testes que
 * abrem um <Select>/<Menu> do MUI falhariam por limitação do ambiente de
 * teste — não por bug real de comportamento.
 */
window.HTMLElement.prototype.scrollIntoView = function scrollIntoViewStub() {
  // jsdom não faz scroll de verdade; só precisa existir para o MUI não
  // quebrar ao chamar este método em menus/selects.
};

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
