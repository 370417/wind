var width = 80;
var displayHeight = 25;
var gameHeight = 300;
var displayPosition = gameHeight - displayHeight;
var tileWidth, tileHeight;
var game;

//========================================
//                                   TILES

var Tiles = {
    player: {
        char: '@',
    },
    tree: {
        char: 'T',
    },
    ent: {
        char: 'E',
    },
    rotting: {
        char: 'R',
    },
    rootnorth: {
        char: '|',
    },
    rootnortheast: {
        char: '/',
    },
    rooteast: {
        char: '-',
    },
    rootsoutheast: {
        char: '\\',
    },
    rootsouth: {
        char: '|',
    },
    rootsouthwest: {
        char: '/',
    },
    rootwest: {
        char: '-',
    },
    rootnorthwest: {
        char: '\\',
    },
    dirt: {
        char: '.',
    },
    grass1: {
        char: ',',
    },
    grass2: {
        char: "'",
        flip: true,
    },
    grass3: {
        char: '"',
        flip: true,
    },
};

//========================================
//                                   LEVEL

var level = [];
for (var x = 0; x < width; x++) {
    level[x] = [];
    for (var y = 0; y < gameHeight; y++) {
        level[x][y] = {};
    }
}

//========================================
//                                 DISPLAY

var $game = document.getElementById('game');

// measure size of a tile
{
    var $tile = document.createElement('span');
    $tile.textContent = '@';
    $game.appendChild($tile);
    tileWidth = $tile.offsetWidth;
    tileHeight = $tile.offsetHeight;
    $game.removeChild($tile);
}

// create display level
var $level = [];
for (var x = 0; x < width; x++) {
    $level[x] = [];
}
for (var y = 0; y < displayHeight; y++) {
    for (var x = 0; x < width; x++) {
        var $tile = document.createElement('span');
        $tile.textContent = '-';
        $tile.style.top = y * tileHeight + 'px';
        $tile.style.left = x * tileWidth + 'px';
        $game.appendChild($tile);
        $level[x][y] = $tile;
    }
    $game.appendChild(document.createElement('br'));
}

// Set $game's dimensions so that it can be centered, then center it
$game.style.width = width * tileWidth + 'px';
$game.style.height = displayHeight * tileHeight + 'px';

//========================================
//                                WIND BAR

var windBar = 0;

var drawWindBar = () => {
    for (var x = 0; x < width; x++) {
        var $tile = $level[x][0];
        if (x <= windBar - 1) {
            $tile.textContent = '=';
            $tile.style.opacity = 1;
        } else if (x < windBar) {
            $tile.textContent = '=';
            $tile.style.opacity = 0.5 + (windBar - x) / 2;
        } else {
            $tile.textContent = '-';
            $tile.style.opacity = 0.5;
        }
    }
};

var addWind = (delta) => {
    windBar += delta;
};

//========================================
//                             DRAW EVENTS

var translateTile = (x, y, n) => {
    if (y > displayPosition && y < displayPosition + displayHeight) {
        var $tile = $level[x][y-displayPosition];
        $tile.style.top = (y - displayPosition) * tileHeight - Math.round(tileHeight * n / 8) + 'px';
    }
};

var setOpacity = (x, y, opacity) => {
    if (y > displayPosition && y < displayPosition + displayHeight) {
        var $tile = $level[x][y-displayPosition];
        if (level[x][y].actor) {
            if (inputModes) $tile.style.opacity = Math.max(opacity, $tile.style.opacity);
        } else {
            $tile.style.opacity = opacity;
        }
    }
};

var draw = (x, y) => {
    if (y > displayPosition && y < displayPosition + displayHeight) {
        var $tile = $level[x][y-displayPosition];
        if (level[x][y].actor) {
            $tile.textContent = level[x][y].actor.meta.char;
            setOpacity(x, y, 1);
        } else {
            $tile.textContent = level[x][y].meta.char;
            setOpacity(x, y, 0.75);
        }
    }
};

var setFlipped = (x, y) => {
    if (y > displayPosition && y < displayPosition + displayHeight) {
        var $tile = $level[x][y-displayPosition];
        var meta = level[x][y].actor ? level[x][y].actor.meta : level[x][y].meta;
        if (meta.flip) {
            $tile.style.transform = 'rotate(180deg)';
        } else {
            $tile.style.transform = 'none';
        }
    }
};

var updateTile = (x, y) => {
    draw(x, y);
    setFlipped(x, y);
};

var setTile = (x, y, type) => {
    level[x][y].meta = Tiles[type];
    updateTile(x, y);
};

var placeActor = (x, y, actor) => {
    level[x][y].actor = actor;
    actor.meta = Tiles[actor.type];
};

var moveActor = (x1, y1, x2, y2) => {
    level[x2][y2].actor = level[x1][y1].actor;
    level[x1][y1].actor = undefined;
    updateTile(x1, y1);
    setOpacity(x1, y1, 0.75);
    translateTile(x1, y1, 0);
    if (level[x2][y2].actor.type === 'player') {
        if (y2 < displayPosition + displayHeight / 2 && y2 > displayHeight / 2 - 1) {
            displayPosition--;
            for (var x = 0; x < width; x++) for (var y = displayPosition + 1; y < displayPosition + displayHeight; y++) {
                updateTile(x, y);
            }
        }
    }
    updateTile(x2, y2);
    setOpacity(x2, y2, 1);
    translateTile(x2, y2, 0);
};

