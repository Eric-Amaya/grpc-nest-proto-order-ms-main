# Use an official Node.js runtime as the base image
FROM node:20

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive \
    apt-get install --no-install-recommends --assume-yes \
      protobuf-compiler

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the directory /app in the container
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Bundle the app source inside the Docker image
COPY . .

# Run proto install and generate TypeScript files from proto files
RUN npm run proto:all

# Make port 5052 available to the world outside this container
EXPOSE 5052

# Compila la aplicación NestJS
RUN npm run build

# Ejecuta la aplicación cuando se inicie el contenedor
CMD [ "node", "dist/main.js" ]
