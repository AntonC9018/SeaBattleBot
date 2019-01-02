function reveal(board, fraction) {
  let WIDTH = board.WIDTH;
  let HEIGHT = board.HEIGHT;

  let length = WIDTH * HEIGHT;
  let max_num_of_shots = Math.floor(length * fraction || 0.5);
  let goal_length = length - max_num_of_shots;

  let bot = new RandomBot({
    fun: (x, y) => board.shoot(x, y, DIM),
    WIDTH,
    HEIGHT
  });

  for (let i = 0; i < max_num_of_shots; i++) {
    bot.act();
    if (bot.freeCells.length <= goal_length) break;
  }

  return bot.cells;
}
