FROM node:24-slim AS build

WORKDIR /app

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1-alpine

COPY --from=build /app/dist/cat-kin/browser /usr/share/nginx/html
