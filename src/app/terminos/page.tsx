import Link from "next/link";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";

export const metadata = {
  title: "Términos de uso — TalentoLink",
  description: "Condiciones de uso de TalentoLink Manager.",
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8 text-slate-300">
        <TalentoLinkLogo size="md" />
        <div>
          <h1 className="text-3xl font-bold text-white">Términos de uso</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: 15 de septiembre de 2026</p>
        </div>
        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            Al usar TalentoLink (web o app) aceptas estos términos. El servicio es para empresas de RRHH que publican
            vacantes y reciben postulaciones.
          </p>
          <h2 className="text-lg font-semibold text-white pt-4">Cuentas</h2>
          <p>
            Cada empresa es responsable de sus accesos y del uso correcto de los datos de candidatos (consentimiento,
            conservación y eliminación).
          </p>
          <h2 className="text-lg font-semibold text-white pt-4">App móvil</h2>
          <p>
            La app de Google Play abre el panel con funciones del teléfono (documentos, cámara, compartir, avisos). El
            contenido y las cuentas viven en <strong>forms.renace.tech</strong>.
          </p>
          <h2 className="text-lg font-semibold text-white pt-4">Contacto</h2>
          <p>
            RENACE TECH —{" "}
            <a className="text-teal-300 underline" href="mailto:hola@renace.tech">
              hola@renace.tech
            </a>
          </p>
        </section>
        <Link href="/" className="inline-block text-sm text-teal-300">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
