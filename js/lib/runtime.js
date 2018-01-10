const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

const screenPadding = screenWidth / 18
const innerPadding = 4
const headerHeight = screenHeight / 7
const boardLen = screenWidth - 2 * screenPadding
const squareLen = (boardLen - innerPadding * 5) / 4

// 相对于board
const left = screenPadding;
const top = screenPadding + headerHeight;

// square
const distance = squareLen + innerPadding; // 两个square.x距离
const startX = left + innerPadding; // square起始x位置
const startY = top + innerPadding;  // square其实y位置

// direction
const U = 1 // 上
const R = 2 // 右
const D = 3 // 下
const L = 4 // 左

// text
const textY = screenPadding + headerHeight - 20

// img
let startImg = new Image()
startImg.src = 'images/start.png'
let redoImg = new Image()
redoImg.src = 'images/refresh.png'
let pauseImg = new Image()
pauseImg.src = 'images/pause.png'

function Rect(x, y, w, h) {
  return { x: x, y: y, width: w, height: h };
}
function Point(x, y) {
  return { x: x, y: y };
}

function drawRoundedRect(ctx, rect, r) {
  // 圆角矩形
  ctx.strokeStyle = ctx.fillStyle;

  var ptA = Point(rect.x + r, rect.y);
  var ptB = Point(rect.x + rect.width, rect.y);
  var ptC = Point(rect.x + rect.width, rect.y + rect.height);
  var ptD = Point(rect.x, rect.y + rect.height);
  var ptE = Point(rect.x, rect.y);

  ctx.beginPath();

  ctx.moveTo(ptA.x, ptA.y);
  ctx.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
  ctx.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
  ctx.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
  ctx.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);

  ctx.stroke();
  ctx.fill();
  // 方形
  // ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

export default class Runtime {

  constructor(onload) {
    this.process = 0;
    /**
     * 格子面板区域
     */
    this.boardArea = {//left, top, boardLen, boardLen
      startX: left,
      startY: top,
      endX: left + boardLen,
      endY: top + boardLen
    }

    /**
     * 暂停（图标）按钮区域
     */
    this.pauseBtnArea = {
      startX: screenWidth - innerPadding - 50,
      startY: textY - 26,
      endX: screenWidth - innerPadding - 22,
      endY: textY + 2
    }

    /**
     * 恢复（图标）按钮区域
     * 方便简易判断按钮点击
     */
    this.resumeBtnArea = {
      startX: screenWidth / 2 - 60,
      startY: screenHeight / 2 - 25,
      endX: screenWidth / 2 - 10,
      endY: screenHeight / 2 + 25
    }

    /**
     * 重玩刷新（图标）按钮区域
     * 方便简易判断按钮点击
     */
    this.refreshBtnArea = {
      startX: screenWidth / 2 + 10,
      startY: screenHeight / 2 - 25,
      endX: screenWidth / 2 + 60,
      endY: screenHeight / 2 + 25
    }

    /**
     * 再玩一次按钮区域
     * 方便简易判断按钮点击
     */
    this.restartBtnArea = {
      startX: screenWidth / 2 - 53,
      startY: screenHeight / 2 - 20,
      endX: screenWidth / 2 + 53,
      endY: screenHeight / 2 + 20
    }

    /**
     * 开始按钮区域
     * 方便简易判断按钮点击
     */
    this.startBtnArea = {
      startX: screenWidth / 2 - 35,
      startY: screenHeight / 2 - 20,
      endX: screenWidth / 2 + 35,
      endY: screenHeight / 2 + 20
    }
    pauseImg.onload = onload
  }
  
  /**
   * @public 获得点击位置对应的格子序号，-1不在格子上
   */
  getTouchIndex(x, y) {
    let col = parseInt((x - startX) / distance);
    let row = parseInt((y - startY) / distance);
    if (x - startX - col * distance > squareLen
      || y - startY - row * distance > squareLen) {
      return -1;
    }
    return 4 * row + col;
  }
  
  /**
   * @public 开始格子移动动画
   */
  startMovingAnimation(index, direction, render, complete) {
    this.movingDir = direction;
    this.movingIndex = index;
    this.process = 0;
    window.requestAnimationFrame(
      this.animationLoop.bind(this, render, complete),
      canvas
    )
  }

