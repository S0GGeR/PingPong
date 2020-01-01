var game = {
    running: true,
    width: 640,
    height: 480,
    ctx: undefined,
    platform1: undefined,
    platform2: undefined,
    score1: 0,
    score2: 0,
    game: undefined,
    releaseTurn: 1,
    sprites: {
        background: undefined,
        platform1: undefined,
        platform2: undefined,
        ball: undefined,
    }
};
const ws = new WebSocket(('ws:localhost:8030/'));
/* -----------------------------------------------------BEGIN VIEW----------------------------------------------------*/
game.initView = function(){
    var canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext("2d");
};
game.load = function(){
    for(let key in this.sprites){
        this.sprites[key] = new Image();
        this.sprites[key].src = 'images/'+ key +'.png';
    }
};
game.render = function(){
    this.ctx.clearRect(0,0,this.width,this.height);
    this.ctx.drawImage(this.sprites.background, 0, 0);
    this.ctx.drawImage(this.sprites.platform2, this.platform2.x, this.platform2.y);
    this.ctx.drawImage(this.sprites.platform1, this.platform1.x, this.platform1.y);
    this.ctx.drawImage(this.sprites.ball, this.ball.x, this.ball.y);
    this.ctx.font = "45px Arial";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillText(this.score1, 15, this.height-200);
    this.ctx.fillText(this.score2, 15, this.height-250);
};

/* -----------------------------------------------------END VIEW------------------------------------------------------*/
/* -----------------------------------------------------BEGIN MODEL---------------------------------------------------*/
game.ball = {
    x: 312,
    y: 427,
};
game.platform1 = {
    x:274,
    y:450
};
game.platform2 = {
    x: 274,
    y: 10
};
game.getUpdates = function(){
    ws.onmessage = function (message) {
        let data = '';
        for (let i = 1; i < message.data.length - 1; i++) {
            data += message.data[i];
        }
        data = data.split(',');
        game.platform1.x = data[0];
        game.platform1.y = data[1];
        game.platform2.x = data[2];
        game.platform2.y = data[3];
        game.ball.x = data[4];
        game.ball.y = data[5];
        game.score1 = data[6];
        game.score2 = data[7];
    };
};
/* -----------------------------------------------------END MODEL-----------------------------------------------------*/
/* -----------------------------------------------------BEGIN CONTROLLER----------------------------------------------*/
window.addEventListener("load", function(){
    game.start();
});
game.initController = function (){
    window.addEventListener("keydown", function(event) {
        if ( event.code === 'ArrowLeft' ){
            let data = ['Platform moving left'];
            wsSend(data);
        }
        else if( event.code ===  'ArrowRight'){
            let data = ['Platform moving right'];
            wsSend(data);
        }
        else if( event.code === 'Space'){
            let data = ['Release ball'];
            wsSend(data);
        }
    });
    window.addEventListener("keyup", function(event) {
        if ( event.code === 'ArrowLeft' ){
            let data = ['Stop the platform'];
            wsSend(data);
        }
        else if( event.code ===  'ArrowRight'){
            let data = ['Stop the platform'];
            wsSend(data);
        }

    });

};
game.start = function() {
    game.initController();
    game.initView();
    game.load();
    game.getUpdates();
    game.run();
};
game.run= function() {

    game.render();
    window.requestAnimationFrame(function () {
        game.run();
    });
};

/* -----------------------------------------------------END CONTROLLER------------------------------------------------*/


let wsSend = function(data) {
    if(!ws.readyState){
        setTimeout(function (){
            wsSend(data);
        },100);
    }else{
        ws.send(data);
    }
};