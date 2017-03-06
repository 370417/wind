//========================================
//                              DIRECTIONS

var north = { dx: 0, dy: -1, char: '|', name: 'north' };
var northeast = { dx: 1, dy: - 1, char: '/', name: 'northeast' };
var east = { dx: 1, dy: 0, char: '-', name: 'east' };
var southeast = { dx: 1, dy: 1, char: '\\', name: 'southeast' };
var south = { dx: 0, dy: 1, char: '|', name: 'south' };
var southwest = { dx: -1, dy: 1, char: '/', name: 'southwest' };
var west = { dx: -1, dy: 0, char: '-', name: 'west' };
var northwest = { dx: -1, dy: -1, char: '\\', name: 'northwest' };

var directions = [north, northeast, east, southeast, south, southwest, west, northwest, north];
directions[-1] = northwest;

for (var i = 0; i < 8; i++) {
    directions[i].clockwise = directions[i+1];
    directions[i].counterclockwise = directions[i-1];
}

var dxdy2direction = {
    '-1': {
        '-1': northwest,
        '0': west,
        '1': southwest,
    },
    '0': {
        '-1': north,
        '1': south,
    },
    '1': {
        '-1': northwest,
        '0': east,
        '1': southeast,
    },
};

var clockwise = (dx, dy) => {
    return dxdy2direction[dx][dy].clockwise;
};
var counterclockwise = (dx, dy) => {
    return dxdy2direction[dx][dy].counterclockwise;
};

var adjacentDirection = (dx1, dy1, dx2, dy2) => {
    if (dx1 === dx2 && dy1 === dy2) {
        return true;
    }
    var clock = clockwise(dx1, dy1);
    if (clock.dx === dx2 && clock.dy === dy2) {
        return true;
    }
    var counter = counterclockwise(dx1, dy1);
    if (counter.dx === dx2 && counter.dy === dy2) {
        return true;
    }
    return false;
};

//========================================
//                              DIRECTIONS

var randInt = (n) => Math.floor(n * Math.random());
