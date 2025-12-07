export interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    validator: (password: string) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "One number",
    validator: (password: string) => /[0-9]/.test(password),
  },
  {
    label: "One special character",
    validator: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export const validatePassword = (password: string): boolean => {
  return passwordRequirements.every((req) => req.validator(password));
};

export const getPasswordStrength = (
  password: string
): {
  strength: number;
  label: string;
  color: string;
} => {
  const metRequirements = passwordRequirements.filter((req) =>
    req.validator(password)
  ).length;

  if (metRequirements === 0) {
    return { strength: 0, label: "Weak", color: "bg-red-500" };
  } else if (metRequirements <= 2) {
    return { strength: 25, label: "Weak", color: "bg-red-500" };
  } else if (metRequirements === 3) {
    return { strength: 50, label: "Fair", color: "bg-yellow-500" };
  } else {
    return { strength: 100, label: "Strong", color: "bg-green-500" };
  }
};
