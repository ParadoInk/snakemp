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
    console.log("user connected " + socket.id);
    if(game == 0){
        game = new Game();
    }
    let pnum = game.players.length;
    game.players.push(new Player());
    socket.emit('connectdata', game.players[pnum].data);
    socket.on('updatereply', function(_data){
        game.players[pnum].updatePieces(_data["pieces"]);
    });
    socket.on('spawnapple', function(_data){
        game.spawnApple();
    });

});


http.listen(process.env.PORT || 3000, function(){
    console.log('listening');
});


class Player {
    constructor(){
        this.color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
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
        this.players = [];
        this.apple = [];
        this.spawnApple();
        this.gameloop = setInterval(function(g){
            if(game != 0){
                game.update();
            }
        }, 1000 / 10);
    }
    update(){
        if(this.players.length == 0){
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