  /**
   * @private 移动动画每帧回调处理
   */
  animationLoop(render, cb) {
    // console.log('animationLoop', this.process, Date.now());
    // var rect = this.getMovingRect(this.movingIndex, this.movingDir, this.process);
    // ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    if (this.process >= 100) {
      this.movingDir = 0;
      this.process = 0;
      cb && cb();
      return
    } else {
      this.process += 17;
      render && render();
      // 增加进度并循环
      window.requestAnimationFrame(
        this.animationLoop.bind(this, render, cb),
        canvas
      )
    }
  }

  /**
   * @public 渲染游戏主界面
   */
  render(ctx, squares) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    this.renderBoard(ctx, squares)
    this.renderPlainText(ctx)
    this.renderPauseBtn(ctx)
  }

  /**
   * @private 渲染格子背景面板
   */
  renderBoard(ctx, squares) {
    // ctx.clearRect(left, top, boardLen, boardLen)
    ctx.fillStyle = '#fdf2b8'
    // ctx.fillRect(left, top, boardLen, boardLen);
    var rect = Rect(left, top, boardLen, boardLen);
    drawRoundedRect(ctx, rect, 5);
    this.renderSquares(ctx, squares)
  }

  /**
   * @private 渲染16个格子
   */
  renderSquares(ctx, squares) {
    for (var y = 0; y < 4; y++) {
      for (var x = 0; x < 4; x++) {
        var index = y * 4 + x, square = squares[index];
        // ctx.fillStyle = 'rgb(' + Math.floor(255 - 62.5 * y) + ',' +
        //   Math.floor(255 - 62.5 * x) + ',0)';
        // ctx.fillRect(startX + x * distance, startY + y * distance, squareLen, squareLen);
        if (square.num == 0) {
          ctx.fillStyle = '#00000000';
        } else {
          var rect;
          // 滑动中的rect
          if (this.movingDir && this.movingIndex == index) {
            rect = this.getMovingRect(index, this.movingDir, this.process);
          } else {
            rect = Rect(startX + x * distance, startY + y * distance, squareLen, squareLen);
          }
          if (square.num == index + 1) {
            ctx.fillStyle = '#54b154';
          } else {
            ctx.fillStyle = '#aaccaa';
          }
          drawRoundedRect(ctx, rect, 5);
          this.drawSquareNumber(ctx, rect, square.num);
        }
      }
    }
  }

  /**
   * @private 获取动画进度process对应的rect位置
   */
  getMovingRect(index, direction, process) { // process: 1 - 100
    let x = index % 4, y = parseInt(index / 4);
    const rect = Rect(startX + x * distance, startY + y * distance, squareLen, squareLen);
    switch (direction) {
      case U:
        rect.y -= (distance * process / 100);
        break;
      case R:
        rect.x += (distance * process / 100);
        break;
      case D:
        rect.y += (distance * process / 100);
        break;
      case L:
        rect.x -= (distance * process / 100);
        break;
    }
    // console.log('movingRect:', (distance * process / 100), rect);
    return rect;
  }

  /**
   * @private 格子中的数字
   */
  drawSquareNumber(ctx, rect, num) {
    ctx.fillStyle = "#ffffff"
    ctx.font = "33px Helvetica,Helvetica Neue,Arial,sans-serif"
    ctx.textAlign = "center";
    ctx.fillText(
      num,
      rect.x + (squareLen / 2),
      rect.y + (squareLen / 2) + 12,
      squareLen
    )
  }

  /**
   * @public 游戏步数
   */
  renderGameScore(ctx, score) {
    ctx.fillStyle = "#666666"
    ctx.font = "38px Arial,sans-serif"
    ctx.textAlign = "left";
    const padding = score > 999 ? 0 : (score > 99 ? 10 : 20)

    ctx.fillText(
      score + "",
      screenPadding + padding,
      textY,
      squareLen
    )
  }

  /**
   * @private 文字
   */
  renderPlainText(ctx) {
    ctx.fillStyle = "#b2b2b2"
    ctx.font = "18px Helvetica,Arial,sans-serif"
    ctx.textAlign = "left";

    ctx.fillText(
      "步 / 时间",
      screenPadding + squareLen + 5,
      textY - 5,
      squareLen
    )
  }

  /**
   * @public 游戏时间
   */
  renderTime(ctx, time) {
    ctx.fillStyle = "#666666"
    ctx.font = "28px Arial,sans-serif"

    ctx.fillText(
      time,
      screenPadding + squareLen * 2 + 10,
      textY - 2
    )
  }

  /**
   * @private 暂停图片按钮
   */
  renderPauseBtn(ctx) {
    ctx.drawImage(
      pauseImg,
      screenWidth - innerPadding - 50,
      textY - 26,
      28, 28
    )
  }

  /**
   * @public 暂停遮盖页面
   */
  renderPauseMask(ctx) {
    this.renderMask(ctx)

    ctx.drawImage(
      startImg,
      screenWidth / 2 - 60,
      screenHeight / 2 - 25,
      50, 50
    )

    ctx.drawImage(
      redoImg,
      screenWidth / 2 + 10,
      screenHeight / 2 - 25,
      50, 50
    )
  }

  renderStartMask(ctx) {
    this.renderMask(ctx)
    // 按钮背景
    ctx.fillStyle = '#aaccaa'
    var rect = Rect(screenWidth / 2 - 35, screenHeight / 2 - 20, 70, 40);
    drawRoundedRect(ctx, rect, 6);
    // 文字
    ctx.fillStyle = "#ffffff"
    ctx.font = "22px Helvetica Neue,Helvetica,Arial,sans-serif"
    ctx.fillText(
      '开始',
      screenWidth / 2 - 22,
      screenHeight / 2 + 7
    )
  }

  renderSuccessMask(ctx, count, time) {
    this.renderMask(ctx)

    // 背景框
    ctx.fillStyle = 'rgba(170, 170, 204, 0.63)'
    var rect = Rect(screenPadding * 2, screenHeight / 2 - 180, screenWidth - screenPadding * 4, 220);
    drawRoundedRect(ctx, rect, 6);

    // 按钮背景
    ctx.fillStyle = '#aaccaa'
    var rect = Rect(screenWidth / 2 - 53, screenHeight / 2 - 20, 106, 40);
    drawRoundedRect(ctx, rect, 6);
    // 按钮文字
    ctx.fillStyle = "#ffffff"
    ctx.font = "22px Helvetica Neue,Helvetica,Arial,sans-serif"
    ctx.fillText(
      '再玩一次',
      screenWidth / 2 - 44,
      screenHeight / 2 + 7
    )
    // 其他文字
    ctx.fillStyle = "#ffffff"
    ctx.font = "25px Arial,sans-serif"
    ctx.fillText(
      '用时:   ' + time,
      screenPadding * 2 + 20,
      screenHeight / 2 - 90
    )
    ctx.fillText(
      '步数:   ' + count,
      screenPadding * 2 + 20,
      screenHeight / 2 - 50
    )
    ctx.font = "20px Helvetica Neue,Helvetica,Arial,sans-serif"
    ctx.fillText(
      '恭喜你完成啦~',
      screenWidth / 2 - 66,
      screenHeight / 2 - 140
    )
  }

  renderMask(ctx) {
    ctx.fillStyle = 'rgba(6,6,6,.6)'
    ctx.fillRect(0, 0, screenWidth, screenHeight);
  }

  renderGameOver(ctx, score) {
    ctx.drawImage(atlas, 0, 0, 119, 108, screenWidth / 2 - 150, screenHeight / 2 - 100, 300, 300)

    ctx.fillStyle = "#ffffff"
    ctx.font = "20px Helvetica Neue,Helvetica,Arial,sans-serif"

    ctx.fillText(
      '游戏结束',
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 50
    )

    ctx.fillText(
      '得分: ' + score,
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 130
    )

    ctx.drawImage(
      atlas,
      120, 6, 39, 24,
      screenWidth / 2 - 60,
      screenHeight / 2 - 100 + 180,
      120, 40
    )

    ctx.fillText(
      '重新开始',
      screenWidth / 2 - 40,
      screenHeight / 2 - 100 + 205
    )
  }
}