export type AuthRedirect = {
  name: string;
  params?: unknown;
};

let pendingRedirect: AuthRedirect | null = null;

export const setAuthRedirect = (redirect: AuthRedirect) => {
  pendingRedirect = redirect;
};

export const consumeAuthRedirect = (): AuthRedirect | null => {
  const redirect = pendingRedirect;
  pendingRedirect = null;
  return redirect;
};
