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
    // スコア情報の初期化
    game.score = {
      A: { point: 0, el: document.querySelector('#scoreA .score')},
      B: { point: 0, el: document.querySelector('#scoreB .score')},
    };

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

    // 押下されているキーを管理
    watchKeyboard();

    // フレームごとの処理を登録
    Events.on(engine, 'beforeUpdate', update);

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
    const paddleB = game.paddleB;
    const puck = game.puck;

    // 左手前を原点とした座標に変換
    const paddleRelPos = {
      x: -paddleB.position.x + BOARD_WIDTH,
      y: paddleB.position.y,
    };
    const puckRelPos = {
      x: -puck.position.x + BOARD_WIDTH,
      y: puck.position.y,
    };
    // AIがパドルを操作
    const relAIForce = calcForceByHeboAI(paddleRelPos, puckRelPos);
    Body.applyForce(paddleB, paddleB.position, {x: -relAIForce.x, y: relAIForce.y});

    // パドルを自陣にキープする
    const relKeepForce = keepPaddleOwnSide(paddleRelPos);
    if (relKeepForce) {
      Body.applyForce(paddleB, paddleB.position, {x: -relKeepForce.x, y: relKeepForce.y});
    }
  }

  /**
   * 適当ルールベースAI
   * @param {x:int, y:int} paddlePos 左手前を原点としたパドルの座標
   * @param {x:int, y:int} puckPos 左手前を原点としたパックの座標
   * @return {x:int, y:int} force 左手前を原点とした力のベクトル
   */
  function calcForceByHeboAI(paddlePos, puckPos) {
    const f = 0.5;
    // 正確性。1だとミスらない。-1だとランダム。減らすほど挙動不審になる。
    const rmin = -0.3;
    // ホームポジション。50とかにするとだいぶ強い
    const homeY = 200;
    let force = {x: 0, y: 0};
    if (puckPos.y > BOARD_HEIGHT / 2) {
      // パックが敵陣にあるときはゴール前に戻る
      if (paddlePos.y < BOARD_HEIGHT && paddlePos.y > homeY) {
        force.y -= f;
      }
      if (paddlePos.x > BOARD_WIDTH / 2 + 30) {
        force.x -= f;
      }
      if (paddlePos.x < BOARD_WIDTH / 2 - 30) {
        force.x += f;
      }
    } else {
      // パックが自陣にあるとき
      if (paddlePos.y > puckPos.y - 50) {
        // パックを取り逃したときは戻りつつ何かする
        force.x += f * (Math.random() * 4 - 2);
        force.y -= f * (Math.random() * (1 - rmin) + rmin);
      } else {
        // パックが前にいるときはパックに向かう
        if (paddlePos.y < puckPos.y) {
          force.y += f * (Math.random() * (1 - rmin) + rmin);
        } else {
          force.y -= f * (Math.random() * (1 - rmin) + rmin);
        }
        if (paddlePos.x < puckPos.x) {
          force.x += f * (Math.random() * (1 - rmin) + rmin);
        } else {
          force.x -= f * (Math.random() * (1 - rmin) + rmin);
        }
      }
    }
    return force;
  }

  /**
   * パックのフレームごとの処理
   */
  function updatePuck() {
    const puck = game.puck;
    if (puck.position.y < -30) {
      // 相手のゴールを割ったら、Aの得点
      increaseScore(game.score.A);
      randomPuck();
    }
    if (puck.position.y > BOARD_HEIGHT + 30) {
      // 自分のゴールを割ったら、Bの得点
      increaseScore(game.score.B);
      randomPuck();
    }
  }

  /**
   * スコアを1点加算
   * @param {point:int, el:Element} score 
   */
  function increaseScore(score) {
    score.point += 1;
    score.el.innerText = score.point;
  }

  /**
   * パックをランダムな位置・速度で射出
   */
  function randomPuck() {
    Body.setPosition(game.puck, {
      x: Math.random() * (BOARD_WIDTH - 20) + 10,
      y: Math.random() * (BOARD_HEIGHT - 40 - 40) + 40
    });
    Body.setVelocity(game.puck, {
      x: Math.random() * 20 - 10,
      y: Math.random() * 20 - 10
    });
  }

  window.addEventListener('load', init, false);
})();