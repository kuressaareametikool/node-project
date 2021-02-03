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
    for (const userName in userListObj) {
        userList.innerHTML += `
        <div>
            <p class="user" data-socketid="${ userListObj[userName] }">${ userName }</p>
        </div>`;
    }

    const users = document.getElementsByClassName('user');

    Array.prototype.forEach.call(users, el => {
        el.addEventListener('click', e => {
            console.log(e.currentTarget.dataset.socketid);
            socket.emit('sendYo', { socketId: e.currentTarget.dataset.socketid });
            console.log('click');
        });
    });
});

socket.on('chat_message', msgObj => {
    console.log(msgObj)
    const item = document.createElement('div');
    item.innerHTML = `
        <div>
            <p><b>${ msgObj.user }</b></p>
            <p>${ msgObj.message }</p>
        </div>
    `
    chatMessages.appendChild(item);
});

socket.on('reciveYo', msgObj => {
    console.log(msgObj)
    const item = document.createElement('div');
    item.innerHTML = `
        <div>
            <p><b>${ msgObj.user }</b></p>
            <p>Yo!</p>
        </div>
    `
    chatMessages.appendChild(item);
});

document.getElementById('logout').onclick = function() {
    console.log('logout');
    location.href = '/logout';
};