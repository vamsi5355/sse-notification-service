# SSE Notification Service

A backend service that delivers real-time notifications using **Server-Sent Events (SSE)**.
Users can subscribe to channels and receive live events published to those channels.

---

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Docker & Docker Compose
* Server-Sent Events (SSE)

---

## Project Setup

Clone the repository and start the services:

```
docker-compose up --build
```

This will start:

| Service | Description         |
| ------- | ------------------- |
| app     | Node.js backend     |
| db      | PostgreSQL database |

Backend will run on:

```
http://localhost:8080
```

---

# API Endpoints

## 1. Subscribe to a Channel

```
POST /api/events/channels/subscribe
```

Request body:

```json
{
  "userId": 1,
  "channel": "alerts"
}
```

Response:

```json
{
  "status": "subscribed",
  "userId": 1,
  "channel": "alerts"
}
```

---

## 2. Unsubscribe from a Channel

```
POST /api/events/channels/unsubscribe
```

Request body:

```json
{
  "userId": 1,
  "channel": "alerts"
}
```

Response:

```json
{
  "status": "unsubscribed",
  "userId": 1,
  "channel": "alerts"
}
```

---

## 3. Publish an Event

```
POST /api/events/publish
```

Example request:

```bash
curl -X POST http://localhost:8080/api/events/publish \
-H "Content-Type: application/json" \
-d '{"channel":"alerts","eventType":"SYSTEM_ALERT","payload":{"message":"hello"}}'
```

Request body format:

```json
{
  "channel": "alerts",
  "eventType": "SYSTEM_ALERT",
  "payload": {
    "message": "hello"
  }
}
```

Response:

```
202 Accepted
```

---

## 4. Open SSE Stream

This endpoint opens a persistent connection that streams events.

```
GET /api/events/stream
```

Required query parameters:

| Parameter | Description                                 |
| --------- | ------------------------------------------- |
| userId    | ID of the user                              |
| channels  | comma separated list of subscribed channels |

Example:

```bash
curl --no-buffer http://localhost:8080/api/events/stream?userId=1&channels=alerts
```

Example SSE response:

```
id: 1
event: SYSTEM_ALERT
data: {"message":"hello"}
```

---

## 5. Get Event History

Fetch previously published events.

```
GET /api/events/history
```

Query parameters:

| Parameter | Description              |
| --------- | ------------------------ |
| channel   | channel name             |
| afterId   | optional event id cursor |
| limit     | optional result limit    |

Example:

```bash
curl "http://localhost:8080/api/events/history?channel=alerts"
```

Example response:

```json
{
  "events": [
    {
      "id": 1,
      "channel": "alerts",
      "eventType": "SYSTEM_ALERT",
      "payload": {
        "message": "hello"
      }
    }
  ]
}
```

---

# Example Workflow

1. Subscribe to a channel
2. Open SSE stream
3. Publish an event
4. Receive event instantly through the stream

---

# Health Check

```
GET /health
```

Response:

```
OK
```

---

# Running Tests Manually

### Subscribe

```
curl -X POST http://localhost:8080/api/events/channels/subscribe \
-H "Content-Type: application/json" \
-d '{"userId":1,"channel":"alerts"}'
```

### Start SSE stream

```
curl --no-buffer http://localhost:8080/api/events/stream?userId=1&channels=alerts
```

### Publish event

```
curl -X POST http://localhost:8080/api/events/publish \
-H "Content-Type: application/json" \
-d '{"channel":"alerts","eventType":"SYSTEM_ALERT","payload":{"message":"hello"}}'
```

---

