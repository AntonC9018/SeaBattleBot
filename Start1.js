var Width = 4;
var Height = 4;


let navies;
let count = 0;
let loop = false;
let NN = new NeuralNetwork([16, 20, 16]);

let BATCH = 15;

let LR = 1 / BATCH;
let LAMBDA = 0.01; // decay
let EPOCHS = 20;

let TESTS = 4;

let PERC = 15/16;

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

		reveal: PERC, // reveal all but 1 cell (for now)
		batch_size: BATCH,
		num_epochs: EPOCHS
	})


	navies = [];
	let holder = $('#navy');
	holder.find('*').remove(); // delete earlier canvases

	for (let i = 0; i < last.length; i++) {
		let divofdivs = $('<div>').addClass('batch').appendTo(holder);
		navies.push([])

		for (let j = 0; j < last[i].length; j++) {
			let div = $('<div>').addClass('floaty').appendTo(divofdivs);
			navies[i].push(
				createSketch({
					logic: last[i][j],
					type: 'visible',
					size: 16,
					silh: false,
					cursor: false,
					width: Width,
					height: Height
				}, div[0]))
		}
	}



	if (loop) {
		setTimeout(clickk, 200);
	}
}
