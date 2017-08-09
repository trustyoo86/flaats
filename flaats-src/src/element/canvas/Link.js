/**
 * 객체간 링크
 * @name Link
 */
class Link {
  constructor(opt) {
    Object.assign(this, opt);

    if (!opt.stroke) {
      this.stroke = '#6799FF';
    }

    if (!opt.strokeWidth) {
      this.strokeWidth = 2;
    }

    if (!opt.strokeStyle) {
      this.strokeStyle = 'full';
    }

    if (!opt.strokeDash) {
      this.strokeDash = 1;
    }
  }

  /**
   * 라인을 그린다.
   * @memberof Link
   * @function render
   * @param {Object} opt option object
   */
  render(ctx, callback) {
    ctx.beginPath();

    // move & line
    ctx.moveTo(this.sx, this.sy);
    ctx.lineTo(this.ex, this.ey);

    // begin path
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;

    // stroke end
    ctx.stroke();

    // close path
    ctx.closePath();

    typeof callback == 'function' && callback();
    
  }

  /**
   * 객체에 따른 position을 변경한다.
   * @param {String} type type(시작 / 끝)
   * @param {Object} shape target이 될 shape 객체
   */
  modifyPosition(type, x, y) {
    const self = this;
    
    switch(type) {
      case 'start':
        self.sx = x;
        self.sy = y;
      break;
      case 'end':
        self.ex = x;
        self.ey = y;
      break;
    }
  }
}

export default Link;