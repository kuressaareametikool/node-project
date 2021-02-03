var socket = io();

const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const userList = document.getElementById('user-list');

messageInput.focus();

messageInput.addEventListener('keydown', event => {
    if (event.key == 'Enter' && messageInput.value.trim() !== '') {
        socket.emit('chat_message', messageInput.value);
        messageInput.value = '';
    }
});

socket.on('connection', userId => {
    const item = document.createElement('li');
    item.textContent = 'User ' + userId + ' connected';
    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('updateUserList', userListObj => {
    userList.innerHTML = "";
    for (const username in userListObj) {
        userList.innerHTML += `
        <div>
            <p>${ username }</p>
        </div>`;
    }
});

socket.on('chat_message', msgObj => {
    console.log(msgObj)
    const item = document.createElement('div');
    item.innerHTML = `
        <div>
            <p><b>${ msgObj.user }</b>: ${ msgObj.message }</p>           
        </div>
    `
    chatMessages.appendChild(item);
});

document.getElementById('logout').onclick = function() {
    console.log('logout');
    location.href = '/logout';
};