
const EMPTY = 0
GAP = 1
SHIP = 2
MARK = 3
DIM = 4;

 //   _____ _    _ _____ _____     _____ _                _____ _____
 //  / ____| |  | |_   _|  __ \   / ____| |        /\    / ____/ ____|
 // | (___ | |__| | | | | |__) | | |    | |       /  \  | (___| (___
 //  \___ \|  __  | | | |  ___/  | |    | |      / /\ \  \___ \\___ \
 //  ____) | |  | |_| |_| |      | |____| |____ / ____ \ ____) |___) |
 // |_____/|_|  |_|_____|_|       \_____|______/_/    \_\_____/_____/
 //

class Ship {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.inds = [];
    for (let x = start.x; x <= end.x; x++) {
      for (let y = start.y; y <= end.y; y++) {
        this.inds.push({
          x,
          y,
          alive: true
        });
      }
    }

    let w = this.width();
    let h = this.height();
    if (w < h) {
      let t = w;
      w = h;
      h = t;
    }
    this.key = `${w}.${h}`;
  }

  // check is mouse (any coordinate) is inside this ship
  check(x, y, act) {
    for (let i of this.inds) {
      if (i.x === x && i.y === y) {
        if (!i.alive) return false;
        if (act) i.alive = false;
        return true;
      }
    }
    return false;
  }


  // shoot the ship and respond with the effects
  shoot(x, y) {

    // check if it shot the ship
    if (this.check(x, y, true)) {
      return {
        hit: true,

              // check if the shot killed the ship
        kill:
          this.inds.reduce((a, b) => a || b.alive, false)
            // add this ship if it did
            ? null : this
      };
    }
    // it did not
    else {
      return {
        hit: false,
        kill: null
      }
    }
  }


  outshape() {
    let r = {
      corns: [],
      tops: [],
      lefts: [],
      rights: [],
      bots: []
    };

    let s = { x: this.start.x, y: this.start.y };
    let f = { x: this.end.x, y: this.end.y };

    r.corns = [s,
      { x: f.x, y: s.y },
      { x: s.x, y: f.y },
      f];

    for (let i = s.x; i <= f.x; i++) {
      r.tops.push({ x: i, y: s.y });
      r.bots.push({ x: i, y: f.y });
    }

    for (let i = s.y; i <= f.y; i++) {
      r.lefts.push ({ x: s.x, y: i });
      r.rights.push({ x: f.x, y: i });
    }

    return r;
  }

  width() {
    return this.end.x - this.start.x + 1;
  }

  height() {
    return this.end.y - this.start.y + 1;
  }

  length() {
    let w = this.width();
    let h = this.height();
    return w > h ? w : h;
  }

}


 //  _______ _    _ ______   _      ____   _____ _____ _____
 // |__   __| |  | |  ____| | |    / __ \ / ____|_   _/ ____|
 //    | |  | |__| | |__    | |   | |  | | |  __  | || |
 //    | |  |  __  |  __|   | |   | |  | | | |_ | | || |
 //    | |  | |  | | |____  | |___| |__| | |__| |_| || |____
 //    |_|  |_|  |_|______| |______\____/ \_____|_____\_____|
 //

// instantiate logic
var createLogic = function(C) {
  let p = {};
  bindLogic(p, C);
  return p;
}



var bindConstants = function(p, C) {
  if (!p) p = {};
  if (!C) C = {};

  p.WIDTH = C.WIDTH || 10;
  p.HEIGHT = C.HEIGHT || 10;

  p.type = C.type || 'hidden'; // hidden or visible (mine or enemy)
  p.handleClick = C.click || function() {};
  p.win = C.win || function() {};
  p.lose = C.lose || function() {};

  if (p.type === 'hidden' || p.type === 'both') {

    // enemy board
    p.cells = C.cells ||
      _.chunk(
        _.chunk(
          _.fill(Array(p.WIDTH * p.HEIGHT), 0),
          p.HEIGHT),
        p.WIDTH)[0];
  }
  if (p.type === 'visible'|| p.type === 'both') {

    // my boards
    p.ships = C.ships || [];
    p.deadShips = C.deadShips || [];
    p.gaps = C.gaps || []; // shot empty spaces
    p.occupiedCells = C.occupiedCells || [];

    // static schema
    p.SCHEMA = C.SCHEMA || {
      '4.1': 1,
      '3.1': 2,
      '2.1': 3,
      '1.1': 4
    };

    // dynamic schema. this will be changed as user adds new ships
    p.schema = C.schema || Object.assign({}, p.SCHEMA);

    p.ingame = C.ingame || false;

    p.freeCells = [];

    p.resetFreeCells = function() {
      for (let i = 0; i < p.WIDTH; i++) {
        for (let j = 0; j < p.HEIGHT; j++) {
          p.freeCells.push({ x: i, y: j });
        }
      }
    }

    p.SILH = C.silh !== undefined ? C.silh :
            C.SILH !== undefined ? C.SILH :
            C.silhouette !== undefined ? C.silhouette : true;

    p.CURSOR = C.cursor !== undefined ? C.cursor :
      C.CURSOR !== undefined ? C.CURSOR : true;
  }
  return p;
}


