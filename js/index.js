// -------------------------------- CONFIGs ------------------------------------
const apiURL = 'https://tagchatter.herokuapp.com';
const showLast = 20;
const parrotsTimer = 3000;
const listTimer = 3000;

var userId;
var userName;
var messages = [];

// --------------------------- DOM AREA: HEADER---------------------------------
function fetchParrotsCount() {
  // Atualiza quantidade de parrots no buffer mais atual do servidor

  setTimeout(fetchParrotsCount, parrotsTimer);
  return fetch(apiURL + '/messages/parrots-count')
    .then(function (response) {
      return response.json();
    })
    .then(function (count) {
      document.getElementById('parrots-counter').innerHTML = count;
    });
}

// -------------------------- DOM AREA: MESSAGES -------------------------------
async function listMessages() {
  // Lista as mensagens no buffer do servidor -> Imprime na área de Chat

  let newMsgs = [];

  await fetch(apiURL + '/messages')
    .then(function (response) {
      return response.json();
    })
    .then(function (msgs) {
      messages = msgs;
    });

  printPosts(messages.slice(-showLast));

  setTimeout(listMessages, listTimer);

}

function formatPost(post) {
  // Recebe o POST em JSON e formata resposta de acordo com o
  // Esqueleto de formatação de um post

  d = new Date(post.created_at);
  return (`
  <div class="post ${post.has_parrot ? 'parroted-post' : ''}" id="${post.id}">
    <img src="${post.author.avatar}" width=34 height=34 alt="poster avatar" class="post__pic">
    <div class="post__msg">
      <div class="post__msg__header">
        <span class="username">${post.author.name}</span>
        <span class="separator"></span>
        <span class="time">${d.getHours() + ':' + ('0' + d.getMinutes()).substr(-2)}</span>
        <span class="separator"></span>
        <div onclick="parrotMessage(event)"
          class="parrot ${post.has_parrot ? 'parrot-color' : ''}"></div>
      </div>
      <div class="post__msg__text">
        ${post.content}
      </div>
    </div>
  </div>
  `);
}

function printPosts(messagesList) {
  // Imprime os posts para a área de chat

  chatArea = document.getElementsByClassName('chat')[0];

  chatArea.innerHTML = '';

  messagesList.forEach(item => {
    chatArea.innerHTML += formatPost(item);
  });

  chatArea.scrollTop = chatArea.scrollHeight - chatArea.clientHeight;

  return;
}

function parrotMessage(e) {
  // Request de marcação "parrot" no servidor

  parrot = e.target.classList.toggle('parrot-color');
  id = e.target.parentElement.parentElement.parentElement.id;
  post = document.getElementById(id);
  post.classList.toggle('parroted-post');

  if (parrot) {
    fetch(apiURL + '/messages/' + id + '/parrot', { method: 'PUT' });
  } else {
    fetch(apiURL + '/messages/' + id + '/unparrot', { method: 'PUT' });
  }
}

// ------------------------ DOM AREA: TEXT EDITOR ------------------------------
const sendBut = document.getElementsByClassName('msgbox__send')[0];
const msgText = document.getElementsByClassName('msgbox__text')[0];

msgText.addEventListener('keyup', function (event) {
  if (event.keyCode === 13) {
    sendMessage(msgText.value, userId);
  }
});

sendBut.addEventListener('click', () => {
    sendMessage(msgText.value, userId);
  });

function getMe() {
  // Request de dados do usuário atual

  return fetch(apiURL + '/me')
    .then(function (response) {
      return response.json();
    })
    .then(function (user) {
      userId = user.id;
      userName = user.name;
      document.getElementsByClassName('msgbox__mypic')[0].src = user.avatar;
    });
}

async function sendMessage(message, authorId) {
  // Envia mensagem para a API

  if (message !== '') {

    msgText.blur();
    sendBut.src = 'images/spinner.gif';

    await fetch(apiURL + '/messages/', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          author_id: authorId,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }).then(res => {
        resStatus = res.status;
        return res.json();
      })
  .then(res => {
      switch (resStatus) {
      case 200:
        messages.push(res);
        printPosts(messages.slice(-showLast));
        msgText.value = '';
        msgText.focus();
        break;
      case 400:
        if (res.code === 'ValidationFailed') {
          console.log(res.fieldMessages);
          console.log('This is a BAD Request Error!');
        } else {
          console.log('Oh no! An invalid JSON!');
        }

        break;
      case 500:
        tagAlert('Server error, please try again!');
        console.log('Server error, try again!');
        msgText.blur();
        break;
      default:
        break;
    }
    })
  .catch(err => {
      console.error(err);
    });
    sendBut.src = 'images/send_icon.svg';
  }
}

// -------------------------- TOOLS & HELPERS ----------------------------------
function tagAlert(msg) {
  const alertCont = document.getElementsByClassName('alert')[0];
  const alertMsg = document.getElementsByClassName('alert__message')[0];
  const alertBtn = document.getElementsByClassName('alert__btn')[0];

  alertCont.classList.add('alert__show');
  alertMsg.innerHTML = msg;

  alertBtn.addEventListener('click', () => {
    alertCont.classList.remove('alert__show');
    msgText.focus();
  });

}

function initialize() {
  // Funções executadas ao inicializar (Only Once)

  fetchParrotsCount();
  getMe();
  listMessages();

}

initialize();
