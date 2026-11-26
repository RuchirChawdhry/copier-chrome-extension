// Called only in development builds. Production builds eliminate this module.
export function connectDevReload(port: number): void {
  const connect = () => {
    const socket = new WebSocket('ws://127.0.0.1:' + port);
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send('ping');
    }, 20_000);
    socket.addEventListener('message', (event) => {
      if (event.data === 'reload') chrome.runtime.reload();
    });
    socket.addEventListener('close', () => {
      clearInterval(heartbeat);
      setTimeout(connect, 1_000);
    });
    socket.addEventListener('error', () => socket.close());
  };
  connect();
}
