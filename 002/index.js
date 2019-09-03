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

    // Matter.jsのオブジェクトを作成
    createBodies();

    // 押下されているキーを管理
    watchKeyboard();

    // フレームごとの処理を登録
    Events.on(engine, 'beforeUpdate', update);

    // エンジン実行
    Engine.run(engine);
  };

  /**
   * Matter.jsのボディモデルを作成
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

  /**
   * 押下されているキーを管理
   */
  function watchKeyboard() {
    game.pushedKey = {};
    document.onkeydown = function(evt) {
      game.pushedKey[evt.key] = true;
    };
    document.onkeyup = function(evt) {
      delete game.pushedKey[evt.key];
    };
  }

  /**
   * フレームごとの処理
   */
  function update() {
    updatePaddleA();
    updatePaddleB();
    updatePuck();
  }

  /**
   * 自分のパドルのフレームごとの処理
   */
  function updatePaddleA() {
    const w = BOARD_WIDTH;
    const h = BOARD_HEIGHT;
    const paddleA = game.paddleA;
    const puck = game.puck;

    // キーでパドルを操作
    const relKeyForce = calcForceByKey();
    if (relKeyForce) {
      Body.applyForce(paddleA, paddleA.position, {x: relKeyForce.x, y: -relKeyForce.y});
    }

    // 左手前を原点とした座標に変換
    const paddleRelPos = {
      x: paddleA.position.x,
      y: -paddleA.position.y + h,
    };

    // パドルを自陣にキープする
    const relKeepForce = keepPaddleOwnSide(paddleRelPos);
    if (relKeepForce) {
      Body.applyForce(paddleA, paddleA.position, {x: relKeepForce.x, y: -relKeepForce.y});
    }
  }

  /**
   * パドルを自陣にキープする
   * @param {x:int, y:int} paddlePos 左手前を原点としたパドルの座標
   * @return {x:int, y:int} force 左手前を原点とした力のベクトル
   */
  function keepPaddleOwnSide(paddlePos) {
    if (paddlePos.y > BOARD_HEIGHT / 2 - 40) {
      // 敵陣に行かないようにする
      const offset = (BOARD_HEIGHT / 2 - 40) - paddlePos.y;
      return {x: 0, y: offset * 0.05};
    }
    if (paddlePos.y < 40) {
      // ゴールを超えないようにする
      const offset = 40 - paddlePos.y;
      return {x: 0, y: offset * 0.05};
    }
  }

  /**
   * 矢印キーによるパドルの移動
   * 左手前を原点としたときの力のベクトルを返す
   */
  function calcForceByKey() {
    const f = 0.5;
    let force = {x: 0, y: 0};
    if (game.pushedKey['ArrowUp']) {
      force.y += f;
    }
    if (game.pushedKey['ArrowRight']) {
      force.x += f;
    }
    if (game.pushedKey['ArrowDown']) {
      force.y -= f;
    }
    if (game.pushedKey['ArrowLeft']) {
      force.x -= f;
    }
    if (game.pushedKey['ArrowUp'] || game.pushedKey['ArrowRight'] || game.pushedKey['ArrowDown'] || game.pushedKey['ArrowLeft']) {
      return force;
    }
  }

  /**
   * 相手のパドルのフレームごとの処理
   */
  function updatePaddleB() {
  }

  /**
   * パックのフレームごとの処理
   */
  function updatePuck() {
  }

  window.addEventListener('load', init, false);
})();