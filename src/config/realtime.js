const Pusher = require('pusher');

const isEnabled = process.env.PUSHER_ENABLED === 'true';
let pusherClient = null;

if (isEnabled) {
  pusherClient = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
}

async function triggerRealtimeEvent(channel, event, payload) {
  if (!isEnabled) {
    return null;
  }
  if (!pusherClient) {
    throw new Error('Pusher is enabled but not configured correctly');
  }
  return pusherClient.trigger(channel, event, payload);
}

module.exports = { triggerRealtimeEvent, isRealtimeEnabled: isEnabled };
