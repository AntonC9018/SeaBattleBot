
class NeuralNetwork {


  constructor(nodes) {

    this.nodes = nodes;
    this.weights = [];
    this.biases = [];
    this.err = null;

  }

  init() {

    for (let i = 0; i < this.nodes.length - 1; i++) {

      this.weights.push(
        tf.variable(
          tf.randomNormal(
            [this.nodes[i], this.nodes[i + 1]])))

      this.biases.push(
        tf.variable(
          tf.randomNormal(
            [ 1, this.nodes[i + 1] ])))
    }

  }

  cross_entropy(as, ys) {

    return tf.tidy(() => {

      // sum of { y ln(a) + (1 - y) ln(1 - a) }
      let ln_as = as.log();
      let ln_one_minus_as = tf.ones(as.shape).sub(as).log();

      let one_minus_ys = tf.ones(ys.shape).sub(ys);

      let first = ys.mul(ln_as);
      let second = one_minus_ys.mul(ln_one_minus_as);
      let allthree = first.add(second).neg().sum().dataSync()[0];


      // regularization factor (weights squared)
      let w_squared = 0;

      for (let i = 0; i < this.weights.length; i++) {
        w_squared += this.weights[i].square().sum().dataSync()[0];
      }
      w_squared *= LAMBDA


      // add the two up
      let result = allthree + w_squared;

      if (isNaN(result)) result = 10e8; // prevent NaNs

      return result;

    })

  }

  avg_weight() {
    let result = 0;

    for (let w of this.weights) {
      let vals = w.dataSync();
      let sum = vals.reduce((b, c) => b + Math.abs(c));
      result += sum / vals.length;
    }
    return result / this.weights.length;
  }

  print() {
    for (let w of this.weights) {
      w.print()
    }
    for (let b of this.biases) {
      b.print()
    }
  }

  // relu prime
  relup(a) {

    let d = a.dataSync();
    let vals = d.map(i => i > 0 ? 1 : 0);
    return tf.tensor(vals, a.shape);

  }

  // Label boards. Encourage strong guesses, i.e. values close to 1.
  // Label all but one cell with zeros
  generate_y(_input, _guess) {

    let input = Array.isArray(_input) ? _input : _input.dataSync();
    let guess = Array.isArray(_guess) ? _guess : _guess.dataSync();

    let good_inds = [];
    let highests = [];

    for (let i = 0; i < input.length; i++) {

      // collect possible not-gap shots
      if (input[i] === 0) good_inds.push(i);

      // collect strong guesses
      if (guess[i] > 0.5) highests.push(i);
    }

    let matches = [];

    for (let i = 0; i < input.length; i++) {
      // check if the NN had predicted any good shots
      if (good_inds.includes(highests[i]))
        matches.push(highests[i]);
    }

    let result = _.fill(Array(input.length), 0);
    good_inds.forEach(i => result[i] = 0.25);

    if (matches.length > 0) {
      let highest = matches[0];

      for (let i = 1; i < matches.length; i++) {
        if (guess[matches[i]] > guess[highest])
          highest = matches[i];
      }

      result[highest] = 1; // encourage the NN

    } else {

      // select a cell at random, as the NN did not choose to shoot an empty cell
      result[good_inds[ Math.floor(Math.random() * good_inds.length) ]] = 1;

    }

    return tf.tensor(result, _guess.shape);

  }


