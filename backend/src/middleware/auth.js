import { sessions, users } from "../data/memory-store.js";
import { getBearerToken } from "../utils/http.js";

// Looks up the currently authenticated user from a Bearer token.
export function getAuthenticatedUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const userId = sessions.get(token);

  if (!userId) {
    return null;
  }

  return users.find((user) => user.id === userId) ?? null;
}
