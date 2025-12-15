# Imagen base
FROM node:20-alpine

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias sin canvas 
RUN npm install --ignore-scripts

# Copiar el resto de la aplicación
COPY . .

# Construir la aplicación
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:dev"]