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
