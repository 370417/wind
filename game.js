var createGame = ({width, height, output}) => {

    //========================================
    //                                   ACTOR

    var createActor = (type, level, x, y) => {

        var act = function() {
            return this[this.state];
        };

        var playing = function() {

        };

        var move = function(dx, dy) {
            this.lastMove = {dx, dy};

            level[this.x][this.y].actor = undefined;
            this.x += dx;
            this.y += dy;
            level[this.x][this.y].actor = this;

            output(JSON.stringify({
                type: 'move actor',
                value: {
                    x1: this.x - dx,
                    y1: this.y - dy,
                    x2: this.x,
                    y2: this.y,
                },
            }));
        };

        var addWind = function(wind) {
            if (player.wind) {
                player.wind += wind;
            } else {
                player.maxWind += 2 * wind;
            }
            if (player.wind > player.maxWind) {
                player.wind = player.maxWind;
            }
            output(JSON.stringify({
                type: 'set wind',
                value: {
                    wind: player.wind,
                    maxWind: player.maxWind,
                },
            }));
        };

        var playerMove = function(dx, dy) {
            var { dx: lastdx, dy: lastdy } = this.lastMove;
            if ((lastdx || lastdy) && adjacentDirection(lastdx, lastdy, dx, dy)) {
                addWind(0.5);
            } else {
                addWind(-1);
            }

            move.call(this, dx, dy);
        };

        var prototype = {
            act,
            move,
            state: 'sleeping',
            lastMove: { dx: 0, dy: 0 },
        };

        var actors = {
            player: {
                state: 'playing',
                move: playerMove,
                wind: 40,
                maxWind: 80,
            },
            tree: {

            },
        };

        var actor = Object.assign(prototype, actors[type], {type, x, y});
        level[x][y].actor = actor;

        return actor;

    };

   //========================================
    //                                   LEVEL

    var createLevel = ({width, height}) => {

        // setup level array
        var level = [];
        for (var x = 0; x < width; x++) {
            level[x] = [];
            for (var y = 0; y < height; y++) {
                level[x][y] = {
                    terrain_noise: 0,
                };
            }
        }

        // add noise
        for (var octave = 0; octave < 2; octave++) {
            var i = Math.pow(2, octave);
            var zoom = 4 * i / width;
            var amplitude = 1 / i;
            var noise = Noise(Math.random());
            for (var x = 0; x < width; x++) for (var y = 0; y < height; y++) {
                level[x][y].terrain_noise += amplitude * noise.perlin2(x * zoom, y * zoom);
            }
        }

        // place grass based on noise
        for (var x = 0; x < width; x++) for (var y = 0; y < height; y++) {
            var tile = level[x][y];
            if (tile.terrain_noise < -0.3) {
                tile.type = 'dirt';
            } else if (tile.terrain_noise < 0) {
                tile.type = 'grass1';
            } else if (tile.terrain_noise < 0.2) {
                tile.type = 'grass2';
            } else {
                tile.type = 'grass3';
            }
        }

        var isNeighborhoodEmpty = (x, y) => {
            for (var i = 0; i < 8; i++) {
                var {dx, dy} = directions[i];
                if (level[x+dx][y+dy].actor) {
                    return false;
                }
            }
            return !level[x][y].actor;
        };

        // add Trees
        var treeCount = 0;
        var maxTrees = (width * height) / (height - width);
        while (treeCount < maxTrees) {
            var x = 1 + randInt(width - 2);
            var y = 1 + randInt(height - 20);
            if (isNeighborhoodEmpty(x, y)) {
                var tree = createActor('tree', level, x, y);
                var root1 = directions[randInt(8)];
                var root2 = root1.clockwise.clockwise;
                var root3 = root2.clockwise.clockwise.clockwise;
                root1 = createActor('root' + root1.name, level, x + root1.dx, y + root1.dy);
                root2 = createActor('root' + root2.name, level, x + root2.dx, y + root2.dy);
                root3 = createActor('root' + root3.name, level, x + root3.dx, y + root3.dy);
                treeCount++;
            }
        }

        // add Ents
        var entCount = 0;
        var maxEnts = width / 2;
        while (entCount < maxEnts) {
            var x = 1 + randInt(width - 2);
            var y = 1 + randInt(height * 7 / 8);
            if (isNeighborhoodEmpty(x, y)) {
                var ent = createActor('ent', level, x, y);
                entCount++;
            }
        }

        // add Rotting trees
        var rottingCount = 0;
        var maxRotting = (width * width) / (height - width);
        while (rottingCount < maxRotting) {
            var x = 1 + randInt(width - 2);
            var y = 1 + randInt(height * 5 / 6);
            if (isNeighborhoodEmpty(x, y)) {
                var rotting = createActor('rotting', level, x, y);
                var root1 = directions[randInt(8)];
                var root2 = root1.clockwise.clockwise;
                var root3 = root2.clockwise.clockwise.clockwise;
                root1 = createActor('root' + root1.name, level, x + root1.dx, y + root1.dy);
                root2 = createActor('root' + root2.name, level, x + root2.dx, y + root2.dy);
                root3 = createActor('root' + root3.name, level, x + root3.dx, y + root3.dy);
                rottingCount++;
            }
        }

        return level;

    };

    var level = createLevel({width, height});

    var player = createActor('player', level, Math.floor(width / 2), height - 12);

    for (var x = 0; x < width; x++) for (var y = 0; y < height; y++) {
        if (level[x][y].actor) {
            output(JSON.stringify({
                type: 'new actor',
                value: {
                    x,
                    y,
                    actor: {
                        type: level[x][y].actor.type,
                    },
                },
            }));
        }
        output(JSON.stringify({
            type: 'new tile',
            value: {
                x,
                y,
                type: level[x][y].type,
            },
        }));
    }

    var input = (e) => {
        var {type, value} = JSON.parse(e);

        if (type === 'move') {
            var {dx, dy} = value;
            var x = player.x + dx;
            var y = player.y + dy;
            if (x >= 0 && x < width && y >= 0 && y < gameHeight) {
                player.move(dx, dy);
            }
        }
    };

    return {input};

};
