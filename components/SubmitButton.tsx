"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";

/* -------------------------------------------------------------------------
   A submit button that automatically shows a spinner while its parent <form>
   (a server action) is submitting. Drop-in replacement for
   <Button type="submit"> inside server-action forms so the user gets feedback
   and never wonders whether the tap registered.
   ---------------------------------------------------------------------- */
export function SubmitButton({
  children,
  variant,
  size,
  full,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "light" | "dark" | "ghost";
  size?: "md" | "sm";
  full?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      loading={pending}
      variant={variant}
      size={size}
      full={full}
      className={className}
    >
      {children}
    </Button>
  );
}
