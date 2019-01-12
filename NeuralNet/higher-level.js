
function createModel(i) {
  var model = tf.sequential();

  model.add(tf.layers.dense({
    units: i,
    inputShape: [ WIDTH * HEIGHT ],
    activation: 'relu6',
    kernelRegularizer: tf.regularizers.l2(LAMBDA)
  }));

  model.add(tf.layers.dense({
    units: WIDTH * HEIGHT,
    activation: 'softmax',
    kernelRegularizer: tf.regularizers.l2(LAMBDA)
  }));

  model.compile({ optimizer: tf.train.sgd(LR), loss: 'categoricalCrossentropy' });
  console.log(model);
  return model;
}

async function train(model) {
  for (let i = 0; i < EPOCHS; i++) {
    let x = [];

    for (let j = 0; j < BATCH; j++) {

      // create a data sample
      let logic = createLogic({ WIDTH, HEIGHT, type: 'visible' });
      let cells = reveal(logic, PERC);
      x[j] = _.flatten(cells);
    }

    let X = tf.tensor(x, [BATCH, WIDTH * HEIGHT])

    let Y = genLabels(x, model.predict(X, { batchSize: BATCH }).dataSync())

    let loss = await model.fit(X, Y, {
      batchSize: BATCH,
      epochs: 1,
      yieldEvery: 'batch',
      callbacks: {
        onBatchEnd: () => console.log('hello')
      }
    })
    console.log(loss.history.loss[0]);
  }
}




function genLabels(_input, _guess) {

  let r = []

  _input = _.flatten(_input);

  for (let i = 0; i < BATCH; i++) {

    let input = _input.slice(i * WIDTH * HEIGHT, i * WIDTH * HEIGHT + WIDTH * HEIGHT)
    let guess = _guess.slice(i * WIDTH * HEIGHT, i * WIDTH * HEIGHT + WIDTH * HEIGHT)

    let good_inds = [];
    let highests = [];

    for (let i = 0; i < input.length; i++) {

      // collect possible not-gap shots
      if (input[i] === 0) good_inds.push(i);

      // collect strong guesses
      if (guess[i] > 0.3) highests.push(i);
    }

    let matches = [];

    for (let i = 0; i < input.length; i++) {
      // check if the NN had predicted any good shots
      if (good_inds.includes(highests[i]))
        matches.push(highests[i]);
    }

    let result = _.fill(Array(input.length), 0);
    good_inds.forEach(i => result[i] = 0);

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

    r.push(result);
  }
  return tf.tensor(_.flatten(r), [BATCH, WIDTH * HEIGHT])

}
