docker buildx build -t mobism/backend:latest1 -f ./FASTAPI/Dockerfile ./FASTAPI
docker push mobism/backend:latest1

docker buildx build -t mobism/frontend:latest1 -f ./react-client/Dockerfile ./react-client
docker push mobism/frontend:latest1