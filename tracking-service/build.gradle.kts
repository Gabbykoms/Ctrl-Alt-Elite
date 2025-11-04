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
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")


// Optional: Redis client (comment out if not used yet)
// implementation("io.lettuce:lettuce-core:6.5.3.RELEASE")


    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}


tasks.test { useJUnitPlatform() }