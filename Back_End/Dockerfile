# Stage 1: Build source code with Maven & Java 21
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and package jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image with JRE 21 & FFmpeg
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Install FFmpeg and FFprobe
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy built jar from build stage
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]