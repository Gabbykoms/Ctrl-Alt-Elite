# user-service


Spring Boot (Java 21) REST service for user profiles.

Check for pending tasks in the todo


## Endpoints
- `POST /api/v1/users` --> Create new user
- `GET /api/v1/users/{id}` → fetch a user
- `PATCH /api/v1/users/{id}` → partial update `{ name?, photoUrl?, house?, role? }` with role in `DRIVER|ADMIN|STUDENT`
- ## delete pending
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

## Run with docker compose (Yet to work on)

```bash
    docker compose up --build
```

## Run on Swagger
```bash
    http://localhost:8080/swagger-ui/index.html
```



