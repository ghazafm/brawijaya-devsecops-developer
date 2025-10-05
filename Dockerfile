#stage_1
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/app

#stage_2
FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]