class ActivationFunction {
    constructor(func, dfunc, name) {
        this.func = func;
        this.dfunc = dfunc;
        this.name = name;
    }

    serialize() {
        return this.name;
    }
}

const sigmoid = new ActivationFunction(
    x => 1 / (1 + Math.exp(-x)),
    y => y * (1 - y),
    "sigmoid"
);

const tanh = new ActivationFunction(
    x => Math.tanh(x),
    y => 1 - Math.pow(y, 2),
    "tanh"
);

class NeuralNetwork {
    constructor(a, b, c) {
        if (a instanceof NeuralNetwork) {
            this.input_nodes = a.input_nodes;
            this.hidden_nodes = a.hidden_nodes;
            this.output_nodes = a.output_nodes;

            this.weights_ih = a.weights_ih.copy();
            this.weights_ho = a.weights_ho.copy();

            this.bias_h = a.bias_h.copy();
            this.bias_o = a.bias_o.copy();

            this.learning_rate = a.learning_rate;
            this.activation_function = a.activation_function;
        } else {
            this.input_nodes = a;
            this.hidden_nodes = b;
            this.output_nodes = c;

            this.weights_ih = new Matrix(this.hidden_nodes, this.input_nodes);
            this.weights_ho = new Matrix(this.output_nodes, this.hidden_nodes);
            this.weights_ih.randomize();
            this.weights_ho.randomize();

            this.bias_h = new Matrix(this.hidden_nodes, 1);
            this.bias_o = new Matrix(this.output_nodes, 1);
            this.bias_h.randomize();
            this.bias_o.randomize();

            this.setLearningRate();
            this.setActivationFunction();
        }
    }

    predict(input_array) {
        // Generating the Hidden Outputs
        const inputs = Matrix.fromArray(input_array);
        const hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        // activation function!
        hidden.map(this.activation_function.func);

        // Generating the output's output!
        const output = Matrix.multiply(this.weights_ho, hidden);
        output.add(this.bias_o);
        output.map(this.activation_function.func);

        // Sending back to the caller!
        return output.toArray();
    }

    setLearningRate(learning_rate = 0.1) {
        this.learning_rate = learning_rate;
    }

    setActivationFunction(func = sigmoid) {
        this.activation_function = func;
    }

    train(input_array, target_array) {
        // Generating the Hidden Outputs
        const inputs = Matrix.fromArray(input_array);
        const hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        // activation function!
        hidden.map(this.activation_function.func);

        // Generating the output's output!
        const outputs = Matrix.multiply(this.weights_ho, hidden);
        outputs.add(this.bias_o);
        outputs.map(this.activation_function.func);

        // Convert array to matrix object
        const targets = Matrix.fromArray(target_array);

        // Calculate the error
        // ERROR = TARGETS - OUTPUTS
        const output_errors = Matrix.subtract(targets, outputs);

        // let gradient = outputs * (1 - outputs);
        // Calculate gradient
        const gradients = Matrix.map(outputs, this.activation_function.dfunc);
        gradients.multiply(output_errors);
        gradients.multiply(this.learning_rate);


        // Calculate deltas
        const hidden_T = Matrix.transpose(hidden);
        const weight_ho_deltas = Matrix.multiply(gradients, hidden_T);

        // Adjust the weights by deltas
        this.weights_ho.add(weight_ho_deltas);
        // Adjust the bias by its deltas (which is just the gradients)
        this.bias_o.add(gradients);

        // Calculate the hidden layer errors
        const who_t = Matrix.transpose(this.weights_ho);
        const hidden_errors = Matrix.multiply(who_t, output_errors);

        // Calculate hidden gradient
        const hidden_gradient = Matrix.map(hidden, this.activation_function.dfunc);
        hidden_gradient.multiply(hidden_errors);
        hidden_gradient.multiply(this.learning_rate);

        // Calcuate input->hidden deltas
        const inputs_T = Matrix.transpose(inputs);
        const weight_ih_deltas = Matrix.multiply(hidden_gradient, inputs_T);

        this.weights_ih.add(weight_ih_deltas);
        // Adjust the bias by its deltas (which is just the gradients)
        this.bias_h.add(hidden_gradient);
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(data) {
        if (typeof data == 'string')
            data = JSON.parse(data);

        const nn = new NeuralNetwork(data.input_nodes, data.hidden_nodes, data.output_nodes);
        nn.weights_ih = Matrix.deserialize(data.weights_ih);
        nn.weights_ho = Matrix.deserialize(data.weights_ho);
        nn.bias_h = Matrix.deserialize(data.bias_h);
        nn.bias_o = Matrix.deserialize(data.bias_o);
        nn.learning_rate = data.learning_rate;
        return nn;
    }

    // Adding function for neuro-evolution
    copy() {
        return new NeuralNetwork(this);
    }

    mutate(rate) {
        [
            "weights_ih",
            "weights_ho",
            "bias_h",
            "bias_o"
        ].forEach(o => this[o].map(val => val + (Math.random() < rate ? randomGaussian(0, 0.1) : 0)));
    }
}