import { getInitialState } from './lib/util.js'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
  constructor() {
    // 单例
    if (instance)
      return instance

    instance = this

    this.reset()
  }

  // onRestart
  reset() {
    this.time = 0
    this.start = true // 初始为true
    this.pause = false
    this.success = false
    this.count = 0
    this.squares = getInitialState()
    this.emptyIndex = this.squares.empty

    this.frame = 0
  }

  onStart() {
    this.start = false
  }

  onPause() {
    this.pause = true
  }

  onResume() {
    this.time++
    this.pause = false
  }

  onMove(_from, _to) { // index: _from <=> _to
    var state = this.squares;
    var tmp = state.splice(_from, 1, state[_to])[0];
    state.splice(_to, 1, tmp);
    this.emptyIndex = parseInt(_from);
  }
}