// Logic with no sketch
var bindLogic = function(p, C) {
  bindConstants(p, C);


  p.clone = function() {
    let p_ = createLogic(C);
    p_.ships = p.ships.map(ship => {
      let newShip = new Ship(ship.start, ship.end);
      newShip.inds = _.cloneDeep(ship.inds);
      newShip.adj = _.cloneDeep(ship.adj);
    })
    p_.gaps = _.cloneDeep(p.gaps);
    p_.marks = _.cloneDeep(p.marks);
    return p_;
  }

  p.calcAdjacent = function(ship) {

    let result = [];

    let shift = function(obj, i, j) {
      return ({
        x: obj.x + i || 0,
        y: obj.y + j || 0
      });
    }

    // shish = shift + push
    let shish = function(obj, i, j) {
      result.push(shift(obj, i, j));
    }

    let shiftAll = function(objs, i, j) {
      for (let obj of objs) {
        shish(obj, i, j);
      }
    }

    // get outer shape cells of the ship
    let os = ship.outshape();

    // check if an index would be off the screen
    let x0 = ship.start.x > 0;
    let xw = ship.end.x < p.WIDTH - 1;
    let y0 = ship.start.y > 0;
    let yh = ship.end.y < p.HEIGHT - 1;

    // left and right adjacent cells
    if (x0) {
      shiftAll(os.lefts, -1, 0);
    }
    if (y0) {
      shiftAll(os.tops, 0, -1);
    }
    if (yh) {
      shiftAll(os.bots, 0, 1);
    }
    if (xw) {
      shiftAll(os.rights, 1, 0);
    }

    // diagonal adjacent cells
    if (x0 && y0) {
      shish(os.corns[0], -1, -1); // left top corner
    }
    if (xw && y0) {
      shish(os.corns[1], 1, -1); // right top corner
    }
    if (x0 && yh) {
      shish(os.corns[2], -1, 1); // left bottom corner
    }
    if (xw && yh) {
      shish(os.corns[3], 1, 1); // right bottom corner
    }

    return result;
  }


  p.click = function(x, y) {
    p.handleClick(x, y, p)
  }


  p.compare = function(obj1, obj2) {
    return (obj1.x === obj2.x && obj1.y === obj2.y);
  }

  // enemy board
  if (p.type === 'hidden' || p.type === 'both') {

    p.record = function(x, y, r) {
      if (r.hit) {
        p.cells[x][y] = SHIP;
        if (r.kill) {
          enemyNavy.kill(r.kill.adj);
          if (r.win) {
            p.win();
          }
        }
      }
      else {
        p.cells[x][y] = GAP;
      }
    }

    // set a space to some type
    p.set = function(x, y, type) {
      p.cells[x][y] = type;
    }

    // finds out if the space is empty
    p.isEmpty = function(x, y) {
      if (x > p.WIDTH || y > p.WIDTH || x < 0 || y < 0) {
        console.log('You\'re checking a cell that is off the screen');
        return false;
      }
      return p.cells[x][y] === 0;
    }

    // turn cells around the ship into gaps
    p.kill = function(cells) {
      for (let c of cells) {
        p.cells[c.x][c.y] = GAP;
      }
    }


  // my board
  }
  if (p.type === 'visible' || p.type === 'both') {

    // finds out if the space is empty
    p.isEmpty = function(x, y) {
      if (x > p.WIDTH || y > p.HEIGHT || x < 0 || y < 0) return false;

      // check for ships
      for (let ship of p.ships) {
        if (x >= ship.start.x && x <= ship.end.x &&
          y >= ship.start.y && y <= ship.end.y) {
          return false;
        }
      }

      // check for dead ships
      for (let ship of p.deadShips) {
        if (x >= ship.start.x && x <= ship.end.x &&
          y >= ship.start.y && y <= ship.end.y) {
          return false;
        }
      }

      // check for gaps
      for (let gap of p.gaps) {
        if (x === gap.x && y === gap.y) {
          return false;
        }
      }
      return true;

    }


    // ensure the start has the least coordinates and
    // the end has the greatest ones
    p.matchEnds = function(one, two) {

      let start = Object.assign({}, one)
      let end = Object.assign({}, two)

      // check X coordinates (indeces)
      if (start.x > end.x) {
        let t = start.x;
        start.x = end.x;
        end.x = t;
      }

      // check Y coordinates (indeces)
      if (start.y > end.y) {
        let t = start.y;
        start.y = end.y;
        end.y = t;
      }

      return {
        start,
        end
      }
    }


    // update dynamic schema after creating new ship
    p.updateSchema = function(ship) {
      if (p.SCHEMA === 'any' || p.debugging) {
        return;
      }

      if (p.schema[ship.key] === undefined) {
        throw 'Such ship configuration is not permitted';
      }

      p.schema[ship.key]--;

      if (p.schema[ship.key] < 0) {
        throw 'Error. Too many ' + ship.key + ' ships.';
      }
    }


    // check if the ship can be created (if the game rules allow this)
    p.meetCriteria = function(ship) {

      if (!p.shipSilhouette) return true;

      if (p.debugging) return p.shipSilhouette.meetsCriteria = true;

      if (p.SCHEMA !== 'any') {

        // Check the dimensions of the ship
        let key = p.shipSilhouette.key;
        if (!(p.schema[key] && p.schema[key] > 0)) {
          return p.shipSilhouette.meetsCriteria = false;
        }
      }

      // Check availability of spaces
      for (let cell of p.occupiedCells) {
        for (let i of p.shipSilhouette.inds) {
          if (p.compare(cell, i)) {
            return p.shipSilhouette.meetsCriteria = false;
          }
        }
      }

      return p.shipSilhouette.meetsCriteria = true;
    }


    // return new ship
    p.createShip = function(start, end) {
      return new Ship(start, end);
    }

    // just add an existing ship and update shema and such
    p._addShip = function(ship) {

      p.ships.push(ship);

      // Update occupiedCells
      let adj = p.calcAdjacent(ship);

      for (let i of ship.inds.concat(adj)) {
        p.occupiedCells.push({ x: i.x, y: i.y });
      }

      // update free cells
      p.freeCells = p.freeCells.filter(cell => {

        for (let i of ship.inds.concat(adj)) {
          if (p.compare(i, cell)) {
            return false;
          }
        }
        return true;
      })

      ship.adj = adj;
      ship.span = ship.inds.length + adj.length;

      // update schema
      p.updateSchema(ship);
    }


    // create and add the ship to ships
    p.addShip = function(start, end) {

      // create the actual ship
      let ends = p.matchEnds(start, end);
      let newborn = p.createShip(ends.start, ends.end);

      p._addShip(newborn);

      // return new ship
      return newborn;
    }


    // delete latest ship
    p.undo = function() {
      if (p.ingame) return;
      if (p.ships.length === 0) return;
      let ship = p.ships.splice(-1, 1)[0];
      // update occupied cells
      p.occupiedCells.splice(-ship.span, ship.span);
      p.schema[ship.key]++;
    }


    // destroy a ship
    p.finish = function(ship) {

      let has = function(el) {
        for (let i = 0; i < p.gaps.length; i++) {
          if (p.compare(p.gaps[i], el)) {
            return i;
          }
        }
        return -1;
      }

      // add cell to gaps if it's not already there
      for (let cell of ship.adj) {
        if (has(cell) === -1) {
          p.gaps.push(cell);
        }
      }
    }

    // shoot a cell specified by coordinates
    p.shoot = function(x, y, type) {

      // check if hit a ship
      for (let i = 0; i < p.ships.length; i++) {

        let eff = p.ships[i].shoot(x, y);

        if (eff.hit) {

          if (eff.kill) {
            let deadShip = p.ships.splice(i, 1)[0];
            p.finish(deadShip);
            p.deadShips.push(deadShip);

            if (p.ships.length === 0) {
              eff.win = true;
            } else {
              eff.win = false;
            }
          }
          return eff || 'error';
        }
      }

      // it did not hit any ships
      let notHitYet = true;

      // check if hit a gap
      for (let g of p.gaps) {
        if (g.x === x && g.y === y) {
          notHitYet = false; // it did
        }
      }

      // make the gap
      if (notHitYet) {
        p.gaps.push({ x, y, type: type || GAP });
        return {
          hit: false,
          kill: null,
          win: false
        }
      }

      return 'error';
    }


    // return this board as hidden in form of a 'cells' 2d array
    p.toCells = function() {
      let cells = _.chunk(_.fill(Array(p.WIDTH * p.HEIGHT), 0), p.HEIGHT);
      p.deadShips.forEach(
        ship => ship.inds.forEach(
          ({ x, y }) => cells[x][y] = SHIP));

      p.gaps.forEach(({ x, y }) => cells[x][y] = GAP);

      return cells;
    }
  }
}
