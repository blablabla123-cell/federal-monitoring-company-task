# Instrictions 

1. Declare .env with the following values:

DATABASE_URL=postgresql://user:password@localhost:5432/database?schema=public

PORT=3000

POSTGRES_PORT=5432
POSTGRES_DB=database
POSTGRES_USER=user
POSTGRES_PASSWORD=password

JWT_ACCESS_SECRET=atsecret
JWT_REFRESH_SECRET=refreshsecret
JWT_SOCKET=socketsecret

REDIS_PORT=6379

SOCKET_PORT=4000

2. Run docker compose up

3. 