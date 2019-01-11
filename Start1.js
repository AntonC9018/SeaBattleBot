var WIDTH = 8;
var HEIGHT = 8;


let navies;
let count = 0;
let loop = false;
let NN = new NeuralNetwork([WIDTH * HEIGHT, 30, WIDTH * HEIGHT]);

let I = 1;
let shots = 0;
let best = 0;

let BATCH = 15;
// let BATCH = 1 ;

let LR = 0.5; // learning rate
let LAMBDA = 0.01; // decay (regularization parameter)
// let EPOCHS = 20;

let EPOCHS = 5;

let TESTS = 5; // how many batches will be shown at the end of an epoch

let PERC = 0.9; // percentage of cells to reveal

// Initialize the Neural Network
NN.init();

function toggleLoop() {
	loop = !loop;
	console.log(loop);
}

// do another evolution iteration
async function clickk() {

	shots += BATCH * ( EPOCHS + TESTS );


	let stats = await NN.train();

	navies = [];
	let holder = $('#navy');
	holder.find('*').remove(); // delete earlier canvases

	for (let i = 0; i < TESTS; i++) {

		let divofdivs = $('<div>').addClass('batch').appendTo(holder);
		let text = $('<div>').html(stats.stats[i].accuracy * 100 + '%').addClass('texty').appendTo(divofdivs);

		navies.push([])

		for (let j = 0; j < BATCH; j++) {

			let div = $('<div>').addClass('floaty').appendTo(divofdivs);
			navies[i].push(
				createSketch({
					logic: stats.lasts[i][j].logic,
					type: 'visible',
					size: 5,
					stroke: 1,

					silh: false,
					cursor: false,
					width: WIDTH,
					height: HEIGHT,
					redraw: false
				}, div[0]))
		}
	}

	updateChart({ x: I, y: stats.avg.accuracy * 100 });

	if (best < stats.avg.accuracy) best = stats.avg.accuracy;

	// update averages
	$('li.iters span')		.html(I);
	$('li.weight span')		.html(NN.avg_weight().toFixed(2));
	$('li.highscore span').html((best * 100).toFixed(2));
	$('li.loss span')			.html(stats.avg.avg_loss.toFixed(2));
	$('li.shot span')			.html(shots);




	I++;
	if (loop) {
		setTimeout(clickk, 200);
	}
}

var chart;

function createChart() {
	chart = new CanvasJS.Chart("chartContainer", {
		title: {
			text: 'Progress'
		},

		axisX: {
			minimum: 0,
			minnterval: 1
		},

		axisY: {
			suffix: '%'
		},

		width: 600,
		height: 300,

		data: [
			{
				type: "line",
				color: 'rgb(207, 48, 32)',
				dataPoints: []
			}
		]

	})
	chart.render();
}

$(document).ready(function() {
	createChart();

	$('input').filter('.lr,.lm,.bs,.ep,.ts')
		.on('input', function() {
			$('span').filter('.' + $(this).attr('class').split(' ')[1])
			.html($(this).val())
		})

	$('input.lr').val(LR)			.on('input', function() { LR = 				parseFloat($(this).val()) })
	$('input.lm').val(LAMBDA)	.on('input', function() { LAMBDA = 		parseFloat($(this).val()) })
	$('input.bs').val(BATCH)	.on('input', function() { BATCH = 		parseFloat($(this).val()) })
	$('input.ep').val(EPOCHS)	.on('input', function() { EPOCHS = 		parseFloat($(this).val()) })
	$('input.ts').val(TESTS)	.on('input', function() { TESTS = 		parseFloat($(this).val()) })

	$('span.lr').html(LR)			.on('mouseout', function() { LR = 			parseFloat($(this).html()) })
	$('span.lm').html(LAMBDA)	.on('mouseout', function() { LAMBDA = 	parseFloat($(this).html()) })
	$('span.bs').html(BATCH)	.on('mouseout', function() { BATCH = 		parseFloat($(this).html()) })
	$('span.ep').html(EPOCHS)	.on('mouseout', function() { EPOCHS = 	parseFloat($(this).html()) })
	$('span.ts').html(TESTS)	.on('mouseout', function() { TESTS = 		parseFloat($(this).html()) })

	$('a.lr').on('click', function() { LR /= 2;			$('input.lr').val(LR);		 $('span.lr').html(LR.toFixed(8))	     })
	$('a.lm').on('click', function() { LAMBDA /= 2;	$('input.lm').val(LAMBDA); $('span.lm').html(LAMBDA.toFixed(8))  })

	// $('span.var').on('focus', function() { $(this).select() }).mouseup(function(e) { e.preventDefault() })

})


function updateChart(dataPoint) {
	let int = chart.data[0].dataPoints.length;

	if (int < 15) {
		chart.axisX[0].set('interval', 1);
	} else {
		chart.axisX[0].set('interval', 3);
		if (int > 25) {
			let p = chart.data[0].dataPoints.shift();
			chart.axisX[0].set('minimum', p.x);
		}
	}


	chart.data[0].dataPoints.push(dataPoint);
	// chart.data[1].dataPoints.push({ x: I, y: Math.random() * 100});
	chart.render();
}

function showInit() {
	$('.init').show('medium');
}

function init() {
	$('.init').hide('medium');
	WIDTH = parseInt($('.width').val()) || 8;
	HEIGHT = parseInt($('.height').val()) || 8;
	let num_hidden = parseInt($('.n-hidden').val()) || 30;
	_init(num_hidden);
}

function _init(i) {

	createChart();
	NN.dispose();
	NN = new NeuralNetwork([WIDTH * HEIGHT, i, WIDTH * HEIGHT]);
	NN.init();

	navies = [];
	$('#navy').find('*').remove(); // delete earlier canvases

	I = 0;

	$('li.iters span')		.html(0);
	$('li.weight span')		.html(0);
	$('li.highscore span').html(0);
	$('li.loss span')			.html(0);
	$('li.shot span')			.html(0);
}
