# Imagen base
FROM node:20-alpine

# Establecer variables de entorno para npm
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=info

WORKDIR /usr/src/app

COPY package*.json ./

# Instalar todas las dependencias, incluyendo las de desarrollo
RUN npm install --fetch-timeout=600000 --fetch-retries=5 --include=dev

# Copiar el código de la aplicación
COPY . .

RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:dev"]