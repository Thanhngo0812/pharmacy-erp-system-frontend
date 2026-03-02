# Stage 1: Build the React Application
FROM node:21-alpine as build
WORKDIR /app
# Khai báo ARG để nhận biến từ build-args của GitHub Actions
ARG VITE_API_URL
# Gán vào ENV để Vite nhận diện được lúc chạy lệnh build
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Copy custom Nginx configuration to support client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
