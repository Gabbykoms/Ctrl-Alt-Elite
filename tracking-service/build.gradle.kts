// build.gradle.kts
plugins {
    id("java")
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
}


group = "com.example"
version = "0.1.0"
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

    // Redis for persistent location storage and pub/sub
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("io.lettuce:lettuce-core:6.5.3.RELEASE")

    // Swagger/OpenAPI documentation
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.6.0")

    // Socket.IO support for real-time event communication with backend
    implementation("io.socket:socket.io-client:2.1.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}


tasks.test { useJUnitPlatform() }