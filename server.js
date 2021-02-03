const express = require('express');
const app = express();

const http = require('http').createServer(app);
const socketio = require('socket.io');
const io = socketio(http)

const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');

var bodyParser = require('body-parser');
const path = require('path');

const userList = {};

// config
app.use('/public', express.static('./public/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// redis server
const RedisStore = connectRedis(session);

//Configure redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
})

redisClient.on('error', function(err) {
    console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function(err) {
    console.log('Connected to redis successfully');
});


// Define middleware for Redis and use it with Express and Socket.io
const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secret$%^134',
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie 
        maxAge: 1000 * 60 * 60 * 24 // session max age in miliseconds
    }
});

app.use(sessionMiddleware);

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});


// Router // Here are all GET, POST, PUT, DELETE routes defined for the app
app.get("/", (req, res) => {
    sess = req.session;

    if (sess.username && sess.password) {
        sess = req.session;
        if (sess.username) {
            res.sendFile(__dirname + '/public/index.html');
        }
    } else {
        res.sendFile(__dirname + "/public/login.html");
    }
});

app.post("/login", (req, res) => {
    redisClient.hgetall('users', (err, result) => {

        let isSuccess = false;

        if (req.body.username in result) {
            if (result[req.body.username] == req.body.password) {
                isSuccess = true;
            }
        }

        if (isSuccess) {
            sess = req.session;
            sess.username = req.body.username;
            sess.password = req.body.password;
            console.log('login', req.body.username, req.body.password, sess.username, sess.password);
            res.json({ response: 'success' });
        } else {
            res.json({ response: 'errorWrongCredentials' });
        }
    });
});

app.post("/register", (req, res) => {
    console.log(req.body.username, req.body.password, 'register');

    redisClient.hgetall('users', (err, result) => {
        let isSuccess = false;
        if (result) {
            if (req.body.username in result) {
                isSuccess = false
            }
            isSuccess = true;
        } else {
            isSuccess = true;

        }
        if (isSuccess) {
            redisClient.hset('users', req.body.username, req.body.password);
            res.json({ response: 'success' });
        } else {
            res.json({ response: 'errorUserExists' });

        }
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect("/")
    });
});

// ============================================================================================
// Listen socket.io connections from client side
io.on('connection', (socket) => {
    const sess = socket.request.session

    // On connection update user list
    userList[sess.username] = socket.id;
    io.emit('updateUserList', userList);

    // On chat message from user emit to all users who are connected
    socket.on('chat_message', msg => {
        io.emit('chat_message', { 'message': msg, 'socketId': socket.id, 'user': sess.username });
    });

    // On disconnect update user list
    socket.on('disconnect', () => {
        console.log('user ' + socket.id + ' disconnected');
        delete userList[sess.username];
        io.emit('updateUserList', userList);
    });
});

//list of users in the chat
const users = {};
let guessedLetters;
let allGuesses;
let lives;
let word = "";
let gameMaster = "";
let guessedWord;
let gameStarted = false;
let userCount;
let result = "";

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const loadGame = () => {
	io.to('Game Room').emit('list users', users);
	io.to('Game Room').emit('generate letter buttons', allGuesses, gameMaster);
	io.to('Game Room').emit('guessed word', guessedWord);
	io.to('Game Room').emit('update lives', lives);
	if(result!="") io.emit('game result', result);
}

const resetGame = () => {
    //resets game values
    guessedLetters = [];
    allGuesses = [];
    lives = 5;
		result = "";
		gameMaster = "";
    word = "";
};

const getWord = () => {
		//hide start game / play again button
		io.to('Game Room').emit('hide button');

		//assigns random game master from connected users
		const userKeys = Object.keys(users);
		gameMaster = userKeys[Math.floor(Math.random() * userKeys.length)];

		//gets word from game master
		io.to(gameMaster).emit('set word');
};

const checkGuess = (letter) => {
    //if the letter is guessed correctly
    if (word.toLowerCase().includes(letter)) {
        guessedLetters.push(letter);

        //Updates guessed word with guessed letter
        guessedWord = word.toLowerCase().split("").map(letter => guessedLetters.includes(letter) ? letter : "_ ");
        io.emit('guessed word', guessedWord);

        if (word === guessedWord.join("")) {
            io.emit('guessed word', guessedWord);
						result = "won! :)";
            io.emit('game result', result);
        }
    } else {
        lives--;
        io.to('Game Room').emit('update lives', lives);
        if (lives <= 0) {
            io.emit('guessed word', guessedWord);
						result = "lost :(";
            io.emit('game result', result);
        }
    }
};

const checkEnoughPlayers = () => {
		userCount = Object.keys(users).length;
		//if there is more than 1 player, show start game button
		if (userCount > 1) io.to('Game Room').emit('show start game button');
}


resetGame();

//Server socket connection listener
io.on('connection', (socket) => {
    userCount = Object.keys(users).length;

    //Game limited to 3 players
    if (userCount >= 3) {
        io.to(socket.id).emit('full game');
        io.sockets.sockets[socket.id].disconnect();
    } else {
        socket.join('Game Room');
        console.log('A user connected');

        io.to('Game Room').emit('set username');

        if (gameStarted) loadGame();

        //Socket listeners =====================================================

        socket.on('add username', (username) => {
            //adds username to list of users
            users[socket.id] = username;
            io.to('Game Room').emit("welcome new user", username);
            //updates list of usernames
            io.to('Game Room').emit('list users', users);
            if (gameStarted === false) checkEnoughPlayers();
        });

				socket.on('chatroom message', (username, message) => {
						io.to('Game Room').emit('send chatroom message', `${username}: ${message}`);
				});

				socket.on('get word', () => {
						getWord();
				});

        socket.on('start game', (chosenWord) => {
            word = chosenWord;
            gameStarted = true;

            //replaces word with blanks
            guessedWord = word.replace(/[^ ]/g, '_ ');

            loadGame();
        });

        socket.on('clicked letter', (letter) => {
            allGuesses.push(letter);
            io.to('Game Room').emit('disable letter', letter);
            checkGuess(letter);
        });

				const disconnectUser = () => {
						let disconnectedUser = users[socket.id];

						if (disconnectedUser !== undefined) {
								console.log(`${disconnectedUser} has disconnected`);

								//deletes from list of users
								delete users[socket.id];

								//updates list of users
								io.to('Game Room').emit('list users', users);

								io.to('Game Room').emit('leave game', disconnectedUser);

								//check if enough players to play game
								userCount = Object.keys(users).length;

                console.log(userCount);
                console.log(gameMaster);
                console.log()

                //if game master leaves before choosing a word for the game, new game master is assigned
                if(userCount > 1 && socket.id===gameMaster && word === ""){
                  getWord();
                }

								//hide start game button if less than 2 players
								if(userCount < 2) io.to('Game Room').emit('hide button');

								//reset game if no players connected
								if (userCount < 1){
									gameStarted = false;
									resetGame();
								}

						}
				};

        socket.on('leave game', () => {
            disconnectUser();
            socket.leave('Game Room');
        });

        //handling built-in disconnect event
        socket.on('disconnect', () => {
            disconnectUser();
        });


        socket.on('play again', () => {
            resetGame();
						loadGame();
						io.to('Game Room').emit('disable guessing');
						io.to('Game Room').emit('clear');
						getWord();
        });
    }
}); //end of socket server listener

http.listen(process.env.PORT || 3000, () => {
    console.log("Waiting for visitors");
});