const connections = new Map();

function addConnection(channel, client) {
  if (!connections.has(channel)) {
    connections.set(channel, new Set());
  }
  connections.get(channel).add(client);
}

function removeConnection(channel, client) {
  if (connections.has(channel)) {
    connections.get(channel).delete(client);
  }
}

function getConnections(channel) {
  return connections.get(channel) || new Set();
}

module.exports = {
  addConnection,
  removeConnection,
  getConnections
};