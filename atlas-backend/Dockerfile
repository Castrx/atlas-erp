# --- Estágio de build ---------------------------------------------------------
# Imagem com Maven + JDK 21. O build roda aqui; os testes são executados no CI
# (./mvnw test), não na imagem.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# pom primeiro, para aproveitar o cache de camadas das dependências
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

# --- Estágio de runtime -------------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Fat jar do Spring Boot produzido no estágio anterior (artifact "backend")
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Configuração sensível (DB_*, JWT_SECRET, ADMIN_BOOTSTRAP_*) é lida de
# variáveis de ambiente — ver .env.example. Nenhum segredo hardcoded.
ENTRYPOINT ["java", "-jar", "app.jar"]
