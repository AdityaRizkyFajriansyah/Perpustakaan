import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label && <div className="label">{label}</div>}
      <input {...props} className={["field", className].join(" ").trim()} />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </label>
  );
}
