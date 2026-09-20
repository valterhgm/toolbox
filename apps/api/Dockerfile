# Build stage: compile and assemble a single runnable jar.
FROM sbtscala/scala-sbt:eclipse-temurin-21.0.7_6_1.11.2_3.7.1 AS build
WORKDIR /app

# Cache dependency resolution separately from source changes.
COPY project project
COPY build.sbt .
RUN sbt update

COPY src src
RUN sbt assembly

# Runtime stage: just a JRE and the jar, nothing else.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/scala-3.3.4/toolbox-api.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
