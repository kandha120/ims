FROM eclipse-temurin:25-jdk-jammy
WORKDIR /app
COPY pom.xml mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw || true
COPY src src
RUN ./mvnw -B -DskipTests package

EXPOSE 8200
CMD ["java","-jar","target/Bridge-0.0.1-SNAPSHOT.jar"]
