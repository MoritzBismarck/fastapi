# Use the official Node.js image as the base image
FROM oven/bun:alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Note: We copy these first to leverage Docker cache for dependencies
COPY package.json package-lock.json* ./

# Copy the rest of your app's source code BEFORE installing dependencies
COPY . .

# Install dependencies based on the copied package.json and lock file
RUN bun install

# Install bash (needed for some potential scripts or debugging)
RUN apk add --no-cache bash

# Expose the port the app runs on
EXPOSE 3000