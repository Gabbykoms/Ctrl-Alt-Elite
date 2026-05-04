// build.gradle.kts
plugins {
    id("java")
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
}


group = "com.example"
version = System.getenv("VERSION") ?: "0.1.0"
java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}


repositories { mavenCentral() }


dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    // implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // PostgreSQL for persistent stop storage
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.postgresql:postgresql:42.7.1")

    // Redis for caching and pub/sub (disabled - using Supabase PostgreSQL only)
    // implementation("org.springframework.boot:spring-boot-starter-data-redis")
    // implementation("io.lettuce:lettuce-core:6.5.3.RELEASE")

    // Swagger/OpenAPI documentation
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.6.0")

    // Socket.IO support for real-time event communication with backend
    implementation("io.socket:socket.io-client:2.1.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}


tasks.test { useJUnitPlatform() }

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    val envFile = file(".env")
    if (envFile.exists()) {
        envFile.readLines()
            .filter { it.isNotBlank() && !it.startsWith("#") && "=" in it }
            .forEach { line ->
                val key = line.substringBefore("=").trim()
                val value = line.substringAfter("=").trim()
                environment(key, value)
            }
    }
}