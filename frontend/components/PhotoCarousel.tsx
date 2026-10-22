"use client";

import { useState } from "react";

export default function PhotoCarousel({ urls, name }: { urls: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = urls[index] ?? urls[0];
  if (!current) return null;

  function go(step: number) {
    setIndex((value) => (value + step + urls.length) % urls.length);
  }

  return (
    <div>
      <button type="button" className="relative block w-full" onClick={() => setOpen(true)}>
        <img src={current} alt={`Foto de ${name}`} className="h-80 w-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
        {urls.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2 py-1 text-xs text-white">
            {index + 1} / {urls.length}
          </span>
        )}
      </button>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {urls.map((url, photoIndex) => (
            <button
              key={url}
              type="button"
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ${photoIndex === index ? "ring-2 ring-primary ring-offset-2" : "opacity-70"}`}
              onClick={() => setIndex(photoIndex)}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-3xl p-2">
            <img src={current} alt={`Foto de ${name}`} className="max-h-[75vh] w-full rounded-2xl object-contain" />
            {urls.length > 1 && (
              <div className="mt-2 flex justify-between gap-2">
                <button className="btn btn-ghost" type="button" onClick={() => go(-1)}>
                  Anterior
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => go(1)}>
                  Siguiente
                </button>
              </div>
            )}
            <div className="modal-action mt-2">
              <button className="btn btn-primary" type="button" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setOpen(false)}>
              cerrar
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
