const express = require("express");
const router = express.Router();
const db = require("./db");
const { addConnection, removeConnection, getConnections } = require("./connections");

router.get("/health", (req, res) => {
  res.status(200).send("OK");
});

router.post("/api/events/publish", async (req, res) => {
  const { channel, eventType, payload } = req.body;

  if (!channel || !eventType || payload === undefined) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const channelExists = await db.query(
    "SELECT 1 FROM user_subscriptions WHERE channel=$1 LIMIT 1",
    [channel]
  );

  if (channelExists.rows.length === 0) {
    return res.status(404).json({
      error: "Channel not found"
    });
  }

  const result = await db.query(
    "INSERT INTO events(channel,event_type,payload) VALUES($1,$2,$3) RETURNING *",
    [channel, eventType, payload]
  );

  const event = result.rows[0];

  const clients = getConnections(channel);

  clients.forEach(client => {
    client.write(`id: ${event.id}\n`);
    client.write(`event: ${event.event_type}\n`);
    client.write(`data: ${JSON.stringify(event.payload)}\n\n`);
  });

  res.status(202).send();
});
router.post("/api/events/channels/subscribe", async (req, res) => {
  const { userId, channel } = req.body;

  const existing = await db.query(
    "SELECT 1 FROM user_subscriptions WHERE user_id=$1 AND channel=$2",
    [userId, channel]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({
      error: "User already subscribed to this channel"
    });
  }

  await db.query(
    "INSERT INTO user_subscriptions(user_id,channel) VALUES($1,$2)",
    [userId, channel]
  );

  res.status(201).json({
    status: "subscribed",
    userId,
    channel
  });
});

router.post("/api/events/channels/unsubscribe", async (req, res) => {
  const { userId, channel } = req.body;

  const existing = await db.query(
    "SELECT 1 FROM user_subscriptions WHERE user_id=$1 AND channel=$2",
    [userId, channel]
  );

  if (existing.rows.length === 0) {
    return res.status(404).json({
      error: "User is not subscribed to this channel"
    });
  }

  await db.query(
    "DELETE FROM user_subscriptions WHERE user_id=$1 AND channel=$2",
    [userId, channel]
  );

  res.status(200).json({
    status: "unsubscribed",
    userId,
    channel
  });
});
router.get("/api/events/history", async (req, res) => {
  const { channel, afterId = 0, limit = 50 } = req.query;

  const result = await db.query(
    `SELECT id,channel,event_type as "eventType",payload,created_at as "createdAt"
     FROM events
     WHERE channel=$1 AND id>$2
     ORDER BY id
     LIMIT $3`,
    [channel, afterId, limit]
  );

  res.json({ events: result.rows });
});

router.get("/api/events/stream", async (req, res) => {
  const { userId, channels } = req.query;
  const lastEventId = req.header("Last-Event-ID");

  const channelList = channels.split(",");

  const sub = await db.query(
    "SELECT channel FROM user_subscriptions WHERE user_id=$1",
    [userId]
  );

  const allowedChannels = sub.rows.map(r => r.channel);

  const validChannels = channelList.filter(c => allowedChannels.includes(c));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  if (lastEventId) {
    const replay = await db.query(
      `SELECT * FROM events
       WHERE id > $1 AND channel = ANY($2)
       ORDER BY id`,
      [lastEventId, validChannels]
    );

    replay.rows.forEach(event => {
      res.write(`id: ${event.id}\n`);
      res.write(`event: ${event.event_type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    });
  }

  validChannels.forEach(channel => {
    addConnection(channel, res);
  });

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    validChannels.forEach(channel => removeConnection(channel, res));
  });
});

module.exports = router;