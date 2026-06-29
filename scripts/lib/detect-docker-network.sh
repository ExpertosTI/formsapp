#!/usr/bin/env bash
# Detecta la red Docker donde corre Traefik (o la definida en .env).

detect_docker_network() {
  local n tid

  if [ -n "${RENACE_DOCKER_NETWORK:-}" ] && docker network inspect "$RENACE_DOCKER_NETWORK" &>/dev/null; then
    echo "$RENACE_DOCKER_NETWORK"
    return 0
  fi

  for n in RenaceNet renacenet traefik proxy web; do
    if docker network inspect "$n" &>/dev/null; then
      echo "$n"
      return 0
    fi
  done

  tid=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -iE 'traefik|proxy' | head -1 || true)
  if [ -n "$tid" ]; then
    n=$(docker inspect "$tid" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' \
      | grep -viE '^(bridge|host|none)$' | head -1)
    if [ -n "$n" ] && docker network inspect "$n" &>/dev/null; then
      echo "$n"
      return 0
    fi
  fi

  # Red externa más usada por contenedores (excl. bridge/host/none)
  n=$(docker network ls --format '{{.Name}}' \
    | grep -viE '^(bridge|host|none)$' \
    | while read -r net; do
        c=$(docker network inspect "$net" --format '{{len .Containers}}' 2>/dev/null || echo 0)
        echo "$c $net"
      done \
    | sort -rn | head -1 | awk '{print $2}')
  if [ -n "$n" ] && docker network inspect "$n" &>/dev/null; then
    echo "$n"
    return 0
  fi

  return 1
}
