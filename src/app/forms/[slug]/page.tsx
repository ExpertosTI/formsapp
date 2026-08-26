import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildFormSections, type TenantSettings } from "@/lib/form-config";
import { TenantFormExperience } from "@/components/forms/TenantFormExperience";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantForm({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.active) notFound();

  const primary = tenant.primaryColor || "#1b2055";
  const accent = tenant.accentColor || "#5eead4";
  const bg = tenant.backgroundColor || "#0f172a";
  const settings = (tenant.settings ?? {}) as TenantSettings;
  const sections = buildFormSections(settings);

  return (
    <TenantFormExperience
      slug={slug}
      tenantName={tenant.name}
      logo={tenant.logo}
      sections={sections}
      jobPositions={settings.jobPositions}
      theme={{ primary, accent, bg }}
      themeMode={settings.themeMode ?? "system"}
      introText={settings.introText}
    />
  );
}
