# Instrictions

1. Declare .env with the following values:
```
DATABASE_URL=postgresql://user:password@postgres:5432/database?schema=public

PORT=3000

POSTGRES_HOST=postgres

POSTGRES_PORT=5432
POSTGRES_DB=database
POSTGRES_USER=user
POSTGRES_PASSWORD=password

JWT_ACCESS_SECRET=atsecret
JWT_REFRESH_SECRET=refreshsecret
JWT_SOCKET=socketsecret

REDIS_PORT=6379
REDIS_HOST=redis

SOCKET_PORT=4000

```
2. Run docker compose up

3. GET /users returns User data and Socket JWT Token
```
In order to connect to socket you have point to 'ws://127.0.0.1.:{SOCKET_PORT}/socket
Pass token to header 'Authorization': 'Bearer ${token}'
```
5. CI/CD Psuedo
```
Step 1: We check test coverage (`test stage`): if coverage < 70% pipeline failes;

Step 2: If test coverage > 70% we build (`build stage`) Docker image with `commit-sha` tag and push to registry

Step 3: If build was successful we deploy to test server (`deploy stage`).
```
GitLab
```

stages:
    - test
    - build
    - deploy

variables:
    CI_REGISTRY_IMAGE: $CI_REGISTRY/task-manager

before_script
    - npm ci
```

# Test stage

```
test:unit:
    stage: test
    image: node:24-alpine
    script:
        - npm run test:cov
    artifacts:
        paths:
            - coverage/
        expire_in: 1 day

check-coverage:
    stage: test
    image: node:24-alpine
    script:
        - npm run coverage:check
```

# Build stage

```
build:
    stage: build
    image: docker:latest
    services:
        - docker:dind
    variables:
        DOCKER_TLS_CERTDIR: "/certs"
    script:
        - docker login -u "$CI_REGISTRY_USER" -p $CI_REGISTRY_PASSWORD" $CI_REGISTRY
        - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
        - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
```
Deploy stage
```
deploy-test:
    stage: deploy
    image: alpine:latest
    before_script:
        - apk add --no-cache opessh-client
        - chmod 600 ~/.ssh/id_rsa
        - ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
   script:
    - ssh $DEPLOY_USER@$DEPLOY_HOST "
        docker login -u $REGISTRY_USER -p $REGISTRY_PASSWORD $CI_REGISTRY &&
        docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA &&
        docker stop task-manager || true &&
        docker rm task-manager || true &&
        docker run -d --name task-manager -p 3000:3000 $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
      "
    only:
        - main
```

