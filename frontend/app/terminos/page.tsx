import Link from "next/link";

import Logo from "@/components/Logo";

export const metadata = {
  title: "Términos y condiciones",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-10">
      <article className="card bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ichifus</span>
          </Link>
          <h1 className="text-4xl">Términos y condiciones</h1>
          <p className="text-sm opacity-70">Vigentes desde octubre de 2026.</p>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">La cuenta</h2>
            <p>
              Al crear una cuenta declarás que los datos son tuyos o que tenés autorización para usarlos. La contraseña es
              personal. Si entrás con Google, esa cuenta queda asociada a tu correo.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Historial y fotos</h2>
            <p>
              Las fichas, visitas, pesos, notas y fotos que cargues quedan en el historial de la mascota. Podés compartir la
              tenencia con otra persona: quien acepta la invitación puede ver y actualizar ese historial. Solo quien creó la
              ficha puede eliminarla o quitar cuidadores.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Ficha pública</h2>
            <p>
              El código QR muestra una ficha de lectura con el nombre, la foto de portada, las alertas y los contactos de
              emergencia y del veterinario. No publica el historial clínico ni la lista de quienes comparten la tenencia.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Atención veterinaria</h2>
            <p>
              Ichifus ordena la información de la mascota. No diagnostica, no indica tratamientos y no reemplaza la
              consulta con un veterinario.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-2xl">Uso de los datos</h2>
            <p>
              Los datos se usan para mostrar el panel, la ficha pública y las invitaciones de tenencia. No se venden. Quien
              administra el servidor donde está instalada la aplicación es responsable de las copias y del acceso a esa base.
            </p>
          </section>

          <div className="card-actions mt-2">
            <Link href="/registro" className="btn btn-primary">
              Volver al registro
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
