// import Event from './events';

var dragbox = $('<div class="selector-handler" style="position:absolute;top:0;left:0;width:0;height:0;opacity:0.4;z-index:9999;border:1px solid black;background-color:black;"></div>'),
    initX = 0,
    initY = 0;

/**
 * selector class
 * @name  Selector
 * @version  0.1.0
 * @author  trustyoo86@linkit.kr
 */
class Selector {
  constructor() {
    this.enable = false;  // enable selector
  }

  /**
   * initialize
   * @memberof Selector
   * @function init
   */
  init() {
    this.enable = false;
    dragbox.remove();
    dragbox = $('<div class="selector-handler" style="position:absolute;top:0;left:0;width:0;height:0;opacity:0.4;z-index:9999;border:1px solid black;background-color:black;"></div>');
  }

  /**
   * selector start
   * @memberof Selector
   * @function start
   * @param  {Object}   target   target object
   * @param  {Object}   ev        event object
   * @param  {Function} callback [description]
   */
  start(targetDiv, target, ev, callback) {
    if (!this.enable) {
      return ;
    }

    let boundingBox = null,
        x = null,
        y = null;


    boundingBox = target.getBoundingClientRect();
    x = (ev.clientX - boundingBox.left) * (target.width / boundingBox.width);
    y = (ev.clientY - boundingBox.top) * (target.height / boundingBox.height);

    initX = x;
    initY = y;

    dragbox.css({
      top: initX,
      lefT: initY,
      width: 0,
      height: 0,
      display: 'none'
    });

    typeof callback == 'function' && callback(initX, initY);

    targetDiv.append(dragbox);
  }

  /**
   * selector draw
   * @memberof Selector
   * @function draw
   * @param  {Object}   ev        event object
   * @param  {Function} callback callback function after draw
   */
  draw(target, ev, callback) {
    if (!this.enable) {
      return ;
    }

    let boundingBox = null,
        x = null,
        y = null;

    boundingBox = target.getBoundingClientRect();
    x = (ev.clientX - boundingBox.left) * (target.width / boundingBox.width);
    y = (ev.clientY - boundingBox.top) * (target.height / boundingBox.height);

    let posX = Math.min(x, initX),
        posY = Math.min(y, initY),
        boxW = Math.abs(x - initX),
        boxH = Math.abs(y - initY);

    dragbox.css({
      top: posY,
      left: posX,
      width: boxW,
      height: boxH,
      display: 'block'
    });

    typeof callback == 'function' && callback(posY, posX, boxW, boxH);
  }

  /**
   * selector drag end
   * @memberof Selector
   * @function end
   * @param  {Function} callback callback function after drag end
   */
  end(target, ev, callback) {
    if (!this.enable) {
      return ;
    }

    let boundingBox = null,
        posx = null,
        posy = null,
        x = null,
        y = null;
    
    // bounding box 좌표를 얻어낸다.
    boundingBox = target.getBoundingClientRect();
    // position x
    posx = (ev.clientX - boundingBox.left) * (target.width / boundingBox.width);
    // position y
    posy = (ev.clientY - boundingBox.top) * (target.height / boundingBox.height);

    x = Math.min(posx, initX);
    y = Math.min(posy, initY);

    // selector 변수를 초기화한다.
    initX = 0;
    initY = 0;

    // style convert number
    let style = dragbox[0].style,
        w = parseInt(style.width),
        h = parseInt(style.height);

    dragbox.remove();

    typeof callback == 'function' && callback(x, y, w, h);
  }
}

export default Selector;