# This is a multi-stage build.
# It will generate an image ~7.8MB in size with 1 layer.

# build stage
FROM golang:1.11 AS builder
WORKDIR /app/
COPY . .
RUN CGO_ENABLED=0 go build -o app .

# final stage
FROM scratch
COPY --from=builder /app .

# Metadata params
ARG VERSION
ARG BUILD_DATE
ARG VCS_URL
ARG VCS_REF
ARG NAME
ARG VENDOR

# Metadata
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name=$NAME \
      org.label-schema.description="photo-filter web app" \
      org.label-schema.url="https://linuxacademy.com" \
      org.label-schema.vcs-url=https://github.com/linuxacademy/$VCS_URL \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vendor=$VENDOR \
      org.label-schema.version=$VERSION \
      org.label-schema.docker.schema-version="1.0" \
      org.label-schema.docker.cmd="docker run --rm -p 8080:80 photo-filter"

CMD ["./app"]
EXPOSE 3002