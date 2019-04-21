let socket = io();
let data;
let tick = 0;

let player;
let apple;
const tileSize = 10;

function setup(){
    noLoop();
    blendMode(REPLACE);
    createCanvas(640, 480);
    player = new Player();
}

function draw(){
    background(0);
    updatePlayer();
    let reply = [[player.pos[0], player.pos[1]]];
    socket.emit('updatereply', {
        "pieces": reply.concat(player.tail)
    });
    updateData();
    drawPlayers();
}

socket.on('update', function(_data){
    data = _data;
    redraw();
});

socket.on('connectdata', function(_data){
    player.color = _data["color"];
    player.pos = _data["pos"];
});

function updatePlayer(){
    player.update();
}

function updateData(){
    apple = data["apple"];
    players = data["players"];
}

function drawPlayers(){
    fill([255, 0, 0]);
    rect(apple[0] * tileSize, apple[1] * tileSize, tileSize, tileSize);
    players.forEach(function(p){
        fill(p.color);
        p.pieces.forEach(function(piece){
            rect(piece[0] * tileSize, piece[1] * tileSize, tileSize, tileSize);
        });
    })
}

const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
const lengthIncrease = 3;
let dir = UP;
function keyPressed(){
    if(keyCode == 87){
        player.changeDir(UP);
    } else if(keyCode == 68){
        player.changeDir(RIGHT);
    } else if(keyCode == 83){
        player.changeDir(DOWN);
    } else if(keyCode == 65){
        player.changeDir(LEFT);
    }
}

class Player {
    constructor(){
        this.pos = [0, 0];
        this.tail = [];
        this.length = 3;
        this.dir = RIGHT;
        this.color = [0, 0, 0];
    }
    update(){
        this.tail.push([this.pos[0], this.pos[1]]);
        this.move();
        while(this.tail.length >= this.length){
            this.tail.shift();
        }
    }
    changeDir(_dir){
        this.dir = _dir;
    }
    move(){
        if(this.dir == RIGHT){
            this.pos[0]++;
        } else if(this.dir == LEFT){
            this.pos[0]--;
        } else if(this.dir == UP){
            this.pos[1]--;
        } else if(this.dir == DOWN){
            this.pos[1]++;
        }
    }
}