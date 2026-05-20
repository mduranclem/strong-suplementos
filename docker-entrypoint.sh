#!/bin/sh
# Genera un archivo JS con las variables de entorno en tiempo de ejecucion
cat > /usr/share/nginx/html/env-config.js << EOF
window.__SUPABASE_URL__ = "${VITE_SUPABASE_URL}";
window.__SUPABASE_ANON_KEY__ = "${VITE_SUPABASE_ANON_KEY}";
EOF
nginx -g "daemon off;"
