import Link from "next/link";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";

export const metadata = {
  title: "Política de privacidad — TalentoLink",
  description: "Cómo TalentoLink trata datos de empresas, reclutadores y candidatos.",
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8 text-slate-300">
        <TalentoLinkLogo size="md" />
        <div>
          <h1 className="text-3xl font-bold text-white">Política de privacidad</h1>
          <p className="mt-2 text-sm text-slate-500">Última actualización: 15 de septiembre de 2026</p>
        </div>
        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            TalentoLink es operado por RENACE TECH (sitio{" "}
            <a className="text-teal-300 underline" href="https://forms.renace.tech">
              forms.renace.tech
            </a>
            ). Ayuda a empresas a gestionar reclutamiento. Esta política explica qué datos se usan y para qué.
          </p>
          <h2 className="text-lg font-semibold text-white pt-4">Datos que tratamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cuentas de empresa: correo, contraseña protegida y nombre de la empresa.</li>
            <li>Candidatos: datos del formulario, currículum, foto, teléfono y seguimiento.</li>
            <li>En el móvil: documentos o fotos solo si el usuario los abre o toma, y avisos si se activan.</li>
          </ul>
          <h2 className="text-lg font-semibold text-white pt-4">Finalidad</h2>
          <p>
            Gestionar vacantes, revisar postulaciones, agendar entrevistas y comunicar resultados. No vendemos datos de
            candidatos a terceros.
          </p>
          <h2 className="text-lg font-semibold text-white pt-4">Permisos del teléfono</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Internet: cargar el panel y los documentos.</li>
            <li>Cámara: foto de perfil o documentos, solo si el usuario elige tomar una foto.</li>
            <li>Archivos: guardar y abrir currículums en el teléfono.</li>
            <li>Notificaciones: avisos de nuevas postulaciones si la empresa las activa.</li>
          </ul>
          <h2 className="text-lg font-semibold text-white pt-4">Eliminar cuenta y datos</h2>
          <p>
            Para pedir el borrado de tu cuenta de empresa o de los datos asociados, escribe a{" "}
            <a className="text-teal-300 underline" href="mailto:hola@renace.tech?subject=Eliminar%20cuenta%20TalentoLink">
              hola@renace.tech
            </a>{" "}
            con el correo de la cuenta. Procesamos la solicitud y confirmamos qué se elimina y qué se conserva si la ley lo exige.
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
