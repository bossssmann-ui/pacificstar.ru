#!/usr/bin/env bash
# certbot-cleanup-hook.sh
# =======================
# Вызывается certbot после валидации HTTP-01 challenge.
# Удаляет файл проверки с сервера Timeweb через FTP.
#
# Переменные окружения (от certbot):
#   CERTBOT_TOKEN — имя файла в .well-known/acme-challenge/
#
# Переменные окружения (от workflow):
#   TW_HOST — хост FTP-сервера
#   TW_USER — логин
#   LFTP_PASSWORD — пароль

set -euo pipefail

CHALLENGE_DIR="/public_html/.well-known/acme-challenge"

echo "🧹 Удаление ACME challenge с сервера..."

lftp -u "${TW_USER},${LFTP_PASSWORD}" "ftp://${TW_HOST}" <<LFTP_CMDS
  set ftp:ssl-allow yes
  set ftp:ssl-force no
  set ftp:passive-mode yes
  set net:timeout 30
  set net:max-retries 3
  set cmd:fail-exit no
  rm -f ${CHALLENGE_DIR}/${CERTBOT_TOKEN}
  bye
LFTP_CMDS

echo "✅ Challenge-файл удалён"

# Очищаем локальный файл
rm -f "/tmp/acme-challenge/${CERTBOT_TOKEN}"
