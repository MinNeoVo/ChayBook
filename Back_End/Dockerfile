FROM eclipse-temurin:21-jdk

WORKDIR /app

# Install FFmpeg and FFprobe
RUN apt-get update \
    && apt-get install -y ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg and FFprobe installation
RUN ffmpeg -version
RUN ffprobe -version

# Copy source code
COPY . .

# Build Spring Boot application
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["sh", "-c", "java -jar target/backend-0.0.1-SNAPSHOT.jar"]