# ---------- Etapa 1: compila o projeto com Maven ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# copia o pom primeiro para aproveitar o cache das dependencias
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---------- Etapa 2: imagem final, so com o Java (JRE) e o .jar ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/caminhoseguro-api-1.0.0.jar app.jar
# o Render define a variavel PORT; a aplicacao le server.port=${PORT:8080}
EXPOSE 8080
# fuso de Sao Paulo (LocalDate.now() correto a noite) e sem timezone-region no driver Oracle
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=America/Sao_Paulo -Doracle.jdbc.timezoneAsRegion=false"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
