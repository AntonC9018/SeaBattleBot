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
    }

    /**
     * Initalize the Generation with creatures
     * @param {object}
     */

    initialize() {
      let logic = createLogic({ type: 'visible', silh: false, cursor: false });
      // randomArrangement(logic);
      // let cells = reveal(logic, 0.8);
      let cells = logic.toCells();
      this.logics = [];


      // initialize all bots
        for (let i = 0; i < this.population; i++) {
            let copy_of_logic = logic.clone();
            this.logics.push(copy_of_logic);
            let bot = new SmartBot({
                fun: function(x, y, type) {
                  return copy_of_logic.shoot(x, y, type);
                },
                cells,
                id: i
            });
            bot.brain.init();
            this.species.push(bot);
        }

        this.finish_gen(30);
    }

    finish_gen(turns) {
      _.each(this.species, s => {
        for (let i = 0; i < turns; i++) {
          s.act();
        }
        s.win = false;
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

    evolve() {

      console.log('Calling evolve');

      this.generation++;


      let best = _.maxBy(this.species, 'score');
      this.best = this.logics[best.id];

      // Store High Score
      let gen_highscore = best.score;
      this.high_score = gen_highscore > this.high_score ? gen_highscore : this.high_score;

      // Calculate Total Score of this Generation
      let total_score = _.sumBy(this.species, 'score');

      // Assign Fitness to each creature
      this.progress = (total_score / this.population) - this.avg_score
      this.avg_score = total_score / this.population;
      let min_score = _.minBy(this.species, 'score').score;

      _.each(this.species, s => s.shifted = s.score - min_score);
      let sum = _.sumBy(this.species, 'shifted');
      _.each(this.species, s => s.fitness = s.shifted / sum);



      // Store new generation temporarily in this array
      let new_generation = [];


      let logic = createLogic({ type: 'visible', silh: false, cursor: false });

      this.logics = [];

      let cells;
      let turns;

      if (this.generation < 1000) {
        // cells = reveal(logic, 0.8);
        cells = logic.toCells();
        turns = 80;
      }
      else if (this.generation < 200) {
        cells = reveal(logic, 0.7);
        turns = 30;
      }
      else if (this.generation < 300) {
        cells = reveal(logic, 0.6);
        turns = 40;
      }
      else if (this.generation < 400) {
        cells = reveal(logic, 0.5);
        turns = 50;
      }
      else if (this.generation < 500) {
        cells = reveal(logic, 0.4);
        turns = 60;
      }
      else if (this.generation < 600) {
        cells = reveal(logic, 0.3);
        turns = 70;
      }
      else {
        randomArrangement(logic);
        cells = reveal(logic, 0.1);
        turns = 80;
      }

      // Breeding
      for (let i = 0; i < this.population; i++) {
          let copy_of_logic = logic.clone();
          this.logics.push(copy_of_logic);

          let parentA = this.pickOne();
          let parentB = this.pickOne();
          let child = parentA.crossover(parentB);
          child.mutate();
          child.id = i;
          child.parents = [{ id: parentA.id, score: this.species[parentA.id].score },
                          { id: parentB.id, score: this.species[parentB.id].score }];

          child.reset(cells);
          child.fun = function(x, y, type) {
            return copy_of_logic.shoot(x, y, type);
          }
          new_generation.push(child);
      }

      // Kill Current Generation.
      _.each(this.species, s => s.kill());

      // Add new children to the current generation
      this.species = new_generation;

      this.finish_gen(turns);

      console.log('Evolution finished');
    }
}
