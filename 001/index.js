(() => {
  const BOARD_WIDTH = 500;
  const BOARD_HEIGHT = 800;
  const BORAD_COLOR = '#FAFAFA';
  const WALL_COLOR = '#AAAAAA';
  const PADDLE_A_COLOR = '#64DB8F';
  const PADDLE_B_COLOR = '#55A5FF';
  const PUCK_COLOR = '#E66C4F';

  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const Events = Matter.Events;
  const World = Matter.World;
  const Body = Matter.Body;
  const Bodies = Matter.Bodies;

  let game = {};

  function init() {
    // Matter.jsエンジンの作成
    const engine = Engine.create();
    game.engine = engine;

    // レンダラの作成
    const render = Render.create({
      element: document.getElementById('game'),
      engine: engine,
      options: {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        wireframes: false,
        background: BORAD_COLOR,
      },
    });
    Render.run(render);

    // 重力はOFF
    engine.world.gravity.y = 0;

    // Matter.jsのリジッドボディを作成
    createBodies();

    // エンジン実行
    Engine.run(engine);
  };

  /**
   * Matter.jsのリジッドボディを作成
   */
  function createBodies() {
    const w = BOARD_WIDTH;
    const h = BOARD_HEIGHT;
    // 左
    createWall(5, h / 2, 10, h);
    // 右
    createWall(w - 5, h / 2, 10, h);
    // 奥
    createWall(w / 8, 5, w / 4, 10);
    createWall(w - w / 8, 5, w / 4, 10);
    // 手間
    createWall(w / 8, h - 5, w / 4, 10);
    createWall(w - w / 8, h - 5, w / 4, 10);
    // パドル
    game.paddleA = createPaddle(w / 2, h - 100, PADDLE_A_COLOR);
    game.paddleB = createPaddle(w / 2, 100, PADDLE_B_COLOR);
    // パック
    game.puck = createPuck(w / 2, h / 2);
  }

  function createWall(x, y, w, h) {
    let body = Bodies.rectangle(x, y, w, h, {isStatic: true});
    body.render.fillStyle = WALL_COLOR;
    body.render.strokeStyle = body.render.fillStyle;
    World.add(game.engine.world, [body]);
    return body;
  }

  function createPaddle(x, y, color) {
    let body = Bodies.circle(x, y, 40);
    body.mass = 100;
    body.frictionAir = 0.15;
    body.render.fillStyle = color;
    body.render.strokeStyle = body.render.fillStyle;
    World.add(game.engine.world, [body]);
    return body;
  }

  function createPuck(x, y) {
    let body = Bodies.circle(x, y, 30);
    body.restitution = 1;
    body.frictionAir = 0.001;
    body.render.fillStyle = PUCK_COLOR;
    body.render.strokeStyle = body.render.fillStyle;
    World.add(game.engine.world, [body]);
    return body;
  }

  window.addEventListener('load', init, false);
})();