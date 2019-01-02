class Generation {

    /**
     * Takes in a population value
     * @constructor
     * @param {number} population - The population Size
     */

    constructor(population) {
        this.population = population;
        this.species = [];
        this.generation = 1;
        this.high_score = -1000;
        this.avg_score = 0;
        this.total_score = 0;
        this.fitness = 0;
        this.progress = 0;
        this.stage = stages[0];
        console.log(stages[0]);
        this.stage_index = 0;
    }

    /**
     * Initalize the Generation with creatures
     * @param {object}
     */

    initialize() {

      // initialize all bots
      for (let i = 0; i < this.population; i++) {
          let bot = new SmartBot({
            id: i,
            width: Width,
            height: Height
          });
          bot.brain.init();
          this.species.push(bot);
      }

      // this.evolve();

    }

    generateLevel() {
      // create fully functional board
      let logic = createLogic({
        type: 'visible',
        silh: false,
        cursor: false,
        width: Width,
        height: Height
      });

      // create arrays to store boards and cells to feed in to the bots
      let logics = [];
      let cellss = [];

      // reset array storing all the boards of each bot
      this.logics = [];
      for (let i = 0; i < this.stage.num_iter; i++) {
        this.logics[i] = [];
      }

        // use a boards without ships, but reveal some of the cells
      if (this.stage.logics.type === "gaps") {
        for (let i = 0; i < this.stage.num_iter; i++) {
          let copy = logic.clone();
          let cells = reveal(copy, this.stage.logics.reveal);
          logics.push(copy);
          cellss.push(cells);
        }

        // use an empty board
      } else if (this.stage.logics.type === "none") {

        for (let i = 0; i < this.stage.num_iter; i++) {
          let copy = logic.clone();
          let cells = copy.toCells();
          logics.push(copy);
          cellss.push(cells);
        }

        // use an unrevealed board with ships
      } else if (this.stage.logics.type === "ships") {
        for (let i = 0; i < this.stage.num_iter; i++) {
          let copy = logic.clone();
          randomArrangement(copy); // that's what the type tells to do
          let cells = logics.toCells();
          logics.push(copy);
          cellss.push(cells);
        }
      }

      return { logics, cellss }
    }

    assign_score({ logics, cellss }) {
      // evaluate each of the bots
      _.each(this.species, s => {

        // step through each board of the level
        for (let i = 0; i < this.stage.num_iter; i++) {

          // copy the logic for the bot to shoot at
          let copy_of_logic = logics[i].clone();

          // store it
          this.logics[i].push(copy_of_logic);

          // prepare the bot
          s.reset(
            cellss[i],
            function(x, y, type) {
              return copy_of_logic.shoot(x, y, type);
            }
          )

          // let them take 'turns' number of guesses
          for (let j = 0; j < this.stage.turns; j++) {
            s.act();
          }
        }
      })
    }

    /**
     * Picks one creature from the population
     * @returns A creature
     */

    pickOne() {
        let index = -1;
        let r = Math.random();

        while (r > 0) {
          index++;
          r -= this.species[index].fitness;
        }

        let selected = this.species[index];
        return selected;
    }

    // Update variables
    update() {
      this.generation++;

      this.bestBot = _.maxBy(this.species, 'score');

      this.bestBoard = [];
      for (let i = 0; i < this.stage.num_iter; i++) {
        this.bestBoard.push(this.logics[i][this.bestBot.id])
      }

      // Store High Score
      let gen_highscore = this.bestBot.score;
      this.high_score = gen_highscore > this.high_score ? gen_highscore : this.high_score;

      // Calculate Total Score of this Generation
      let total_score = _.sumBy(this.species, 'score');


      this.progress = (total_score / this.population) - this.avg_score
      this.avg_score = total_score / this.population;

      // Assign Fitness to each creature
      let min_score = _.minBy(this.species, 'score').score;
      _.each(this.species, s => s.shifted = s.score - min_score);
      let sum = _.sumBy(this.species, 'shifted');
      _.each(this.species, s => s.fitness = s.shifted / sum);

      // update stage variable
      if (this.generation >= this.stage.upto) {
        this.stage_index++;
        console.log('Stage ' + this.stage_index + ' complete!');

        if (this.stage_index >= stages.length) {
          console.log('Evolution finished.');
          this.finished = true;
        } else {
          console.log('Initializing the next stage.');
          this.stage = stages[this.stage_index];
          console.log(this.stage);
        }
      }
    }

    breed() {
      let new_generation = [];
      // Breeding
      for (let i = 0; i < this.population; i++) {
          let parentA = this.pickOne();
          let parentB = this.pickOne();
          let child = parentA.crossover(parentB);
          // child.mutate();
          child.id = i;
          child.parents = [{ id: parentA.id, score: this.species[parentA.id].score },
                          { id: parentB.id, score: this.species[parentB.id].score }];
          new_generation.push(child);
      }
      return new_generation;
    }

    evolve() {
      console.log('Calling evolve');

      // let bots take guesses on the board they see
      let level = this.generateLevel();
      this.assign_score(level);

      // update variables that store info about the current generation
      // and the progress it's achieved
      this.update()

      // Store new generation temporarily in this array
      let new_generation = this.breed();

      // Kill Current Generation.
      _.each(this.species, s => s.kill());

      // Add new children to the current generation
      this.species = new_generation;


      console.log('Evolution finished');
    }
}
