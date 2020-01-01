const http = require('http');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const socket = new ws.Server({port: 8030});
function Client(ws,ip)  {
    this.ws = ws;
    this.ip = ip;
}
var clients = [];
var game = {
    width: 640,
    height: 480,
    platform: undefined,
    ball: undefined,
    score1: 0,
    score2: 0,
    releaseTurn: 1,
    PlatformSpeed: 3,
    BallSpeed: 3,
};
game.ball = {
    width: 24,
    height: 23,
    x: 312,
    y: 427,
    Vx: 0,
    Vy: 0,
    checkHitBox: function(block){
        let x = this.x + this.Vx;
        let y = this.y + this.Vy;

        if (x + this.width > block.x &&
            x < block.x + block.width &&
            y + this.height > block.y &&
            y < block.y + block.height){
            return true;
        }
        return false;

    },
    IsLeftSideOfPlatform: function(platform){
        if (this.x + this.width/2 < (platform.x + platform.width/2)) {
            return true;
        }
        else {
            return false;
        }
    },
    Platform1Push: function(){
        this.Vy = -game.BallSpeed;
        if (this.IsLeftSideOfPlatform(game.platform1)){
            this.Vx = -game.BallSpeed;
        }
        else {
            this.Vx = game.BallSpeed;
        }
    },
    Platform2Push: function(){
        this.Vy *= -1;

    },
    move: function(){
        this.x += this.Vx;
        this.y += this.Vy;
    },
    jump: function(){
        this.Vx = -game.BallSpeed;
        this.Vy = -game.BallSpeed;
    },
    checkBorders: function(){

        let x = this.x + this.Vx;
        let y = this.y + this.Vy;



        if ( x < 0 ){
            this.x = 0;
            this.Vx = game.BallSpeed;

        }else if (x+this.width >game.width){
            this.x = game.width - this.width;
            this.Vx = -game.BallSpeed;

        }else if (y < 0){
            game.releaseTurn++;
            respawn();
            game.score2++;


        }else if (y + this.height >game.height){
            game.releaseTurn++;
            respawn();
            game.score1++;
        }
    }
};
game.platform1 = {
    x: 274,
    y: 450,
    Vx: 0,
    Vy: 0,
    ball: game.ball,
    width: 108,
    height: 16,
    releaseBall: function () {
        if (this.ball) {
            this.ball.jump();
            this.ball = false;
        }

    },
    move: function () {
        this.x += this.Vx;
        if (this.ball && !isEven(game.releaseTurn) ) {
            this.ball.x += this.Vx;
        }
    },
    stop: function () {
        this.Vx = 0;
        if (this.ball && !isEven(game.releaseTurn)) {
            this.ball.Vx = 0;

        }
    },
};
game.platform2 = {
    x: 274,
    y: 10,
    Vx: 0,
    Vy: 0,
    ball: game.ball,
    width: 108,
    height: 16,
    releaseBall: function () {
        if (this.ball) {
            this.ball.jump();
            this.ball = false;
        }

    },
    move: function () {
        this.x += this.Vx;
        if (this.ball && isEven(game.releaseTurn)) {
            this.ball.x += this.Vx;
        }
    },
    stop: function () {
        this.Vx = 0;
        if (this.ball && isEven(game.releaseTurn)) {
            this.ball.Vx = 0;

        }
    },
};
const server = http.createServer((req,res)=> {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    let ContentType = 'text/html';
    switch (ext){
        case '.css':
            ContentType = 'text/css';
            break;
        case '.js':
            ContentType = 'text/javascript';
            break;
        case '.html':
            ContentType = 'text/html';
            break;
        default:
            ContentType = '';
    }
    if(!ext){
        filePath += '.html'
    }
    if (req.method === 'GET') {
        fs.readFile(filePath, (err, data) => {
            if (err) {

            } else {
                res.writeHead(200, {
                    'Content-Type': ContentType
                });
            }
            res.end(data);
        });
    }

    socket.on('connection', function connection(ws, req) {
        const ip = req.connection.remoteAddress;
        newClient(ws, ip);

        ws.on('message', message => {
            GameInit(message, ws);
            sendMessage();
        })
   });

});
server.listen(8000, () => {
    console.log('Server has been started ....')
});
let GameInit = function (message, ws) {
    let data = new Array();
    data = message.split(',');

   if (data[0] === 'Platform moving right') {
        if (clients[1].ws === ws) {
            game.platform1.Vx = game.PlatformSpeed;

        } else if (clients[2].ws === ws) {
            game.platform2.Vx = game.PlatformSpeed;

        }

    }
    else if (data[0] === 'Platform moving left') {
        if (clients[1].ws === ws) {
            game.platform1.Vx = -game.PlatformSpeed;

        } else if (clients[2].ws === ws) {
            game.platform2.Vx = -game.PlatformSpeed;

        }

    }
    else if (data[0] === 'Stop the platform'){
        if (clients[1].ws === ws) {
            game.platform1.stop();
        } else if (clients[2].ws === ws) {
            game.platform2.stop();
        }

    }
    else if (data[0] === 'Release ball') {
        if(isEven(game.releaseTurn))
            game.platform2.releaseBall();
        else {
            game.platform1.releaseBall();
        }
    }
};
game.update = function(){
    if (game.ball.checkHitBox(this.platform1)) {
        game.ball.Platform1Push();
    }
    if (game.ball.checkHitBox(this.platform2)) {
        game.ball.Platform2Push();
    }
    if (this.platform1.Vx !== 0){
        this.platform1.move();
    }
    if (this.platform2.Vx !== 0){
        this.platform2.move();
    }
    if (this.ball.Vx !== 0 || this.ball.Vy !== 0){
        this.ball.checkBorders();
        this.ball.move();
    }
};
setInterval(function(){
    game.update();
    sendMessage();
},10);
let sendMessage = function(){
    for (let i = 1; i<clients.length; i++) {
        if (clients[i].ws.readyState === ws.OPEN) {
            let data = [game.platform1.x, game.platform1.y, game.platform2.x, game.platform2.y, game.ball.x, game.ball.y, game.score1,game.score2];
            data = JSON.stringify(data);
            clients[i].ws.send(data);
        }
    }
};
let newClient = function(ws, ip){

    let number = socket.clients.size;

    if (clients[number] !== undefined){
        if (clients[number].ip !== ip){
           if(clients[1].ip !== ip){
               clients.push(new Client(ws,ip));
           }
           else{
               clients[1] = new Client(ws,ip);
           }
        }
        else {
            clients[number] = new Client(ws,ip);
        }
    }
    else{
        clients[number] = new Client(ws,ip);
    }
};
let isEven = function(someNumber) {
    return (someNumber % 2 == 0) ? true : false;
};
let respawn = function(){
    if (isEven(game.releaseTurn)){
        game.ball.Vx = 0;
        game.ball.Vy = 0;
        game.platform2.ball = game.ball;
        game.ball.x = game.platform2.x+42;
        game.ball.y= 25;
    }
    else{
        game.ball.Vx = 0;
        game.ball.Vy = 0;
        game.platform1.ball = game.ball;
        game.ball.x = game.platform1.x+42;
        game.ball.y= 427;
    }


}