class SmartBot extends BotSkeleton {

  constructor(C) {
    super(C);
    this.C = Object.assign({}, C);
    this.brain = new NeuralNetwork([this.w * this.h, 10, 10, this.w * this.h]);
    this.score = 0;
    this.name = C.name || randName(' ');
    if (!C.name) {
      this.C.name = this.name;
    }
    this.id = C.id || 0;

    this.shoots = 0;
    this.lasts = [];
  }

  think() {
    let flat = _.flatten(this.cells);
    // let crosses = flat.map(cell => cell === SHIP ? 1 : 0);
    let gaps = flat.map(cell => cell === GAP ? 1 : 0);
    // let input = [...crosses, ...gaps];

    let output = this.brain.predict(gaps);

    let x = Math.floor(output / this.h);
    let y = output % this.h;

    return { x, y };
  }

  act() {
    if (this.win) {
      this.score += 0.1;
      return;
    }
    if (this.stuck) {
      return;
    }

    this.shoots++;

    let coord = this.think();

    let eff = this.fun(coord.x, coord.y, MARK);

    // punish bots fore shooting the same cell
    for (let k of Object.keys(this.lasts)) {
      this.lasts[k]++;
      this.score += 0.05;
    }

    let key = `${coord.x}.${coord.y}`;
    if (!this.lasts[key] || this.lasts[key] > 5) {
      this.lasts[key] = eff === 'error' ? 1 : 3;
    } else {
      this.score -= 0.5;
      this.lasts[key] = 1;
    }


    if (eff !== 'error') {
      this.updateCells(eff, coord);
    }

    this.updateScore(eff);

  }

  updateScore(eff) {
    if (eff === 'error') {
      this.stuck = true;
      this.score -= Math.random() / 50;
      return;
    }

    this.score += 1 + Math.random() / 10;

    if (eff.hit) {
      this.score += 5;
    }

    if (eff.kill) {
      this.score += eff.kill.span * 0.2 + 5;
    }

    if (eff.win) {
      this.score += 10;
      this.win = true;
    }

  }

  kill() {
    this.brain.dispose();
  }

  clone() {
    let clonie = new SmartBot(this.C);
    clonie.brain.set(this.brain);
    clonie.score = this.score;
    clonie.id = this.id;
    return clonie;
  }


  crossover(partner) {

    function f(x) {
      if (Math.random() < MUTATION_RATE) {
        let offset = -3;
        for (let i = 0; i < 6; i ++) {
          offset += Math.random();
        }
        offset /= 6;

        return x + offset;
      }
      return x;
    }

    // perform crossover on all the biases or all the weights of the two parents
    // A is the first parent's weights/biases
    // B is the second parent's weights/biases
    // And mutate them
    function crossOne(A, B) {
      let arr = []
      for (let i = 0; i < A.length; i++) {

        // get tensors into arrays
        let a = A[i].dataSync();
        let b = B[i].dataSync();


        // choose values randomly
        let r = Math.random();

        let vals = [];
        for (let i = 0; i < a.length; i++) {
          if (Math.random() > r) {
            vals.push(a[i])
          } else {
            vals.push(b[i])
          }
        }

        // mutate
        vals = vals.map(f)

        let shape = A[i].shape;

        arr.push(tf.tensor(vals, shape));
      }
      return arr;
    }

    let child = new SmartBot(this.C);

    child.brain.weights = crossOne(this.brain.weights, partner.brain.weights);
    child.brain.biases = crossOne(this.brain.biases, partner.brain.biases);

    let name = randName(' ', _.concat(this.name.split(' '), partner.name.split(' ')));

    child.C.name = name;
    child.name = name;

    return child;
  }


  reset(cells, fun) {
    this.lasthit = [];
    this.cells = _.cloneDeep(cells);
    this.win = false;
    this.stuck = false;
    this.fun = fun;
  }



}
