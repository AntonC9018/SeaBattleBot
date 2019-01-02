var MUTATION_RATE = 0.05;
var POPULATION = 30;
let generation = new Generation(POPULATION);
let navy;
let count = 0;
let loop = false;

// Initialize Generation
generation.initialize();

navy = createSketch({
	logic: generation.logics[0],
	type: 'visible'
}, $('#navy')[0]);

function toggleLoop() {
	loop = !loop;
	console.log(loop);
}

async function clickk() {
	generation.evolve();

	$('#navy').html('')

	navy = createSketch({
		logic: generation.best,
		type: 'visible'
	}, $('#navy')[0]);

	// Display Stats
	$("#geners").html("Generation: " + generation.generation);
	$("#high-score").html("HighScore: " + generation.high_score.toFixed(2));
	$('#avg-score').html("Average Score " + generation.avg_score.toFixed(2));
	$('#population').html("Population: " + generation.population);
	$('#mut-rate').html("Mutation Rate: " + MUTATION_RATE * 100 + "%");
	$('#progress').html("Progress: " + generation.progress.toFixed(2));

	// Display Inheritance
	let lis = $('li.in');
	$('li.h').html("Bot\tParentA\t\tParentB")
	generation.species.forEach((bot, index) => {
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
