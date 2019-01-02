class NeuralNetwork {


  constructor(nodes) {

    this.nodes = nodes;
    this.weights = [];
    this.biases = [];

  }

  init() {

    for (let i = 1; i < this.nodes.length; i++) {
      this.weights.push(tf.randomNormal([this.nodes[i - 1], this.nodes[i]]))
      this.biases.push(tf.randomNormal([ this.nodes[i] ]))
    }
  }

  set(NN) {

    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = tf.clone(NN.weights[i]);
      this.biases[i] = tf.clone(NN.biases[i]);
    }
  }


  predict(input) {

    return tf.tidy(() => {
      let x = tf.tensor(input, [1, this.nodes[0]], 'int32');

      for (let i = 0; i < this.weights.length; i++) {
        x = x.matMul(this.weights[i]).add(this.biases[i]).relu();
      }
      let index = indexOfMax(x.dataSync());
      return index;
    });

  }

  clone() {
    let clonie = new NeuralNetwork(this.nodes);
    clonie.set(this);
    return clonie;
  }


  dispose() {
    _.each(this.weights, e => e.dispose());
    _.each(this.biases, e => e.dispose());
  }


}
