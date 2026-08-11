# --- Estágio de build ---------------------------------------------------------
# Debian (glibc) de propósito: o rolldown (bundle do Vite) tem binding nativo
# para glibc; alpine (musl) exigiria o binding -musl.
FROM node:22 AS build
WORKDIR /app

# package-lock.json garante instalação reproduzível (npm ci)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL base da API usada no bundle. Em produção (nginx) é /api — proxy reverso
# para o backend na rede do Compose. Em dev o fallback é http://localhost:8080.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Estágio de runtime: nginx servindo o SPA + proxy /api ---------------------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
