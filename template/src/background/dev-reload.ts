// Called only in development builds. Production builds eliminate this module.
export function connectDevReload(port: number): void {
  const connect = () => {
    const socket = new WebSocket('ws://127.0.0.1:' + port);
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send('ping');
    }, 20_000);
    socket.addEventListener('message', (event) => {
      const plan = JSON.parse(event.data) as { kind: string; surfaces: string[] };
      if (plan.kind === 'full') chrome.runtime.reload();
      else if (plan.kind === 'surfaces')
        void chrome.runtime.sendMessage({ channel: 'dev-reload', surfaces: plan.surfaces }).catch(() => {});

    });
    socket.addEventListener('close', () => {
      clearInterval(heartbeat);
      setTimeout(connect, 1_000);
    });
    socket.addEventListener('error', () => socket.close());
  };
  connect();
}
