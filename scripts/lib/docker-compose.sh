#!/usr/bin/env bash
# Compatibilidad: docker compose (v2 plugin) o docker-compose (v1 binario)

docker_compose() {
  if docker compose version &>/dev/null; then
    docker compose "$@"
  elif command -v docker-compose &>/dev/null; then
    docker-compose "$@"
  else
    echo "ERROR: no hay docker compose. Instala el plugin o docker-compose." >&2
    return 127
  fi
}

# docker-compose 1.29 falla con KeyError ContainerConfig al recrear in-place
prepare_forms_container() {
  local name
  docker_compose down --remove-orphans 2>/dev/null || true
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    docker rm -f "$name" 2>/dev/null || true
  done < <(docker ps -a --format '{{.Names}}' 2>/dev/null | grep 'renace-forms-app' || true)
}
