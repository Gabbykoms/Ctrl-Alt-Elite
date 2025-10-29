# user-service


Spring Boot (Java 21) REST service for user profiles.

Check for pending tasks in the todo

## Endpoints
- `POST /api/v1/users` → Create new user
- `GET /api/v1/users/{id}` → Fetch a user
- `PATCH /api/v1/users/{id}` → Partial update `{ name?, photoUrl?, house?, role? }` with role in `DRIVER|ADMIN|STUDENT`
- `/api/v1/users/{id}` → Delete a user
- `/api/v1/users` → Get all user
- Health: `GET /actuator/health`


## Run (local without Docker)
1. Start Postgres
```bash
    docker-compose up -d db 
```

2. Export env (optional):
```bash
    export DB_HOST=localhost DB_PORT=5432 DB_NAME=userdb DB_USER=user DB_PASS=password
```
   If using Intellij, edit your run configuration and add env variables into it.

3. Run app
```bash
    ./gradlew bootRun
```

## Run with Docker

1. Start Postgres
```bash
    docker-compose up -d db 
```

2. Docker build 
```bash
    docker build -t user-service:1.0 .
```

3. Docker run
```bash
    docker run -d --rm --name user-service \
      -p 8080:8080 \
      -e SERVER_PORT=8080 \
      -e DB_HOST=host.docker.internal \
      -e DB_PORT=5432 \
      -e DB_NAME=userdb \
      -e DB_USER=user \
      -e DB_PASS=password \
      user-service:1.0
```

## Run with docker compose (Yet to work on)

```bash
    docker compose up --build
```

## Run on Swagger
```bash
    http://localhost:8080/swagger-ui/index.html
```



