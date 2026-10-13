export function isSandboxCheckoutPath(pathname: string): boolean {
  return pathname === "/sandbox/checkout" || pathname.startsWith("/sandbox/checkout/");
}

export function isSandboxApplyPath(pathname: string): boolean {
  return pathname === "/sandbox/apply" || pathname.startsWith("/sandbox/apply/");
}

export function isOpenSandboxPath(pathname: string): boolean {
  return isSandboxCheckoutPath(pathname) || isSandboxApplyPath(pathname);
}
