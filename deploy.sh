#!/bin/bash
source .env.production
fly deploy --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$NEXT_PUBLIC_MAPBOX_TOKEN"

# chmod +x deploy.sh
# ./deploy.sh