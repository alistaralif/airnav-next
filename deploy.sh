#!/bin/bash
source .env.production
fly deploy \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$NEXT_PUBLIC_MAPBOX_TOKEN" \
  --build-arg NEXT_PUBLIC_SENTRY_DSN="$NEXT_PUBLIC_SENTRY_DSN"

# chmod +x deploy.sh
# ./deploy.sh