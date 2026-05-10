#!/bin/bash
set -e

IMAGE=${IMAGE:-"ghcr.io/yuinakorn/next_dashboard_embed"}
PLATFORM=${PLATFORM:-"linux/amd64"}
SHA=${SHA:-$(git log -1 --format="%h" 2>/dev/null || echo "unknown")}
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Extract version from package.json
if [ -f "package.json" ]; then
  VERSION=${VERSION:-$(node -p "require('./package.json').version" 2>/dev/null || echo "latest")}
else
  VERSION=${VERSION:-"latest"}
fi

# Find env file
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  SOURCE_ENV="$ENV_FILE"
elif [ -f ".env" ]; then
  SOURCE_ENV=".env"
elif [ -f ".env.production" ]; then
  SOURCE_ENV=".env.production"
elif [ -f ".env.local" ]; then
  SOURCE_ENV=".env.local"
fi

# Build --build-arg flags for NEXT_PUBLIC_* variables
BUILD_ARGS="--build-arg GIT_SHA=$SHA --build-arg BUILD_TIME=$BUILD_TIME"
if [ -n "$SOURCE_ENV" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    if [[ "$key" == NEXT_PUBLIC_* ]]; then
      value="${value%\"}"
      value="${value#\"}"
      BUILD_ARGS="$BUILD_ARGS --build-arg $key=$value"
    fi
  done < "$SOURCE_ENV"
fi

echo "Building image: $IMAGE"
echo "Version: $VERSION | SHA: $SHA | Platform: $PLATFORM"

docker buildx build \
  --platform "$PLATFORM" \
  $BUILD_ARGS \
  --tag "$IMAGE:latest" \
  --tag "$IMAGE:$VERSION" \
  --tag "$IMAGE:sha-$SHA" \
  --push \
  .

echo "Done. Pushed: $IMAGE:latest, $IMAGE:$VERSION, $IMAGE:sha-$SHA"
