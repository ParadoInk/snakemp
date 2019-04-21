const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
let game = 0;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/snake.html');
});


io.on('connection', function(socket){
    let dead = false;
    console.log("user connected " + socket.id);
    if(game == 0){
        game = new Game();
    }
    game.players[socket.id] = new Player();
    socket.emit('connectdata', game.players[socket.id].data);
    socket.on('updatereply', function(_data){
        if(!dead){
            game.players[socket.id].updatePieces(_data["pieces"]);
        }
    });
    socket.on('spawnapple', function(_data){
        game.spawnApple();
    });
    socket.on('die', function(_data){
        if(game != 0){
            delete game.players[socket.id];
            dead = true;
        }
    });
    socket.on('disconnect', function(_data){
        if(game != 0){
            delete game.players[socket.id];
            dead = true;
        }
    });
});


http.listen(process.env.PORT || 3000, function(){
    console.log('listening');
});


class Player {
    constructor(){
        let color1 = Math.floor(Math.random() * 255);
        let color2, color3;
        if(color1 < 128){
            color2 = Math.floor(Math.random() * 127) + 128;
        }
        else{
            color2 = Math.floor(Math.random() * 127);
        }
        if(color1 + color2 < 255){
            color3 = Math.floor(Math.random() * 127) + 128;
        }
        else{
            color3 = Math.floor(Math.random() * 127);
        }
        this.color = [color1, color2, color3];
        this.pos = [Math.floor(Math.random() * 64), Math.floor(Math.random() * 48)];
        this.pieces = [];
        this.pieces.push([this.pos[0], this.pos[1]]);
    }
    get data(){
        return {
            "color": this.color,
            "pos": this.pos,
            "pieces": this.pieces
        };
    }
    updatePieces(pieces){
        this.pieces = pieces;
    }

}

class Game {
    constructor(){
        this.players = {};
        this.apple = [];
        this.spawnApple();
        this.gameloop = setInterval(function(g){
            if(game != 0){
                game.update();
            }
        }, 1000 / 20);
    }
    update(){
        if(Object.keys(this.players).length == 0){
            game = 0;
            clearInterval(this.gameloop);
        }
        io.emit('update', {
            "apple": this.apple,
            "players": this.players
        })
    }


    spawnApple(){
        this.apple = [Math.floor(Math.random() * 64), Math.floor(Math.random() * 48)];
    }
}
