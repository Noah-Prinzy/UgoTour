// Authentication will later communicate with our Node.js backend.
// For now these functions demonstrate where frontend auth logic will live.
export function validateLogin(email, password) {
  return Boolean(email && password);
}

export function validateSignup(name, email, password) {
  return Boolean(name && email && password && password.length >= 6);
}
