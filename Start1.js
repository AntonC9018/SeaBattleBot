var Width = 4;
var Height = 4;


let navies;
let count = 0;
let loop = false;
let NN = new NeuralNetwork([16, 30, 30, 16]);


let LR = 0.01;
let LAMBDA = 0.01;
let BATCH = 40;
let EPOCHS = 20;

// Initialize the Neural Network
NN.init();

function toggleLoop() {
	loop = !loop;
	console.log(loop);
}

// do another evolution iteration
async function clickk() {

	let last = await NN.train({

		board: {
			WIDTH: Width,
			HEIGHT: Height,
			type: 'visible'
		},

		reveal: 15/16, // reveal all but 1 cell (for now)
		batch_size: BATCH,
		num_epochs: EPOCHS
	})


	navies = [];
	let holder = $('#navy');
	holder.find('*').remove(); // delete earlier canvases

	for (let i = 0; i < last.length; i++) {
		let div = $('<div>');
		navies.push(
			createSketch({
				logic: last[i],
				type: 'visible',
				size: 8,
				silh: false,
				cursor: false,
				width: Width,
				height: Height
			}, div[0]))

		div.appendTo(holder)
	}

	if (loop) {
		setTimeout(clickk, 200);
	}
}
