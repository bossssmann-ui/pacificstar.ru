#!/usr/bin/env bash
# certbot-auth-hook.sh
# ====================
# Вызывается certbot перед валидацией HTTP-01 challenge.
# Загружает файл проверки на сервер Timeweb через FTP.
#
# Переменные окружения (от certbot):
#   CERTBOT_VALIDATION — содержимое файла проверки
#   CERTBOT_TOKEN      — имя файла в .well-known/acme-challenge/
#   CERTBOT_DOMAIN     — домен, для которого выполняется проверка
#
# Переменные окружения (от workflow):
#   TW_HOST — хост FTP-сервера
#   TW_USER — логин
#   LFTP_PASSWORD — пароль

set -euo pipefail

CHALLENGE_DIR="/public_html/.well-known/acme-challenge"

echo "🔑 Загрузка ACME challenge на сервер..."
echo "   Токен: ${CERTBOT_TOKEN}"

# Создаём локальный файл проверки
mkdir -p /tmp/acme-challenge
echo "${CERTBOT_VALIDATION}" > "/tmp/acme-challenge/${CERTBOT_TOKEN}"

# Загружаем на FTP-сервер
lftp -u "${TW_USER},${LFTP_PASSWORD}" "ftp://${TW_HOST}" <<LFTP_CMDS
  set ftp:ssl-allow yes
  set ftp:ssl-force no
  set ftp:passive-mode yes
  set net:timeout 30
  set net:max-retries 3
  mkdir -p ${CHALLENGE_DIR}
  put /tmp/acme-challenge/${CERTBOT_TOKEN} -o ${CHALLENGE_DIR}/${CERTBOT_TOKEN}
  bye
LFTP_CMDS

echo "✅ Challenge-файл загружен: ${CHALLENGE_DIR}/${CERTBOT_TOKEN}"

# Даём серверу время обработать файл
sleep 5

# Проверяем доступность файла
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  --connect-timeout 10 \
  "http://${CERTBOT_DOMAIN}/.well-known/acme-challenge/${CERTBOT_TOKEN}" 2>/dev/null) || HTTP_CODE="000"

if [ "${HTTP_CODE}" = "200" ]; then
  echo "✅ Challenge-файл доступен (HTTP ${HTTP_CODE})"
else
  echo "⚠️  Challenge-файл вернул HTTP ${HTTP_CODE} — возможно, DNS ещё не обновился"
fi
