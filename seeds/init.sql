CREATE TABLE users(
 id INTEGER PRIMARY KEY
);

INSERT INTO users VALUES (1),(2);

CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  channel VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_channel_id
ON events(channel,id);

CREATE TABLE user_subscriptions (
  user_id INTEGER NOT NULL,
  channel VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel)
);

INSERT INTO user_subscriptions(user_id,channel)
VALUES
(1,'alerts'),
(1,'test-stream-channel'),
(2,'notifications');

INSERT INTO events(channel,event_type,payload)
VALUES
('alerts','SYSTEM_ALERT','{"message":"seed alert"}'),
('notifications','USER_NOTIFICATION','{"message":"welcome"}');