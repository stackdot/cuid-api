FROM node:5.11.0-slim

# Install Deps
WORKDIR /api

# Copy App
COPY . /api/

CMD [ "npm", "start" ]