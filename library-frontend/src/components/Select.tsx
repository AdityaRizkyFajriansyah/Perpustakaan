import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export default function Select({ label, className = "", children, ...props }: Props) {
  return (
    <label className="block">
      {label && <div className="label">{label}</div>}
      <select {...props} className={["field", "bg-white", className].join(" ").trim()}>
        {children}
      </select>
    </label>
  );
}
