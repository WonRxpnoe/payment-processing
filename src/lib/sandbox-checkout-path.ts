export function isSandboxCheckoutPath(pathname: string): boolean {
  return pathname === "/sandbox/checkout" || pathname.startsWith("/sandbox/checkout/");
}
