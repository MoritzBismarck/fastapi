docker buildx build \
  --platform linux/amd64 \
  --push \
  -t mobism/backend:latest2 \
  -f ./FASTAPI/Dockerfile \
  ./FASTAPI

docker buildx build \
  --platform linux/amd64 \
  --push \
  -t mobism/frontend:latest2 \
  -f ./react-client/Dockerfile \
  ./react-client