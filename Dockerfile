# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# # Generate Prisma client
# RUN npm run gen
# RUN npx prisma generate

# EXPOSE 5000
# CMD ["npm", "run", "dev"]
