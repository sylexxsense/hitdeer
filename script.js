function loadMessages() {
  fetch('/messages')
    .then(res => res.json())
    .then(data => {
      const messagesDiv = document.getElementById('messages');
      messagesDiv.innerHTML = '';
      data.forEach(msg => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
        messagesDiv.appendChild(p);
      });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  setInterval(loadMessages, 2000);

  const form = document.getElementById('msgForm');
  const textarea = document.getElementById('message');

  if (form && textarea) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      sendMessage();
    });

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function sendMessage() {
      const message = textarea.value.trim();
      if (!message) return;
      fetch('/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }).then(() => {
        textarea.value = '';
        loadMessages();
      });
    }
  }
});
