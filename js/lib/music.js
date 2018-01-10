let instance

/**
 * 统一的音效管理器
 */
export default class Music {
  constructor() {
    if (instance)
      return instance

    instance = this
    
    this.shootAudio = new Audio()
    this.shootAudio.src = 'audio/bullet.mp3'
  }
  playShoot() {
    this.shootAudio.currentTime = 0
    this.shootAudio.play()
  }
}
