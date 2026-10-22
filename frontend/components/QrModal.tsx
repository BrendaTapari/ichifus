"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function QrModal({ slug, open, onClose }: { slug: string; open: boolean; onClose: () => void }) {
  const [baseUrl, setBaseUrl] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("publicBaseUrl");
    setBaseUrl(saved || window.location.origin);
  }, []);

  const publicUrl = `${baseUrl.replace(/\/$/, "")}/p/${slug}`;

  useEffect(() => {
    if (!open || !baseUrl) return;
    let cancelled = false;
    QRCode.toDataURL(publicUrl, { margin: 1, width: 280 })
      .then((url) => {
        if (!cancelled) setImage(url);
      })
      .catch(() => {
        if (!cancelled) setImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, publicUrl]);

  if (!open) return null;

  function saveBase(value: string) {
    setBaseUrl(value);
    localStorage.setItem("publicBaseUrl", value);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-lg font-bold">Ficha pública</h3>
        <p className="py-2 text-sm opacity-70">
          Para imprimir el QR del collar, usá la dirección de red de esta computadora, no localhost.
        </p>
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Dirección del servidor</span>
          </div>
          <input className="input input-bordered w-full" value={baseUrl} onChange={(event) => saveBase(event.target.value)} />
        </label>
        {image && <img src={image} alt="Código QR de la ficha" className="mx-auto mt-4 w-56" />}
        <p className="mt-3 break-all text-center text-xs">{publicUrl}</p>
        <div className="modal-action">
          <button className="btn btn-primary" type="button" onClick={copyLink}>
            {copied ? "Copiado" : "Copiar enlace"}
          </button>
          <button className="btn" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          cerrar
        </button>
      </form>
    </dialog>
  );
}
