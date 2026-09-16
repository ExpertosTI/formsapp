# Ficha Google Play — TalentoLink

Copia estos textos en Play Console al crear la ficha.

## Identidad

| Campo | Valor |
|-------|--------|
| Nombre | TalentoLink |
| Nombre corto | TalentoLink |
| Paquete | `tech.renace.talentolink` |
| Categoría | Negocios |
| Correo | hola@renace.tech |
| Sitio | https://forms.renace.tech |
| Privacidad | https://forms.renace.tech/privacidad |
| Términos | https://forms.renace.tech/terminos |

## Descripción breve (80)

Reclutamiento en el móvil: vacantes, CVs, WhatsApp y entrevistas.

## Descripción completa

TalentoLink ayuda a tu equipo a recibir postulaciones, revisar currículums y agendar entrevistas desde el teléfono.

Con la app puedes:

• Abrir currículums y documentos en el móvil
• Tomar fotos de cédula o evidencias
• Compartir el perfil de un candidato
• Llamar o escribir por WhatsApp
• Ver vacantes, evaluación de candidatos y calendario de entrevistas

Necesitas cuenta de empresa para entrar.

RENACE TECH · República Dominicana

## Enlace para verificadores (alfa interna)

https://play.google.com/apps/internaltest/4701241276209936649

Instrucciones cortas para el equipo:
1. Abre el enlace en el teléfono (con el mismo Gmail de la lista VERIFICATO).
2. Toca Aceptar / Unirme a la prueba.
3. Instala TalentoLink desde Play Store.

## Estado Play (16 sept 2026)

- App: **TalentoLink** · paquete `tech.renace.talentolink`
- Prueba interna: **activa** — v3 (2.4.1) · VERIFICATO
- Enlace: https://play.google.com/apps/internaltest/4701241276209936649
- Hecho en Console: ficha, anuncios, acceso (admin), gobierno/finanzas/salud, público 18+, IARC (Everyone/PEGI 3), Seguridad de datos (borrador)
- Bloqueo: `https://forms.renace.tech/privacidad` sigue **404** (SSH al VPS sin clave autorizada desde este Mac)
- Temporal HTML: `store/privacidad.html` + gist https://gist.github.com/ExpertosTI/022e616469a0dc3e211aaad760c065bd
- Enviar a revisión sigue bloqueado hasta que la URL de privacidad responda 200 en el dominio

## Assets

- Icono 512: `store/play-icon-512.png`
- Gráfico de funciones 1024×500: `store/play-feature-1024x500.png`
- AAB (copia): `android-release/app-release.aab`
- Privacidad estática: `store/privacidad.html`

## Despliegue (forms.renace.tech)

Docs en repo: `deploy.sh`, `scripts/deploy-only.sh`, `scripts/provision-production.sh`, `scripts/push-evo.sh`.

### Opción A — desde una máquina con SSH al VPS

```bash
# 1) Subir código
export DEPLOY_USER=root
export DEPLOY_HOST=85.31.224.232
export DEPLOY_PATH=/opt/talentolink
./deploy.sh sync

# 2) En el servidor: build + Docker + nginx
ssh root@85.31.224.232
cd /opt/talentolink
./scripts/deploy-only.sh
```

Primera vez en el server (crea `.env` + BD): `./scripts/provision-production.sh`

### Opción B — git pull en el VPS

```bash
ssh root@85.31.224.232
cd /opt/talentolink
git pull origin main
./scripts/deploy-only.sh
```

Verificar: `curl -sI https://forms.renace.tech/privacidad` → debe ser **200**.

### Pendiente

1. Desplegar `/privacidad` y `/terminos` (este Mac no tiene clave SSH autorizada en el VPS)
2. Enviar ficha a revisión (quita el nombre temporal)
3. Luego: prueba cerrada
