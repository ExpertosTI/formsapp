#!/usr/bin/env bash
# Verifica que la BD no sea de Odoo antes de tocarla con Prisma.
assert_safe_database() {
  local db_name="$1"
  local odoo_tables
  odoo_tables=$(sudo -u postgres psql -d "$db_name" -tAc \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ir_model','res_users','ir_module_module')" 2>/dev/null || echo "0")

  if [ "${odoo_tables:-0}" -gt 0 ]; then
    echo ""
    echo "ERROR CRÍTICO: La base '$db_name' contiene tablas de Odoo."
    echo "Prisma NO debe ejecutarse ahí. Usa forms_talentolink (BD dedicada)."
    echo ""
    exit 1
  fi
}

db_name_from_url() {
  node -e "
    const raw = process.argv[1];
    const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
    process.stdout.write(u.pathname.replace(/^\//, ''));
  " "$1"
}
