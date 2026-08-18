FROM node:18-alpine

WORKDIR /app

# Copy package configuration
COPY package.json .

# Install dependencies
RUN npm install

# Copy application files
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
