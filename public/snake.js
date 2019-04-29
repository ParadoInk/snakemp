let socket;
let cnv, names, scores;
let apple, players;
const tileSize = 10;
let gameState;

function setup(){
    blendMode(REPLACE);
    cnv = createCanvas(640, 480);
    centerCanvas();
    names = document.getElementById("names").childNodes;
    scores = document.getElementById("scores").childNodes;
    socket = io();
    socket.on('tick', function(data){
        apple = data["apple"];
        players = data["players"];
        draw();
    });
    socket.on('death', function(data){
       gameState = "menu";
       document.getElementById("menu").style.opacity = "0.0";
       document.getElementById("menu").style.display = 'inline';
       for(let i = 0; i < 101; i++){
           setTimeout(function(n){
               document.getElementById("menu").style.opacity = "" + n/100;
           }, 10 * i, i);
       }
    });
    gameState = "menu";
    noLoop();
}

function draw(){
    background(0);
    fill([255, 0, 0]);
    rect(apple[0] * tileSize, apple[1] * tileSize, tileSize, tileSize);
    let top5 = [];
    players.forEach(function(player){
        fill((player[0]["color"]));
        for(let i = 1; i < player.length; i++){
            rect(player[i][0] * tileSize, player[i][1] * tileSize, tileSize, tileSize);
        }
        if(top5.length == 0){
            top5.push(player[0]);
        }
        else if(top5.length < 5){
            for(let i = top5.length - 1; i >= 0; i--){
                if(top5[i]["score"] > player[0]["score"]){
                    top5.splice(i + 1, 0, player[0]);
                }
                else if(i == 0) {
                    top5.splice(0, 0, player[0]);
                }
            }
        }
        else if(top5[4]["score"] < player[0]["score"]){
            for(let i = 3; i >= 0; i--){
                if(top5[i]["score"] > player[0]["score"]){
                    top5.splice(i + 1, 0, player[0]);
                    top5.pop();
                }
                else if(i == 0) {
                    top5.splice(0, 0, player[0]);
                    top5.pop();
                }
            }
        }
    });
    for(let i = 0; i < 5; i++){
        if(i >= top5.length){
            scores[i * 2 + 1].innerHTML = "";
            names[i * 2 + 1].innerHTML = "";
        }
        else {
            scores[i * 2 + 1].innerHTML = top5[i]["score"];
            if(top5[i]["name"].length > 9){
                top5[i]["name"] = top5[i]["name"].substring(0, 10);
            }
            names[i * 2 + 1].innerHTML = top5[i]["name"];
        }
    }

}

function play(){
    gameState = "ingame";
    document.getElementById("menu").style.display = 'none';
    socket.emit('newplayer', {
        "name": document.getElementById("usernameinpt").value
    });
}

function centerCanvas(){
    let x = (windowWidth - width) / 2;
    let y = 2 * (windowHeight - height) / 5;
    cnv.position(x, y);
    document.getElementById("scoreboard").style.top = document.getElementById("defaultCanvas0").style.top;
    document.getElementById("scoreboard").style.display = "inline-block";
    document.getElementById("sourcecode").style.top = "calc(" + document.getElementById("defaultCanvas0").style.top + " + 300px)";
    document.getElementById("sourcecode").style.display = "inline-block";

}

function windowResized(){
    centerCanvas();
}

function changeDir(dir){
    socket.emit('changeDir', {
        "dir": dir
    });
}

const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
function keyPressed(){
    if(gameState == "menu"){
        if(keyCode == 13){
            play();
        }
    }
    else if(gameState == "ingame"){
        if(keyCode == 87){
            changeDir(UP);
        } else if(keyCode == 68){
            changeDir(RIGHT);
        } else if(keyCode == 83){
            changeDir(DOWN);
        } else if(keyCode == 65){
            changeDir(LEFT);
        }
    }
}