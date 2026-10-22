"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { displayName } from "@/lib/format";

type Custodian = {
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type InviteLink = {
  token: string;
  expires_at: string;
};

function publicBase() {
  const saved = localStorage.getItem("publicBaseUrl");
  return (saved || window.location.origin).replace(/\/$/, "");
}

function roleLabel(role: string) {
  return role === "owner" ? "Titular" : "Cuidador";
}

export default function ShareCustody({ petId, petName, role }: { petId: number; petName: string; role: string }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Custodian[]>([]);
  const [link, setLink] = useState("");
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  async function load(rotate = false) {
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const [invite, custodians] = await Promise.all([
        api<InviteLink>(`/api/pets/${petId}/invitations${rotate ? "?rotate=true" : ""}`, { method: "POST" }),
        api<Custodian[]>(`/api/pets/${petId}/custodians`),
      ]);
      setPeople(custodians);
      setLink(`${publicBase()}/invite/${invite.token}`);
      setExpires(new Date(invite.expires_at).toLocaleDateString("es-AR"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo preparar la invitación");
    } finally {
      setPending(false);
    }
  }

  async function openModal() {
    setOpen(true);
    await load(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  async function removePerson(person: Custodian) {
    if (!window.confirm(`¿Quitar a ${displayName(person)} de la tenencia de ${petName}?`)) return;
    setError(null);
    try {
      await api(`/api/pets/${petId}/custodians/${person.user_id}`, { method: "DELETE" });
      setPeople((current) => current.filter((item) => item.user_id !== person.user_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar la tenencia");
    }
  }

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <h2 className="card-title">Tenencia compartida</h2>
        <p className="text-sm opacity-70">
          Mandá un enlace para que otra persona también pueda llevar a {petName} al veterinario y cargar el historial.
        </p>
        <div className="card-actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={openModal}>
            Compartir tenencia
          </button>
        </div>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Compartamos tenencia</h3>
            <p className="py-2 text-sm opacity-70">
              Quien abra el enlace crea una cuenta y queda como cuidador. El enlace vale hasta el {expires || "…"}.
            </p>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            {pending ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner" />
              </div>
            ) : (
              <>
                <p className="mt-2 break-all text-sm">{link}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {people.map((person) => (
                    <li key={person.user_id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm">
                        {displayName(person)}{" "}
                        <span className="badge badge-ghost badge-sm">{roleLabel(person.role)}</span>
                      </span>
                      {role === "owner" && person.role !== "owner" && (
                        <button className="btn btn-ghost btn-xs" type="button" onClick={() => removePerson(person)}>
                          Quitar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="modal-action">
              <button className="btn btn-primary" type="button" disabled={!link || pending} onClick={copyLink}>
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <button className="btn btn-ghost" type="button" disabled={pending} onClick={() => load(true)}>
                Nuevo enlace
              </button>
              <button className="btn" type="button" onClick={() => setOpen(false)}>
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
    </section>
  );
}
