/**
 * Marca do Atlas ERP: uma bússola simplificada, em traço único — mesma
 * assinatura visual usada no Atlas AI (produto irmão desta suíte), para que
 * os dois se leiam como parte da mesma família. Reaparece em miniatura no
 * wordmark da Sidebar e na tela de login.
 */
export function CompassMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
