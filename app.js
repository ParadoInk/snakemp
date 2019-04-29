const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
let game = null;
const colors = [[255, 255, 255], [255, 0, 255], [0, 0, 255], [0, 255, 255], [255, 255, 0], [196, 0, 60]];
const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
const lengthIncrease = 3;

app.use(express.static(__dirname + "/public"));
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/snake.html');
});

io.on('connection', function(socket){
    socket.on('newplayer', function(data){
        if(game == null){
            game = new Game();
        }
        game.players.push(new Player(data["name"], socket.id));
    });
    socket.on('changeDir', function(data){
        if(game != null){
            for(let i = 0; i < game.players.length; i++){
                if(game.players[i].id == socket.id){
                    game.players[i].changeDir(data["dir"]);
                }
            }
        }
    });
    socket.on('disconnect', function(data){
        for(let i = 0; game != null && i < game.players.length; i++){
            if(game.players[i].id == socket.id){
                game.players[i].die();
            }
        }
    });
});

http.listen(process.env.PORT || 3000, function(){
    console.log("Hello World!");
});

class Player {
    constructor(name, id){
        this.name = name;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.tail = [];
        this.head = game.safeSpawnPos();
        this.dir = RIGHT;
        this.nextDir = this.dir;
        this.length = 3;
        this.id = id;
        this.dead = false;
    }

    get data(){
        return {"name": this.name,
                "color": this.color,
                "score": this.tail.length + 1};
    }

    changeDir(newDir){
        if(this.dir != newDir - 2 && this.dir != newDir + 2){
            this.nextDir = newDir;
        }
    }

    move(){
        if(!this.dead){
            this.dir = this.nextDir;
            this.tail.push([this.head[0], this.head[1]]);
            if(this.dir == RIGHT){
                this.head[0]++;
            } else if(this.dir == LEFT){
                this.head[0]--;
            } else if(this.dir == UP){
                this.head[1]--;
            } else if(this.dir == DOWN){
                this.head[1]++;
            }
            while(this.tail.length >= this.length){
                this.tail.shift();
            }
        }
    }

    collide(){
        if(!this.dead){
            if(this.head[0] == game.apple[0] && this.head[1] == game.apple[1]){
                this.length += lengthIncrease;
                game.spawnApple();
            }
            if(this.head[0] < 0 || this.head[0] > 63 || this.head[1] < 0 || this.head[1] > 47){
                this.die();
                return;
            }
            let parr = game.playerArr();
            for(let j = 0; j < parr.length; j++){
                let add = 0;
                if(game.players[j].id == this.id){
                    add = 1;
                }
                for(let i = 1 + add; i < parr[j].length; i++){
                    if(this.head[0] == parr[j][i][0] && this.head[1] == parr[j][i][1]){
                        this.die();
                        return;
                    }
                }
            }
        }
    }

    die(){
        for(let i = 0; i < game.players.length; i++){
            if(game.players[i].id == this.id){
                game.players.splice(i, 1);
            }
        }
        io.to(this.id).emit('death', {

        });
        this.dead = true;
    }
}

class Game {
    constructor(){
        this.players = [];
        this.apple = [];
        this.spawnApple();
        this.gameloop = setInterval(function(g){
            if(game != null){
                game.loop();
            }
        }, 1000 / 20);
    }
    loop(){
        if(this.players.length == 0){
            clearInterval(this.gameloop);
            game = null;
        }
        this.players.forEach(function(p){
            p.move();
        });
        this.players.forEach(function(p){
            p.collide();
        });

        io.emit('tick', {
            "apple": this.apple,
            "players": this.playerArr()
        });

    }
    spawnApple(){
        let trypos = [Math.floor(Math.random() * 64), Math.floor(Math.random() * 48)];
        while(this.illegalApple(trypos)){
            trypos = [Math.floor(Math.random() * 64), Math.floor(Math.random() * 48)];
        }
        this.apple = trypos;
    }
    illegalApple(pos){
        this.playerArr().forEach(function(p){
            for(let i = 1; i < p.length; i++){
                if(p[i][0] == pos[0] && p[i][1] == pos[1]){
                    return true;
                }
            }
        });
        return false;
    }
    playerArr(){
        let retarr = [];
        this.players.forEach(function(p){
            let addarr = [];
            addarr.push(p.data);
            addarr.push(p.head);
            p.tail.forEach(function(t){
                addarr.push(t);
            });
            retarr.push(addarr);
        });
        return retarr;
    }
    safeSpawnPos(){
        let failed = 8;
        let attempt = [Math.floor(Math.random() * 56), Math.floor(Math.random() * 48)];
        while(this.illegalAttempt(attempt, failed)){
            failed--;
            if(failed < 2){
                attempt = [Math.floor(Math.random() * 56), Math.floor(Math.random() * 48)];
                while(this.illegalApple(attempt)){
                    attempt = [Math.floor(Math.random() * 56), Math.floor(Math.random() * 48)];
                }
                return attempt;
            }
        }
        return attempt;
    }
    illegalAttempt(attempt, strict){
        this.playerArr().forEach(function(p){
            for(let i = 1; i < p.length; i++){
                if((p[i][0] - attempt[0]) < strict && (p[i][0] - attempt[0]) > 0 && Math.abs(p[i][1] - attempt[1]) < strict){}
                return true;
            }
        });
        return false;
    }
}