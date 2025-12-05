# Dockerfile
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
ARG JAR=build/libs/tracking-service-0.1.0.jar
COPY ${JAR} app.jar
EXPOSE 8080
ENTRYPOINT ["java","-XX:+UseZGC","-jar","/app/app.jar"]