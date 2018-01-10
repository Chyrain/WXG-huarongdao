import { canMove, checkSuccess, formatTime } from 'lib/util'
import Runtime from 'lib/runtime'
import Music from 'lib/music'
import DataBus from './databus'

canvas.width = window.innerWidth
canvas.height = window.innerHeight
let ctx = canvas.getContext('2d')
let databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.runtime = new Runtime(() => {
      // 图片onload后刷新一次
      this.render()
    })
    this.music = new Music()
    this.initEvent()
    this.restart()
  }

  restart() {
    databus.reset()
    if (checkSuccess(databus)) {
      this.restart()
      return
    }
    console.log('reset emptyIndex', databus.emptyIndex, window.innerWidth, window.innerHeight);
    this.render()

    // wx.getSystemInfo({
    //   success: (res) => {
    //     console.log('getSystemInfo:', res);
    //   }
    // })
  }

  start() {
    databus.onStart()
    this.render()
    this.startTimer()
  }

  pause() {
    databus.onPause()
    this.stopTimer()
    this.render()
  }

  resume() {
    databus.onResume()
    this.render()
    this.startTimer()
  }

  onCheckSuccess() {
    if (checkSuccess(databus)) {
      this.stopTimer()
      databus.success = true
    }
  }

  startTimer() {
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => {
        ++databus.time;
        this.render()
      }, 1000);
    }
    // databus.start ? (databus.start = false) : (++databus.time)
  }
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = 0;
    }
  }

  moveComplete(_from, _to) {
    databus.onMove(_from, _to)
    this.music.playShoot()
    this.onCheckSuccess()
    this.render()
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    console.log('render')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.runtime.render(ctx, databus.squares)
    this.runtime.renderGameScore(ctx, databus.count)
    this.runtime.renderTime(ctx, formatTime(databus.time))

    if (databus.start) {
      this.runtime.renderStartMask(ctx)
    } else if (databus.pause) {
      this.runtime.renderPauseMask(ctx)
    } else if (databus.success) {
      this.runtime.renderSuccessMask(ctx, databus.count, formatTime(databus.time))
    }
  }

  /**
   * 判断点击是否在指定区域
   */
  touchInArea(e, area) {
    let x = e.touches[0].clientX
    let y = e.touches[0].clientY

    if (x >= area.startX
      && x <= area.endX
      && y >= area.startY
      && y <= area.endY) {
      return true
    }
    return false
  }

  initEvent() {
    wx.onHide(() => {
      this.pause()
    })
    wx.onShow(() => {
      this.render()
    })

    canvas.addEventListener('touchstart', ((e) => {
      e.preventDefault()
      let x = e.touches[0].clientX
      let y = e.touches[0].clientY
      console.log('touchstart', { x, y }, databus)

      // 按钮点击
      if (databus.start) {
        console.log('touchstart return', { x, y })
        if (this.touchInArea(e, this.runtime.startBtnArea)) {
          console.log('touchstart startBtnArea', { x, y }, this.runtime.startBtnArea);
          this.start();
        }
        return
      } else if (databus.pause) {
        console.log('touchstart return', { x, y })
        if (this.touchInArea(e, this.runtime.resumeBtnArea)) {
          console.log('touchstart resumeBtnArea');
          this.resume();
        } else if (this.touchInArea(e, this.runtime.refreshBtnArea)) {
          console.log('touchstart refreshBtnArea');
          this.restart();
        }
        return
      } else if (databus.success) {
        console.log('touchstart return', { x, y })
        if (this.touchInArea(e, this.runtime.restartBtnArea)) {
          console.log('touchstart restartBtnArea', { x, y }, this.runtime.restartBtnArea);
          this.restart();
        }
        return
      }

      // 游戏逻辑
      if (this.touchInArea(e, this.runtime.boardArea)) {
        console.log('touchstart touchBoardArea');
        this.startX = x;
        this.startY = y;
        let index = this.runtime.getTouchIndex(x, y);
        if (index >= 0 && index != databus.emptyIndex) {
          this.touched = true;
          this.touchIndex = index;
          console.log('touchstart touchIndex:', this.touchIndex);
        }
        // this.setAirPosAcrossFingerPosZ(x, y)
      } else if (this.touchInArea(e, this.runtime.pauseBtnArea)) {
        console.log('touchstart touchPauseBtn');
        this.pause();
      }
    }).bind(this));

    canvas.addEventListener('touchmove', ((e) => {
      e.preventDefault()
      if (this.moving || databus.start || databus.pause || databus.success) {
        return
      }
      if (!this.touchInArea(e, this.runtime.boardArea)) {
        return
      }

      if (this.touched) {
        let x = e.touches[0].clientX
        let y = e.touches[0].clientY
        let deltaX = x - this.startX;
        let deltaY = y - this.startY;
        let absX = Math.abs(deltaX);
        let absY = Math.abs(deltaY);

        var move = { x: 0, y: 0 };
        if (absY >= 30) {
          move.y = deltaY > 0 ? 1 : -1;
        }
        if (absX >= 30) {
          move.x = deltaX > 0 ? 1 : -1;
        }
        console.log('touchmove', { x, y, deltaX, deltaY }, move);//////

        // 判断touch的square，以及是否canMove，true则得到movingDir, ->
        // 开启动画，并置 this.moving = true，10帧动画完成this.moving = false
        var dir = canMove(this.touchIndex, move, databus.emptyIndex);
        if (dir) {
          console.warn('touch index move to direction:', dir);
          this.moving = true;
          this.runtime.startMovingAnimation(
            this.touchIndex, 
            dir,
            () => {
              this.render(ctx, databus.squares)
            },
            () => {
              console.warn('move animation complete');
              ++databus.count;
              this.moving = false;
              this.moveComplete(this.touchIndex, databus.emptyIndex);
            }
          )
          this.touched = false
        }
      }
    }).bind(this));

    canvas.addEventListener('touchend', ((e) => {
      e.preventDefault()
      console.log('touchend')

      this.touched = false
    }).bind(this));
  }
}
