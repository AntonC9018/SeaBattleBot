class SmartBot extends BotSkeleton {

  constructor(C) {
    super(C);
    this.C = Object.assign({}, C);
    this.brain = new NeuralNetwork([100, 30, 30, 30, 100]);
    this.score = 0;
    this.name = C.name || randName(' ');
    if (!C.name) {
      this.C.name = this.name;
    }
    this.id = C.id || 0;
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

    let coord = this.think();

    let eff = this.fun(coord.x, coord.y, MARK);

    if (eff !== 'error') {
      this.updateCells(eff, coord);
    }

    this.updateScore(eff);

  }

  updateScore(eff) {
    if (eff === 'error') {
      this.stuck = true;
      this.score -= Math.random();
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



  mutate() {

    function f(x) {
      if (Math.random() < MUTATION_RATE) {
        let offset = -3;
        for (let i = 0; i < 6; i ++) {
          offset += Math.random();
        }
        offset /= 3;

        return x + offset;
      }
      return x;
    }

    let mapping = e => {
      let x = e.dataSync().map(f);
      let shape = e.shape;
      e.dispose();
      return tf.tensor(x, e.shape);
    }

    this.brain.weights = this.brain.weights.map(mapping);
    this.brain.biases = this.brain.biases.map(mapping);

    // let i_weights = this.brain.input_weights.dataSync().map(f);
    // this.brain.input_weights.dispose();
    // this.brain.input_weights = tf.tensor(i_weights, [this.brain.input_nodes, this.brain.hidden_nodes]);
    //
    //
    // let o_weights = this.brain.output_weights.dataSync().map(f);
    // this.brain.output_weights.dispose();
    // this.brain.output_weights = tf.tensor(o_weights, [this.brain.hidden_nodes, this.brain.output_nodes]);
    //
    //
    // let i_bias = this.brain.input_bias.dataSync().map(f);
    // this.brain.input_bias.dispose();
    // this.brain.input_bias = tf.tensor(i_bias, [1, this.brain.hidden_nodes]);
    //
    //
    // let o_bias = this.brain.output_bias.dataSync().map(f);
    // this.brain.output_bias.dispose();
    // this.brain.output_bias = tf.tensor(o_bias, [1, this.brain.output_nodes]);

  }


  crossover(partner) {

    // perform crossover on all the biases or all the weights of the two parents
    // A is the first parent's weights/biases
    // B is the second parent's weights/biases
    function crossOne(A, B) {
      let arr = []
      for (let i = 0; i < A.length; i++) {

        let a = A[i].dataSync();
        let b = B[i].dataSync();

        let mid = Math.floor(Math.random() * a.length);
        let vals = [...a.slice(0, mid), ...b.slice(mid)];

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


  reset(cells) {
    this.lasthit = [];
    this.score = 0;
    this.cells = _.cloneDeep(cells);
  }



}
