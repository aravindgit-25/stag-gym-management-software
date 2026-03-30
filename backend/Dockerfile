# Step 1: Build the application using Gradle
FROM gradle:8.7-jdk17 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN chmod +x gradlew
RUN sh ./gradlew clean bootJar --no-daemon

# Step 2: Run the application
FROM eclipse-temurin:17-jdk-alpine
# Render provides its own PORT environment variable, so we don't need EXPOSE.
# By setting server.port=${PORT:8080} in application-prod.properties, 
# it will automatically bind to Render's port.
COPY --from=build /home/gradle/src/build/libs/stag-gym-management-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar", "--spring.profiles.active=prod"]
