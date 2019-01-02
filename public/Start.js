var MUTATION_RATE = 0.05;
var POPULATION = 50;
var Width = 4;
var Height = 4;

var stages = [

	{

		upto: 1000,

		logics: {
			type: "gaps",
			reveal: 0.8,
		},
		num_iter: 35,
		turns: 5

	},

	{
		upto: 9999999999,

		logics: {
			type: "none"
		},
		num_iter: 50,
		turns: 100

	}
]



let gen = new Generation(POPULATION);
let navy;
let count = 0;
let loop = false;

// Initialize gen
gen.initialize();

function toggleLoop() {
	loop = !loop;
	console.log(loop);
}

// remove tensors and the Generation object
function nullify() {
  gen.species.forEach(s => s.kill());
	gen = new Generation(POPULATION);
}

// do another evolution iteration
async function clickk() {
	if (gen.done) return;
	gen.evolve();

	$('#navy').html(gen.bestBot.name + ' scored ' + gen.bestBot.score + '<br>' );

	let navies = [];
	for (let i = 0; i < gen.stage.num_iter; i++) {
		navies.push(
			createSketch({
				logic: gen.bestBoard[i],
				type: 'visible',
				size: 8,
				silh: false,
				cursor: false,
				width: Width,
				height: Height

			}, $('#navy')[0]))
	}

	// Display Stats
	$("#geners").html("Generation: " + gen.generation);
	$("#high-score").html("HighScore: " + gen.high_score.toFixed(2));
	$('#avg-score').html("Average Score " + gen.avg_score.toFixed(2));
	$('#population').html("Population: " + gen.population);
	$('#mut-rate').html("Mutation Rate: " + MUTATION_RATE * 100 + "%");
	$('#progress').html("Progress: " + gen.progress.toFixed(2));

	// Display Inheritance
	let lis = $('li.in');
	$('li.h').html("Bot\tParentA\t\tParentB")
	gen.species.forEach((bot, index) => {
		let txt = '';
		if (bot.parents.length !== 0)
			txt = `${bot.name} \t\t\t ${bot.parents[0].id} (${bot.parents[0].score.toFixed(1)}) \t\t\t ${bot.parents[1].id}(${bot.parents[1].score.toFixed(1)})`;
		else
			txt = `${bot.name} \t\t\t ------ \t\t\t ------`
		$(lis[index]).html(txt);
	})

	if (loop) {
		setTimeout(clickk, 100);
	}
}
