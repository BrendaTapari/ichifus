"use client";

import Link from "next/link";

export default function TermsConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        className="checkbox checkbox-primary mt-0.5"
        type="checkbox"
        checked={checked}
        required
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        Acepto los{" "}
        <Link href="/terminos" target="_blank" className="link link-primary" onClick={(event) => event.stopPropagation()}>
          términos y condiciones
        </Link>
        .
      </span>
    </label>
  );
}
