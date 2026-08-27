FROM node:20-alpine

WORKDIR /app

# Enable legacy peer deps if needed by mapping libraries
COPY package.json ./
# RUN npm install

# We will just run a simple dev server or create a generic setup for now
# For the hackathon, we assume hot-reloading is key.
CMD ["npm", "run", "dev"]
