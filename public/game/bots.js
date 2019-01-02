class BotSkeleton {
  constructor(C) {
    this.cells = C.cells || [];
    this.lasthit = [];

    if (this.cells.length === 0) {
      for (let i = 0; i < C.WIDTH; i++) {
        this.cells.push([])
        for (let j = 0; j < C.HEIGHT; j++) {
          this.cells[i].push(EMPTY);
        }
      }
    }


    this.fun = C.fun;
    this.compare = function(obj1, obj2) {
      return (obj1.x === obj2.x && obj1.y === obj2.y);
    };
    this.w = C.WIDTH || C.width || 10;
    this.h = C.HEIGHT ||C.width || 10;
  }

  updateCells(eff, coord) {
    if (eff.hit) {
      this.cells[coord.x][coord.y] = SHIP;
      this.lasthit.push(coord);

      if (eff.kill) {
        eff.kill.adj.forEach(({x, y}) => this.cells[x][y] = GAP);
        this.lasthit.forEach(({x, y}) => this.cells[x][y] = SHIP);
        this.lasthit = [];
      }

    } else {
      this.cells[coord.x][coord.y] = GAP;
    }
  }
}



class RandomBot extends BotSkeleton {

  constructor(C) {
    super(C);
    this.freeCells = [];

    for (let i = 0; i < this.w; i++) {
      for (let j = 0; j < this.h; j++) {
        this.freeCells.push({ x: i, y: j });
      }
    }
  }

  act() {
    let index = Math.floor(Math.random() * this.freeCells.length);
    let coord = this.freeCells.splice(index, 1)[0];

    let eff = this.fun(coord.x, coord.y);

    this.updateCells(eff, coord);

    if (eff.kill) {
      this.freeCells = this.freeCells.filter(
        e => {
          for (let a of eff.kill.adj.concat(this.lasthit)) {
            if (this.compare(a, e)) return false;
          }
          return true;
        });
    }
  }
}





class FinishBot extends BotSkeleton{

  constructor(C) {
    super(C);
    this.freeCells = [];

    for (let i = 0; i < this.w; i++) {
      for (let j = 0; j < this.h; j++) {
        this.freeCells.push({ x: i, y: j });
      }
    }
  }


  has(right, up) {

    let index = this.lasthit.length > 1 ? this.lasthit.length - 1 : 0;

    let obj = Object.assign({}, this.lasthit[index]);
    if (right) obj.x += right;
    if (up) obj.y += up;

    if (obj.x >= this.w || obj.x < 0
      || obj.y < 0 || obj.y >= this.h) return false;

    // for (let i of this.freeCells) {
    //   if (this.compare(i, obj)) {
    //     return obj;
    //   }
    // }
    return obj;
  }

  act() {

    let coord;

    if (this.lasthit.length > 0) {

      let sides = [];

      sides.push(this.has(1, 0)); // right
      sides.push(this.has(-1, 0)); // left
      sides.push(this.has(0, 1)); // down
      sides.push(this.has(0, -1)); // up
      

      let cross = null;
      let empties = [];

      for (let i = 0; i < 4; i++) {
        if (sides[i]) {
          if (this.cells[sides[i].x][sides[i].y] === SHIP) {
            cross = i;
            empties.push(null);
          }
          else if (this.cells[sides[i].x][sides[i].y] === EMPTY) {
            empties.push(sides[i]);
          }
          else {
            empties.push(null);
          }
        }
        else {
          empties.push(null);
        }
      }

      let rand = () => {
        let p;
        if (this.lasthit.length > 1) {
          p = [];
        }
        else p = empties.filter(e => e !== null);

        console.log(empties);
        console.log(cross);

        if (p.length === 0) {
          _.reverse(this.lasthit);
          this.act();

          return true;
        }

        let index = Math.floor(Math.random() * p.length);
        coord = p[index];
      }

      if (cross !== null) {
        if (cross === 0 && empties[1]) {
          coord = empties[1];
        }
        else if (cross === 1 && empties[0]) {
          coord = empties[0];
        }
        else if (cross === 2 && empties[3]) {
          coord = empties[3];
        }
        else if(cross === 3 && empties[2]) {
          coord = empties[2];
        }
        else {
          if (rand()) return;
        }
      } else {
        if (rand()) return;
      }

      for (let i = 0; i < this.freeCells.length; i++) {
        if (this.compare(this.freeCells[i], coord)) {
          this.freeCells.splice(i, 1)[0];
          break;
        }
      }

    } else {
      let index = Math.floor(Math.random() * this.freeCells.length);
      coord = this.freeCells.splice(index, 1)[0];
    }


    let eff = this.fun(coord.x, coord.y);

    this.updateCells(eff, coord);

    if (eff.kill) {
      this.freeCells = this.freeCells.filter(
        e => {
          for (let a of eff.kill.adj.concat(this.lasthit)) {
            if (this.compare(a, e)) return false;
          }
          return true;
        });
    }
    return coord;
  }
}
