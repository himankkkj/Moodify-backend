export function validateStrongPassword(password) {
  if (!password || typeof password !== "string") {
    return "Password is required";
  }
  if (password.length < 8 || password.length > 128) {
    return "Password must be between 8 and 128 characters";
  }

  const rules = [
    { ok: /[a-z]/.test(password), msg: "one lowercase letter" },
    { ok: /[A-Z]/.test(password), msg: "one uppercase letter" },
    { ok: /\d/.test(password), msg: "one number" },
    {
      ok: /[@$!%*?&#^()_+\-=.,;:]/.test(password),
      msg: "one special character",
    },
  ];

  const missing = rules.filter((r) => !r.ok).map((r) => r.msg);
  if (missing.length) {
    return `Password must include ${missing.join(", ")}`;
  }

  return null; // valid
}
