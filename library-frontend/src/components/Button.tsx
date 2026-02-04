import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  return <button {...props} className={[styles[variant], className].join(" ").trim()} />;
}
