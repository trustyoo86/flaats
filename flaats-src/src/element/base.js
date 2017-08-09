/**
 * Element Base
 * @name  Base
 * @class  Base
 * @example
 *  import Base from './base';
 * 
 *  class Path extends Base {
 *    constructor(option) {
 *      super.initialize(option);
 *    }
 *  }
 * 
 */
class Base {
  /**
   * 객체 옵션에 따른 초기화를 한다.
   * @memberof Base
   * @function intialize
   * @param {Object} opt shape의 옵션
   */
  initialize(opt) {
    let option = opt || {};

    /**
     * element의 id
     * @property id
     * @type {String}
     */
    this.id = option.id;
    /**
     * element의 이름
     * @property name
     * @type {String}
     */
    this.name = option.name || 'unnamed';
    /**
     * element에 그려지는 layer 객체
     * @property layer
     * @type {Object}
     */
    this.layer = option.layer;  // layer
    /**
     * element를 control 하기 위한 jQuery base element
     * @property controlBase
     * @type {Object}
     */
    this.controlBase = option.controlBase;  // text layer
    /**
     * shape가 포함되는 group의 id
     * @property group
     * @type {String}
     */
    this.group = option.group.id;  // group
    /**
     * shape를 칠하기 위한 색
     * @property fill
     * @type {String}
     */
    this.fill = option.fill || '#bdbdbd'; // fill
    /**
     * shape의 테두리 색
     * @property stroke
     * @type {String}
     */
    this.stroke = option.stroke || '#000000'; // stroke
    /**
     * shape의 테두리 두께
     * @property strokeWidth
     * @type {Number}
     */
    this.strokeWidth = option.strokeWidth || 1;
    /**
     * polygon인 경우 shape를 그리기 위한 path position 배열
     * @property paths
     * @type {Array}
     */
    this.paths = option.paths || [];  // path array
    /**
     * shape를 그리기 위한 x 좌표
     * @property posx
     * @type {Number}
     */
    this.posx = option.posx;  // center x
    /**
     * shape를 그리기 위한 y 좌표
     * @property posy
     * @type {Number}
     */
    this.posy = option.posy;  // center y
    /**
     * shape의 넓이값
     * @property width
     * @type {Number}
     */
    this.width = option.width;  // width
    /**
     * shape의 높이값
     * @property height
     * @type {Number}
     */
    this.height = option.height;  // height
    /**
     * control base에 shape의 이름을 표시하기 위한 여부
     * @property showText
     * @type {Boolean}
     */
    this.showText = option.showText || true;  // show text
    /**
     * html로 shape의 이름 영역을 그리는 경우 사용하는 변수
     * @property textHtml
     * @type {String}
     */
    this.textHtml = option.textHtml;  // text html
    /**
     * polygon인 경우 시작점 x 좌표
     * @property x1
     * @type {Number}
     */
    this.x1 = option.x1; // x1
    /**
     * polygon인 경우 종착점 x 좌표
     * @property x2
     * @type {Number}
     */
    this.x2 = option.x2; // x2
    /**
     * polygon인 경우 시작점 y 좌표
     * @property y1
     * @type {Number}
     */
    this.y1 = option.y1; // y1
    /**
     * polygon인 경우 종착점 y 좌표
     * @property y2
     * @type {Number}
     */
    this.y2 = option.y2; // y2

    if (this.type === 'polygon') {
      /**
       * 중앙점 x 좌표
       * @property centerx
       * @type {Number}
       */
      this.centerx = this.posx;
      /**
       * 중앙점 y 좌표
       * @property centery
       * @type {Number}
       */
      this.centery = this.posy;
    } else {
      /**
       * 중앙점 x 좌표
       * @property centerx
       * @type {Number}
       */
      this.centerx = this.posx + (this.width / 2);
      /**
       * 중앙점 y 좌표
       * @property centery
       * @type {Number}
       */
      this.centery = this.posy + (this.height / 2);
    }
  }

  /**
   * x,y좌표 넓이,높이 정보를 한번에 조회한다.
   * @memberof Base
   * @function getTotalInfo
   * @returns {Object} 종합 정보
   * @return {Number} x x좌표
   * @return {Number} y y좌표
   * @return {Number} width 넓이
   * @return {Number} height 높이
   */
  getTotalInfo() {
    return {
      x: this.posx,
      y: this.posy,
      width: this.width,
      height: this.height
    };
  }

  /**
   * 사이즈 정보를 조회한다.
   * @memberof Base
   * @function getSize
   * @returns {Object} 사이즈 정보
   * @return {Number} width 넓이
   * @return {Number} height 높이
   */
  getSize() {
    return {
      width: this.width,
      height: this.height
    };
  }

  /**
   * 위치 정보를 가져온다.
   * @memberof Base
   * @function getPosition
   * @returns {Object} 위치 정보
   * @return {Number} x x 좌표
   * @return {Number} y y 좌표
   */
  getPosition() {
    return {
      x: this.posx,
      y: this.posy
    };
  }

  /**
   * 중심 좌표를 반환한다.
   * @memberof Base
   * @function getCenterPosition
   * @return {Number} x center x position
   * @return {Number} y center y position
   */
  getCenterPosition() {
    return {
      x: this.centerx,
      y: this.centery
    };
  }

  /**
   * 텍스트 정보를 반환한다.
   * @memberof Base
   * @function getTextInfo
   * @return {Number} x text x
   * @return {Number} y text y
   * @return {String} label label string
   */
  getTextPosition() {
    return {
      x: this.posx,
      y: this.posy,
      label: ''
    };
  }
}

export default Base;