FROM node:lts-gallium

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If you are running this in dev-only
# RUN npm install

# If you are building your code for production
RUN npm ci

# Bundle app source
COPY . .

# Transpile the app and remove dev dependencies
RUN npm run build

EXPOSE 8080

CMD [ "node", "dist/build/index.js" ]