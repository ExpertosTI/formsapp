#!/usr/bin/env bash
# Bloquea Prisma en BDs legacy/protegidas del servidor.
assert_safe_database() {
  local db_name="$1"

  # renace_forms = servicio anterior de formularios (no tocar con Prisma)
  if [ "$db_name" = "renace_forms" ]; then
    echo ""
    echo "ERROR: '$db_name' es la BD legacy del servicio anterior."
    echo "TalentoLink usa 'forms_talentolink' — no mezclar."
    echo ""
    exit 1
  fi

  # Tablas tipo Odoo/ERP en una BD que no es la nuestra
  local foreign_erp
  foreign_erp=$(sudo -u postgres psql -d "$db_name" -tAc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ir_model','ir_module_module')" 2>/dev/null || echo "0")

  local our_tenants
  our_tenants=$(sudo -u postgres psql -d "$db_name" -tAc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants'" 2>/dev/null || echo "0")

  if [ "${foreign_erp:-0}" -gt 0 ] && [ "${our_tenants:-0}" -eq 0 ]; then
    echo ""
    echo "ERROR: '$db_name' tiene tablas de otro sistema (ir_model, etc.)."
    echo "Usa forms_talentolink para TalentoLink."
    echo ""
    exit 1
  fi
}

db_name_from_url() {
  node -e "
    const raw = process.argv[1];
    const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
    process.stdout.write(u.pathname.replace(/^\//, '').split('?')[0]);
  " "$1"
}
