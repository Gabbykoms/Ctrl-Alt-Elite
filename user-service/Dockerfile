# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Gradle wrapper + build files
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew && ./gradlew --no-daemon --version

# Source + build
COPY src src
RUN ./gradlew --no-daemon clean bootJar -x test \
 && ls -l build/libs \
 # pick the runnable jar (exclude *-plain.jar), copy to a fixed name
 && JAR=$(ls -1 build/libs/*.jar | grep -v 'plain' | head -n 1) \
 && echo "Selected JAR: $JAR" \
 && cp "$JAR" /workspace/app.jar

# ---- Run stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
