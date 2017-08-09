import Base from '../base';
import Color from '../../color';

class Polygon extends Base {
  constructor(opt, ctx) {
    super.initialize(opt);
    // prev history data
    this._prevData = {
      paths: null,
      fill: null,
      stroke: null,
      strokeWidth: null,
      opacity: null
    };

    this.textObj = $('<span class="text-obj"></span>')
      .css({
        position: 'absolute',
        'pointer-events': 'none',
        'font-size': 10,
        'font-weight': 'normal',
        'text-align': 'center',
        'color': '#000000'
      });
    
    // type 바인딩
    this.type = 'polygon';

    // hex일 경우 rgba로 변환
    this.fill = Color.isHex(opt.fill) ? Color.hexToRgba(opt.fill, opt.opacity) : opt.fill;
  }

  /**
   * rendering
   * @memberof Polygon
   * @function render
   */
  render(ctx) {
    let paths = null,
        fill = null,
        stroke = null,
        strokeWidth = null,
        opacity = null;

    // if opt.paths exist, save prev data
    // variables binding
    paths = this.paths;
    fill = this.fill;
    stroke = this.stroke;
    strokeWidth = this.strokeWidth;

    // set begin
    ctx.beginPath();

     // set stroke stype
    ctx.strokeStyle = stroke;

    // set stroke width
    ctx.lineWidth = strokeWidth;

    // path loop move and line to
    paths.forEach((pos, idx) => {
      switch(idx) {
        case 0:
          ctx.moveTo(pos.x, pos.y);
        break;
        default:
          ctx.lineTo(pos.x, pos.y);
        break;
      }
    });

    // set fill style
    ctx.fillStyle = Color.isHex(fill) ? Color.hexToRgba(fill, opacity) : fill;

    // fill polygon
    ctx.fill();

     // set stroke    
    ctx.stroke();

    // close path
    ctx.closePath();

    this.addText();
  }

  /**
   * text를 추가한다.
   * @memberof Polygon
   * @function addText
   * @param {Object} opt 
   */
  addText() {
    let textArea = this.controlBase;

    // text를 보여주는 경우
    if (this.showText) {
      // title이 html인 경우
      if (this.textHtml) {
        // textObj 변경
        this.textObj = $(this.textHtml);
      } else {
        this.textObj
          .attr('id', 'text-' + this.id)
          .attr('group-id', this.group)
          .empty().text(this.name || 'unnamed')
          .css({
            left: this.posx,
            top: this.posy
          });
      }
      textArea.append(this.textObj);
    }
  }

  /**
   * 선택상태에 놓는다.
   * @memberof Polygon
   * @function select
   */
  select() {
    this._prevFill = this.fill;
    this.fill = '#C90000';
  }

  /**
   * 선택상태를 해제한다.
   * @memberof Polygon
   * @function unSelect
   */
  unSelect() {
    if (this._prevFill) {
      this.fill = this._prevFill;
    }
  }
}

export default Polygon;