  // I'll use sigmoid in the last layer stochactic gradient descent
  // Learning in batches
  grad_descent(xs) {


    tf.tidy(() => {

      let wl = this.weights.length; // shorthand

      // The future sums of gradients w.r.t. the weights and the biases
      let grad_w = [];
      let grad_b = [];

      // Initialize them
      for (let i = 0; i < wl; i++) {
        grad_w[i] = tf.zeros(this.weights[i].shape);
        grad_b[i] = tf.zeros(this.biases[i].shape);
      }

      // loop through all boards of the batch
      for (let i = 0; i < xs.length; i++) {
        let as = [];

        // tensorize the input)
        let x = tf.tensor(xs[i], [1, this.nodes[0]]);

        as.push(x);

        // feedforward
        for (let j = 0; j < wl; j++) {

          x = x.matMul(this.weights[j]).add(this.biases[j]);


          // I won't use the relu function just yet since the values
          // that the NN produces go huge and the output drawn through
          // a sigmoid becomes just 0-s or 1-s
          // The error because of that blasts off to infinity (NaNs)


          // if (j < wl - 1) {
          //   x = x.sigmoid();
          // } else {
          //   x = x.relu();
          // }

          x = x.sigmoid()

          as.push(x);
        }
        // generate label values depending on the nn's predictions
        let y = this.generate_y(xs[i], x);

        let lambda = tf.scalar(LAMBDA, 'float32');


        // Loss function is cross-entropy [ y ln(x) - (1-y) ln(1-x) ]
        // I draw the output through a sigmoid, so their derivatives cancel
        // The derivative of the loss if [ (x - y) / (x) / (1 - x) ]
        // The derivative of sigmoid is [ x (1 - x) ] where x is the sigmoided value

        // output of (L - 1) layer * (label - output)
        let delta = x.sub(y);
        grad_b[wl - 1] = grad_b[wl - 1].add(delta).add(this.biases[wl - 1].mul(lambda));;
        grad_w[wl - 1] = grad_w[wl - 1].add(

          // this is my way to assemble the Jacobian
          // i.e. i-th row is i-th 'a' times j-th 'delta'
          // and so I get a matrix of size 'length of delta' by 'length of a'
          // (columns then rows)
          tf.outerProduct(
            as[wl - 1].reshape( [as[wl - 1].shape[1]] ),
            delta     .reshape( [delta.shape[1]]      )))

          // the other way to do this is:
          //
          //   as.[wl - 1].mul(
          //     tf.eye(as.shape[1]))
          //     .transpose()
          //     .mul(delta)
          //
          // this yields exactly the same result

          // regularization derivative
          .add(this.weights[wl - 1].mul(lambda));


        // backpropagation
        for (let j = wl - 2; j >= 0; j--) {

          let sp = this.sigmoid_prime(as[j + 1]);

          // multiply by weights (take the product)
          delta = delta.matMul(this.weights[j + 1].transpose()).mul(sp);

          // this had been described above
          grad_b[j] = grad_b[j].add(delta).add(this.biases[j].mul(lambda));;
          grad_w[j] = grad_w[j].add(
            tf.outerProduct(
              as[j].reshape( [as[j].shape[1]] ),
              delta.reshape( [delta.shape[1]] )))
              // regularize
            .add(this.weights[j].mul(lambda));

        }
      }

      let lr = tf.scalar(LR / BATCH);

      // update the weights
      for (let i = 0; i < wl; i++) {

        this.weights[i].assign(
          this.weights[i].sub(grad_w[i].mul(lr)));

        this.biases[i].assign(
          this.biases[i].sub(grad_b[i].mul(lr)));
      }

    })

  }

  // start training
  async train(C) {

      // I use the term 'epoch' not quite rights here
      // It commonly refers to a full iteration over the whole dataset
      // but I generate new data samples on the fly, while still using
      // this term.

      // I may be wrong and it's used that way

      // C {
      //
      //  board: * params for board *
      //  reveal: * percentage to reveal *
      //  batch_size:
      //  num_epochs:
      //
      // }

      for (let i = 0; i < EPOCHS; i++) {
        tf.tidy(() => {

          // console.log('Started interation # ' + i);
          let xs = [];


          for (let j = 0; j < BATCH; j++) {

            // create a data sample
            let logic = createLogic({
        			WIDTH,
        			HEIGHT,
        			type: 'visible'
        		});
            let cells = reveal(logic, PERC);
            xs[j] = _.flatten(cells);
          }

          // console.log('Started optimizing');
          this.grad_descent(xs, 0.1);

          console.log('Iteration ' + i);
        });

        await tf.nextFrame();
      }

      // variable to hold the test epochs
      let lasts = [];
      let stats = [];

      for (let i = 0; i < TESTS; i++) {

        lasts[i] = [];
        let loss_accum = 0;
        let res_accum = 0;

        for (let j = 0; j < BATCH; j++) {

          tf.tidy(() => {
            let logic = createLogic({
        			WIDTH,
        			HEIGHT,
        			type: 'visible'
        		});
            let cells = _.flatten(reveal(logic, PERC));
            let guess = this.predict(cells);

            let guess_num = indexOfMax(guess.dataSync());
            let result = logic.shoot(Math.floor(guess_num / HEIGHT), guess_num % HEIGHT, MARK);

            let label = this.generate_y(cells, guess);
            let loss = this.cross_entropy(guess, label);

            loss_accum += loss;
            if (result !== 'error') {
              res_accum += 1;
            }

            lasts[i].push({ logic, loss, result })
          })
        }
        stats[i] = {
          avg_loss: loss_accum / BATCH,
          accuracy: res_accum / BATCH
        }
      }
      let avg = {
        avg_loss: _.sumBy(stats, 'avg_loss') / TESTS,
        accuracy: _.sumBy(stats, 'accuracy') / TESTS
      }

      return { lasts, stats, avg };

  }


  sigmoid_prime(x) {
    let s = x.sigmoid();
    let y = s.mul(tf.ones(s.shape).sub(s));
    s.dispose();
    return y;
  }

  // output a vector of guessed values given an input vector
  predict(input) {

    return tf.tidy(() => {
      let x = tf.tensor(input, [1, this.nodes[0]]);

      for (let i = 0; i < this.weights.length; i++) {
        x = x.matMul(this.weights[i]).add(this.biases[i])


        // if (i === this.weights.length - 1) {
        //   x = x.sigmoid();
        // }
        // else x = x.relu()

        x = x.sigmoid();

      }
      return x;
    });

  }
  dispose() {
    _.each(this.weights, e => e.dispose());
    _.each(this.biases, e => e.dispose());
  }

}
