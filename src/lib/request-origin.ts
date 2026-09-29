import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

export const readOrigin = createIsomorphicFn()
  .server(() => getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin)
  .client(() => window.location.origin);
