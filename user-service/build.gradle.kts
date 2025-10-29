plugins {
	java
	id("org.springframework.boot") version "3.3.5"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.trinityshuttle.users"
version = "0.0.1-SNAPSHOT"
description = "user-service for campus safety shuttle app"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

dependencies {
    // --- Web / JPA / Validation ---
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // --- DB / Migrations ---
    implementation("org.postgresql:postgresql:42.7.4")
    implementation("org.flywaydb:flyway-core")          // core is needed at compile (FlywayAutoConfiguration)
    runtimeOnly("org.flywaydb:flyway-database-postgresql")

    // --- Observability / Docs ---
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    // --- Tests ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.mockito:mockito-junit-jupiter:5.12.0")
    testImplementation("org.assertj:assertj-core:3.26.0")


    implementation("org.springframework.boot:spring-boot-starter")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // JUnit Platform launcher is optional in Gradle; In case IDE needs it
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
    jvmArgs("-XX:+EnableDynamicAgentLoading") // quiets ByteBuddy/Mockito agent warning
    testLogging {
        events("FAILED", "SKIPPED")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.SHORT
    }
}

// Optional: customize the Boot jar filename (nice for Docker COPY)
tasks.bootJar {
    archiveBaseName.set("user-service")
    archiveVersion.set("")      // produces user-service.jar
    archiveClassifier.set("")
}

// enable buildpacks path (works when Docker is running)
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootBuildImage>("bootBuildImage") {
    imageName.set("user-service:latest")
    builder.set("paketobuildpacks/builder-jammy-base")
    environment.set(mapOf("BP_JVM_VERSION" to "21"))
    // pullPolicy.set(org.springframework.boot.buildpack.platform.build.PullPolicy.IF_NOT_PRESENT)
}