//========================================
//                                  OUTPUT

var output = (e) => {
    var {type, value} = JSON.parse(e);

    if (type === 'new tile') {
        var {x, y, type} = value;
        setTile(x, y, type);
    }
    else if (type === 'new actor') {
        var {x, y, actor} = value;
        placeActor(x, y, actor);
    }
    else if (type === 'move actor') {
        var {x1, y1, x2, y2} = value;
        moveActor(x1, y1, x2, y2);
    }
    else if (type === 'set wind') {
        var {wind, maxWind} = value;
        addWind(wind - windBar);
        drawWindBar();
    }
};

//========================================
//                              START GAME

game = createGame({
    width,
    height: gameHeight,
    output,
});

//========================================
//                                   INPUT

var pushInput;
var popInput;
var inputMode;

//{
    var keyCode2code = {
        '13': 'Enter',
        '27': 'Escape',
        '32': 'Space',
        '37': 'ArrowLeft',
        '38': 'ArrowUp',
        '39': 'ArrowRight',
        '40': 'ArrowDown',
        '65': 'KeyA',
        '66': 'KeyB',
        '67': 'KeyC',
        '68': 'KeyD',
        '69': 'KeyE',
        '70': 'KeyF',
        '71': 'KeyG',
        '72': 'KeyH',
        '73': 'KeyI',
        '74': 'KeyJ',
        '75': 'KeyK',
        '76': 'KeyL',
        '77': 'KeyM',
        '78': 'KeyN',
        '79': 'KeyO',
        '80': 'KeyP',
        '81': 'KeyQ',
        '82': 'KeyR',
        '83': 'KeyS',
        '84': 'KeyT',
        '85': 'KeyU',
        '86': 'KeyV',
        '87': 'KeyW',
        '88': 'KeyX',
        '89': 'KeyY',
        '90': 'KeyZ',
    };

    var code2direction = {
        'KeyK': north,
        'KeyU': northeast,
        'KeyL': east,
        'KeyN': southeast,
        'KeyJ': south,
        'KeyB': southwest,
        'KeyH': west,
        'KeyY': northwest,
        'Numpad8': north,
        'Numpad9': northeast,
        'Numpad6': east,
        'Numpad3': southeast,
        'Numpad2': south,
        'Numpad1': southwest,
        'Numpad4': west,
        'Numpad7': northwest,
    };

    var cardinalDirections = {
        KeyW: north,
        KeyA: west,
        KeyS: south,
        KeyD: east,
        ArrowUp: north,
        ArrowLeft: west,
        ArrowDown: south,
        ArrowRight: east,
    };

    var inputModes = ['playing', 'animating'];
    inputMode = () => inputModes[inputModes.length-1];

    popInput = inputModes.pop.bind(inputModes);
    pushInput = inputModes.push.bind(inputModes);

    var modalKeydown = {
        animating: () => {},
        playing: (code) => {
            if (code2direction[code]) {
                var {dx, dy} = code2direction[code];
                game.input(JSON.stringify({
                    type: 'move',
                    value: {dx, dy},
                }));
            }
        },
    };

    var keydown = ({code, keyCode}) => {
        code = code || keyCode2code[e.keyCode];

        modalKeydown[inputMode()](code);
    };

    window.addEventListener('keydown', keydown, false);
//}

//========================================
//                            ANIMATE WIND

var turbulenceAmplitude = 5;
var turbulenceXFrequency = 5;
var turbulenceYFrequency = 10;
var gustPeriod = displayHeight / 4;

// perlin noise for distorning sinusoidal wind
var Turbulence = (amplitude) => {
    var turbulence = [];
    for (var x = 0; x < width; x++) {
        turbulence[x] = [];
    }

    var noise = Noise(Math.random());

    return (x, y) => {
        if (turbulence[x][y] === undefined) {
            turbulence[x][y] = amplitude * noise.perlin2(x / width * turbulenceXFrequency, y / width * turbulenceYFrequency);
        }
        return turbulence[x][y];
    };
};

var createGust = (phase, period, increment = 0.25) => {
    var turbulence = Turbulence(turbulenceAmplitude);
    return {
        wind: (x, y) => {
            y += turbulence(x, y);
            if (y > phase && y < phase + period) {
                var wind = Math.sin(2 * Math.PI / period * (y - phase));
                if (y > phase + period / 2) {
                    return wind;
                }
                return 1.5 * wind - 0.5;
            } else if (y > phase) {
                return 0;
            }
            return -4;
        },
        shift: () => {
            phase -= increment;
            return phase;
        },
    };
};

// whether the wind has passed through wind bar at a certain x-coordinate
var blown = [];

var blow = (gust) => {
    for (var x = 0; x < width; x++) for (var y = displayPosition; y < displayPosition + displayHeight; y++) {
        var wind = gust.wind(x, y);
        translateTile(x, y, wind);
        setOpacity(x, y, 0.75 + 0.25 * wind);
        if (y === displayPosition && wind > 0.85 && !blown[x]) {
            addWind(0.5);
            blown[x] = true;
        }
    }
    drawWindBar();
    var phase = gust.shift();
    if (phase > displayPosition - gustPeriod - turbulenceAmplitude) {
        requestAnimationFrame(blow.bind(0, gust));
    } else {
        popInput();
    }
}
blow(createGust(displayPosition + displayHeight + turbulenceAmplitude, gustPeriod));
