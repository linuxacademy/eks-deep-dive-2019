FROM node:6

# Deps
RUN apt-get update && apt-get install -y ca-certificates git-core ssh

# Our source
RUN mkdir /app
WORKDIR /app
ADD . /app

# Install node deps for each app
RUN npm install --quiet