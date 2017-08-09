'use strict';

import iScroll from '../lib/iscroll/iScroll-custom'; // iscroll

// flaats utility
import Event from './events'; // events
import Layer from './layer';
import Selector from './selector';

// array prototype min & max 설정
Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

Array.prototype.min = function() {
	return Math.min.apply(null, this);
};

var iscroll = iScroll.iScroll;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

window.cancelRequestAnimFrame = (function(){
    return  window.cancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout
})();

/**
 * Flaats
 * @name Flaats
 * @version  0.9.1
 * @author  HanseungYoo (trustyoo86@linkit.kr)
 * @example
 *   var map = new Flaats({
 *    // Draw canvas wrapper element query string
 *    base: '.map',
 *    // If you want to put an image in the background, write down the path.
 *    image: 'path/to/image',
 *    // The function to call after the canvas has been set.
 *    onInitialize: function (layer) {
 *    },
 *    // Put the layer you want to use into an array.
 *    layer: [
 *      {id: 'layer id', name: 'layer name'}
 *    ],
 *    // Zoom level step
 *    step: 4,
 *    // canvas scale
 *    scale: 0.5,
 *    // Zoom level
 *    zoomLevel: 0
 *   });
 */
class Flaats {
  constructor(opt) {
    this._palette = null; // palette
    this._base = null; // base
    this._scrollDiv = null; // scroll div
    this._flaatsBase = null; // flaats base
    this._layer = null; // layer
    this._layerList = {}; // layer list
    this._size = {  // size
      width: 3000,  // width
      height: 2000  // height
    };
    this._scale = null; // scale
    this._zoomLevel = 0; // zoom level
    this._step = 4; // step
    this.mode = 'move'; // mode
    this._controlLayer = null;
    this.onInitialize = function () {}; //on initialize
    this._selector = new Selector();  // selector
    // shape
    this._startPos = null;  // start position
    this._polygon = null; // polygon
    this._drawingPathArr = [];  // polygon path array

    this._initialize(opt);
  }

  /**
   * initialize
   * @memberof Flaats
   * @function _initialize
   * @param {Object} opt option object
   */
  _initialize(opt) {
    let self = this;

    // this object binding
    for (var key in opt) {
      let val = opt[key];

      switch(key) {
        case 'base':
          self._base = val;
        break;
        case 'layer':
          self._layer = val;
        break;
        case 'size':
          self._size = val;
        break;
        case 'step':
          self._step = val;
        break;
        case 'zoomLevel':
          self._zoomLevel = val;
        break;
        case 'scale':
          self._scale = val;
        break;
        default:
          self[key] = val;
        break;
      }
    }

    try {
      if (opt.base) {
        this._base = $(opt.base);

        // base width, base height
        let baseWidth = parseFloat(this._base.width()), //base width
            baseHeight = parseFloat(this._base.height());  //base height

        this.setBase(baseWidth, baseHeight, (layer) => {

          let timer = setTimeout(function () {
            clearTimeout(timer);
            self.onInitialize(layer);
          });
          
        });
      } else {
        throw 'base is not defined';
      }
    } catch (e) {
      console.error(e.toString());
    }
  }

  /**
   * set base
   * @memberof Flaats
   * @function setBase
   * @param {Number} width  base width
   * @param {Number} height base height
   * @param {Function} callback callback function
   */
  setBase(width, height, callback) {
    let self = this,
        setPalette = (imagePath, callback) => {
          let baseTmplStr = '';

          // map base setting
          baseTmplStr = '<div class="map-base" style="position:absolute;opacity:0.5;top:0px;left:0px;user-select:none;">';

          // if image path is exist
          if (imagePath) {
            baseTmplStr += '<img src="' + imagePath + '" />';
          }
          // map base setting end
          baseTmplStr += '</div>';

          let baseTmpl = $(baseTmplStr)
            .css({
              width: self._size.width,
              height: self._size.height
            });

          // append map base layer before map base removed
          self._scrollDiv.find('.map-base').remove();
          self._scrollDiv
            .prepend(baseTmpl)
            .css({
              width: self._size.width,
              height: self._size.height
            });

          // base setting
          self._flaatsBase = baseTmpl;

          // set base scroll using iscroll
          self._scroll = new iscroll(self._base[0], {
            zoomMin: 0.1,
            hScrollbar: false,
            vScrollbar: false,
            bounce: false,
            momentum: false,
            lockDirection: false,
            wheelAction: 'none'
          });

          // get base scale
          var baseScale = parseFloat((1 / Math.max(self._size.width / width, self._size.height / height)).toFixed(3));

          // if step is not number
          if (typeof self._step != 'number') {
            // set default step
            self._step = 4;
          }

          // if scale is not number
          if (typeof self._scale != 'number') {
            self._scale = 1.5;
          }

          // zoom value initialize
          self._zoomValue = [];

          for (var idx=0; idx < self._step; idx++) {
            if (idx == 0) {
              self._zoomValue.push(baseScale);
            } else {
              self._zoomValue.push(parseFloat(baseScale * (idx * self._scale).toFixed(3)));
            }
          }

          // map base의 zoom level이 설정되지 않는 경우
          if (self._zoomValue[self._zoomLevel] == void 0) {
            // default의 zoomlevel을 설정
            self._zoomLevel = 0;
          }

          // set zoom
          self.setZoom(self._zoomLevel, () => {
            // if layer is not exist
            if (!self._layer) {
              // set default layer
              self._layer = [
                {
                  id: 'common-layer',
                  name: '공통 레이어',
                  type: 'canvas'
                }
              ];
            }

            try {
              // set layer loop
              for (var idx=0; idx < self._layer.length; idx ++) {
                var layer = self._layer[idx];

                if (layer.id) {
                  // add layer
                  self.addLayer(layer.id, layer.name, layer.type, idx, () => {
                    // if layer list
                    if (self.getObjSize(self._layerList) == self._layer.length) {
                      // trigger callback
                      typeof callback == 'function' && callback(self._flaatsBase);
                    }
                  });
                } else {
                  throw 'layer.id is not exist.';
                }                
              }
            } catch (e) {
              console.error(e);
              // trigger callback
              typeof callback == 'function' && callback(self._flaatsBase);
            }
            
          });
        };

    // append scrolldiv
    if (!this._scrollDiv) {
      this._scrollDiv = $('<div id="map-scroller" class="map-view" style="opacity:0;"></div>');
      this._base.append(this._scrollDiv);
    }

    try {
      // image가 존재하는 경우
      if (this.image) {
        var image = new Image();

        // image onload function
        image.onload = () => {
          // set base size using image width / height
          self._size.width = image.width;
          self._size.height = image.height;

          // set base and set background images
          setPalette(self.image, (layer) => {
            // trigger callback
            typeof callback == 'function' && callback(layer);
          });
        };

        // image on error
        image.onerror = (err) => {
          throw err;
        };

        image.src = this.image;
      } else {
        setPalette(null, callback);
      }
    } catch (e) {
      console.error('set canvas base error: ', e.toString());
    }
  }

  /**
   * object size를 체킹한다.
   * @memberof Flaats
   * @function getObjSize
   * @param {Object} obj 
   * @return {Number} cnt object count
   * @example
   *  var flaats = new Flaats();
   *  var obj = {a:1, b:2, c:3};
   * 
   *  flaats.getObjSize(obj)  // 3
   */
  getObjSize(obj) {
    var cnt = 0;

    // object loop
    for(var key in obj) {
      cnt++;
    }

    return cnt;
  }

  /**
   * element 방향으로 맵을 움직인다.
   * @memberof Flaats
   * @function moveToEl
   * @param {String} layerId layer id
   * @param {String} separatorName seperator name
   * @param {String} id object id
   * @example
   *  var flaats = new Flaats();
   * 
   *  flaats.moveToEl('common-layer', 'group', 1);
   */
  moveToEl(layerId, separatorName, id) {
    let targetLayer = this.getLayer(layerId),
        elInfo = targetLayer.getShape(separatorName, id);
    
    let scroller = this._scroll,
        posx, posy, maxx, maxy;

    // object에 따른 posx, posy 설정
    switch(elInfo.type) {
      // polygon인 경우
      case 'polygon':
        posx = (elInfo.posx * this._scroll.scale) - this._base.width() / 2;
        posy = (elInfo.posy * this._scroll.scale) - this._base.height() / 2;
      break;
      // image인 경우
      case 'image':
        posx = (elInfo.posx * this._scroll.scale) - this._base.width() / 2;
        posy = (elInfo.posy * this._scroll.scale) - this._base.height() / 2;
      break;
    }

    // max x,y 설정
    maxx = this._scroll.maxScrollX * -1;
    maxy = this._scroll.maxScrollY * -1;

    // posx, posy 설정
    posx = posx < 0 ? 0 : posx;
    posx = posx > maxx ? maxx : posx;
    posy = posy < 0 ? 0 : posy;
    posy = posy > maxy ? maxy : posy;

    this.setZoom(2, () => {
      // scrolling
      scroller.scrollTo(-1 * posx, -1 * posy);
    });
  }

  /**
   * object들을 추가한다.
   * @memberof Flaats
   * @function addShape
   * @param {String} layerId layerId
   * @param {Object} list    오브젝트 정보 (array 또는 object)
   */
  addShape(layerId, list, callback) {
    let listCnt = 0,
        targetLayer = this.getLayer(layerId) || this.getLayer('common-layer');

    // draw if target layer is exist.
    if (targetLayer) {
      // list가 array인 경우
      if (list.length) {
        // list 길이가 0 이상인 경우
        if (list.length > 0) {
          for (let idx=0; idx < list.length; idx++) {
            let listItem = list[idx];

            // 추가 형태인지 확인
            let isAdd = targetLayer.addGroup(listItem, listItem.group);

            // 추가가 가능한 경우
            if (isAdd) {
              listCnt ++;

              // list cnt가 list 길이와 맞닿은 경우
              if (listCnt == list.length) {
                targetLayer.drawLayer(() => {
                  typeof callback == 'function' && callback(false);
                });
              }
            // error
            } else {
              typeof callback == 'function' && callback(false);
            }
          }
        } else {
          typeof callback == 'function' && callback(false);
        }
      } else {
        // Object
        // object가 빈객체가 아닌 경우
        if (JSON.stringify(list) != '{}') {
          for (let key in list) {
            let listItem = list[key];

            // get boolean
            let isAdd = targetLayer.addGroup(listItem, listItem.group);

            // success
            if (isAdd) {
              listCnt ++;

              if (listCnt == Object.keys(list).length) {
                targetLayer.drawLayer(() => {
                  typeof callback == 'function' && callback(false);
                });
              }
            // error
            } else {
              typeof callback == 'function' && callback(false);
            }
          }
        } else {
          typeof callback == 'function' && callback(false);
        }
      }
    } else {
      throw 'target layer is not defined';
    }
  }

  /**
   * 링크를 추가한다.
   * @memberof Flaats
   * @function initializeLink
   * @param {String} layerId layer id
   * @param {Array} linkInfo link 정보
   * @param {Function} callback 링크 후의 callback function
   */
  addLink(layerId, linkInfo, opt, callback) {
    let targetLayer = this.getLayer(layerId) || this.getLayer('common-layer');
    
    if (targetLayer) {
      if (linkInfo.length) {
        if (linkInfo.length > 0) {
          targetLayer.addLink(linkInfo, opt, () => {
            typeof callback == 'function' && callback(false);  
          });
        } else {
          typeof callback == 'function' && callback(false);
        }
      } else {
        if (JSON.stringify(linkInfo) != '{}') {
          targetLayer.addLink(linkInfo, opt, () => {
            typeof callback == 'function' && callback(false);
          });
        } else {
          typeof callback == 'function' && callback(false);
        }
      }
    } else {
      throw 'target layer is not defined';
    }    
  }

  /**
   * set selector
   * @memberof Flaats
   * @function setSelector
   * @param {Function} onSelected 선택 상태가 되었을 때의 function
   */
  setSelector(opt) {
    let self = this,
        doc = $(document);

    let layer = self._controlLayer;

    // 변수 sync 문제 발생 방지를 위해 객체 복사
    let option = Object.assign({}, opt),
        onSelected = option.onSelected || function () {};

    // set control layer if z index is 1
    if (!self._controlLayer) {
      for (var layerId in self._layerList) {
        let layerItem = self._layerList[layerId];

        if (layerItem.zIndex == 1) {
          layer = layerItem;
        }
      }
    }

    this._base.unbind(Event.START).bind(Event.START, (e) => {
      e.stopPropagation();
      layer.unselectShapeAll();

      if (e.button != 0) {
        return ;
      }
      
      // select mode가 true인 경우
      if (self._selectMode) {
        if (!self._selector.enable || layer == void 0) {
          return false;
        }

        // 셀렉터 시작
        self._selector.start(layer.base, layer.layerObj, e, () => {});

        // 드래그 중인 경우
        doc.bind(Event.MOVE, (e) => {
          e.stopPropagation();
          self._selector.draw(layer.layerObj, e, () => {});
        });

        // 드래그가 끝난 경우
        layer.base.one(Event.END, (ev) => {
          ev.stopPropagation();
          doc.unbind(Event.MOVE);

          // selector end function을 호출한다.
          self._selector.end(layer.layerObj, ev, (x,y,w,h) => {
            // 소숫점을 제거한다. (퍼포먼스 및 계산)
            let startx = Math.round(x),
                starty = Math.round(y),
                endx = startx + w,
                endy = starty + h,
                list = null;
            
            // 리스트를 받아온다.
            list = layer.searchByPosition(startx, starty, endx, endy);
            // 리스트에 대한 object를 변경한다.
            // resize 및 dnd에 따른 function 을 전달한다.
            layer.selectShape(list, opt.resize || {}, opt.dnd || {});
            
            typeof onSelected == 'function' && onSelected(list);
          });
        });
      }
    });
  }

  /**
   * get zoom level
   * @memberOf  Flaats
   * @function getZoom
   * @return {Number} this._zoomLevel zoom level
   */
  getZoom() {
    return this._zoomLevel;
  }

  /**
   * set zoom
   * @memberof  Flaats
   * @function setZoom
   * @param {Number}   level    zoom level
   * @param {Function} callback callback function
   * @param {Number} time zoom delay
   */
  setZoom(level, callback, time) {
    let scroller = this._scroll,
        newScale = this._zoomValue[level];

    if (newScale == scroller.scale) {
      typeof callback == 'function' && callback(this._zoomLevel);
    } else {
      // get offset value
      var offset = scroller._offset(scroller.wrapper),
          x = scroller.wrapperW / 2 + offset.left,
          y = scroller.wrapperH / 2 + offset.top;

      // scroller zooming
      scroller.zoom(x, y, newScale, time);

      this.refresh();

      typeof callback == 'function' && callback(this._zoomLevel);
    }
  }

  /**
   * map을 갱신한다.
   * @memberof Flaats
   * @function refresh
   */
  refresh() {
    let base = this._base,
        scroller = this._scroll,
        parentW = base.width(),
        parentH = base.height(),
        scrollW = null,
        scrollH = null,
        x = null,
        y = null,
        scaleTimer = null;

    // scroller refresh
    scroller.refresh();

    // set scroll width / height
    scrollW = scroller.scrollerW;
    scrollH = scroller.scrollerH;

    // get x / y position
    x = scroller.x > 0 ? 0 : scroller.x;
    y = scroller.y > 0 ? 0 : scroller.y;

    // set scroll div style    
    this._scrollDiv.css({
      // width: Math.min(parentW, scrollW),
      'margin-top': Math.max((parentH - scrollH) / 2, 0),
      'margin-left': Math.max((parentW - scrollW) / 2, 0)
    });

    // scroller scrolling
    scroller.scrollTo(x, y);

    // scroll div opacity set 1
    if (this._scrollDiv.css('opacity') != 1) {
      this._scrollDiv.css('opacity', 1);
    }

    // set timer scroller delay
    scaleTimer = setTimeout(() => {
      clearTimeout(scaleTimer);
      scroller.refresh();
    }, 100);
  }

  /**
   * layer를 추가한다.
   * @memberof Flaats
   * @function addLayer
   * @param {String}   layerId  layer id
   * @param {String}   type     layer type
   * @param {Function} callback callback function after layer setting
   */
  addLayer(layerId, name, type, index, callback) {
    var divW = this._flaatsBase.css('width'),
        divH = this._flaatsBase.css('height');

    // layer object making
    var layer = new Layer(this._scrollDiv, {
      id: layerId,
      name: name || layerId,
      type: type,
      width: divW,
      height: divH,
      zIndex: index
    });

    // layer list save
    this._layerList[layerId] = layer;

    // layer trigger callback
    typeof callback == 'function' && callback(layer);
  }

  /**
   * get layer
   * @memberof Flaats
   * @function getLayer
   * @param  {String} layerId layer id
   * @return {Object} layer   target layer
   */
  getLayer(layerId) {
    return this._layerList[layerId];
  }

  /**
   * get layer list
   * @memberof Flaats
   * @function getLayerList
   * @return {Array}  this._layerList
   */
  getLayerList() {
    return this._layerList;
  }

  /**
   * 이벤트를 전체 해제한다.
   * @memberof Flaats
   * @function destroyEvent
   * @param  {Function} callback callback function after destroy event
   */
  destroyEvent(callback) {
    var doc = $(document),
        layers = this._layerList;

    for(var layerId in layers) {
      let layer = layers[layerId];

      // 각 변수들을 초기화 한다.
      layer.initVariables();
      // init한 후 layer를 다시 그린다.
      layer.drawLayer();
      let _scrollDiv = layer.base;

      // control base의 pointer events를 비활성화 한다.
      layer.controlBase
        .css('pointer-events', 'none');
      
      layer.unselectShapeAll();

      _scrollDiv.unbind(Event.DRAW_START);
      _scrollDiv.unbind(Event.DRAW_MOVE);
      _scrollDiv.unbind(Event.DRAW_END);
      _scrollDiv.removeClass('drawing');
    }

    doc.unbind(Event.DRAW_MOVE);
    doc.unbind(Event.MOVE);

    this._base.removeClass('move');
    this._base.removeClass('selector');
    this._base.unbind(Event.START);
    this._base.unbind(Event.end);

    typeof callback == 'function' && callback();
  }

  /**
   * 모드를 변경한다.
   * @memberof Flaats
   * @function changeMode
   * @param  {String} modeName mode name
   * @param {Object} opt option값 오브젝트
   */
  changeMode(modeName, opt) {
    const self = this,
          // sync 문제 발생할 수 있으므로, 객체를 복사
          option = Object.assign({}, opt),
          // shape가 선택 되었을 때
          onShapeSelected = option.onSelected,
          // mode가 끝났을때
          callback = option.onChangeModeFinished;

    switch(modeName) {
      case 'move':
        this.destroyEvent(() => {
          self._selectMode = false;
          // scroll enable
          self._scroll.enable();
          self._selector.enable = false;
          self._base.addClass('move');
        });
      break;
      case 'select':
        this.destroyEvent(() => {
          self._selectMode = true;
          self._selector.enable = true;
          self.setSelector(opt);
          // scroll diable
          self._scroll.disable();
        });
      break;
      case 'none':
        for (var layerId in this._layerList) {
          let layer = this._layerList[layerId];
          let _scrollDiv = layer.base;
          _scrollDiv.removeClass('drawing');
        }

        this._base.removeClass('move');
        this._selectMode = false;
        self._selector.enable = false;
        // scroll disable
        this._scroll.disable();
      break;
    }

    // callback function 호출 
    typeof callback == 'function' && callback();
  }

  /**
   * 
   * @param {Object} linkInfo link info
   */
  linkShape(linkInfo) {
    const layerId = linkInfo.layerId;
    let info = Object.assign({}, linkInfo);
    let targetLayer;

    // layer id가 존재하지 않는 경우
    if (!layerId) {
      let layerList = this.getLayerList();

      for(var id in layerList) {
        let layer = layerList[id];

        if (layer.zIndex == 1) {
          targetLayer = layer;
        }
      }
    } else {
      targetLayer = this.getLayer(layerId);
    }

    // target이 있어야 하며, link 갯수가 0 이상이어야 한다.
    if (info.target != void 0 && info.link.length > 0) {
      targetLayer.linkShape(info.target, info.link, linkInfo.option || {});
    } else {
      return false;
    }
  }

  /**
   * object를 그린다.
   * @memberof Flaats
   * @function drawingObj
   * @param {Object} opt object option
   */
  drawingShape(opt) {
    let self = this,
        layerBase = null,
        doc = $(document);

    let optObj = Object.assign({}, opt),
        layerId = optObj.layerId ? optObj.layerId : null,
        isSet = optObj.isSet ? optObj.isSet : true,
        section = optObj.section ? optObj.section : null,
        option = optObj.option ? optObj.option: {},
        moveCallback = optObj.onDragMove || function () {},
        callback = optObj.onFinished || function () {};

    try {
      if (!layerId) {
        throw 'layer id is not defined';
      } else {
        // layer의 z-index 변경
        this.changeIdx(layerId, (layer) => {
          // layer base 추출
          layerBase = layer.base;

          layerBase.unbind(Event.DRAW_MOVE);
          layerBase.unbind(Event.DRAW_END);

          if (isSet && section) {
            this._preMapMode = this.mode;
            // mode를 none으로 변경한다.
            this.changeMode('none');

            /**
             * 드래그 이동 이벤트
             * @event DRAW_MOVE
             */
            layerBase.bind(Event.DRAW_MOVE, (ev) => {
              let position = self.getBasePosition(ev);

              layer.drawShape(position, option);
              moveCallback(position);
            });

            layerBase.bind(Event.DRAW_END, (ev) => {
              let endPosition = self.getBasePosition(ev);

              layerBase.unbind(Event.DRAW_MOVE);
              layer.addObj(endPosition, section, option, () => {
                typeof callback == 'function' && callback(endPosition);
                self.drawingShape(opt);
              });
            });
          } else if (!isSet && section) {
            optObj.isSet = true;
            self.drawingShape(optObj);
          }
        });
      }
    } catch (e) {
      console.error('[setting object error]' + e);
    }
  }

  /**
   * polygon을 그린다.
   * @memberof Flaats
   * @function drawingPolygon
   * @param  {Object}  opt     option
   * @example
   * 
   *  Flaats.setDrawing({
   *    layerId: 'layer' // polygon을 그릴 layer id
   *    isSet: true // setting 할지에 대한 여부(false인 경우 그리기 실행 불가)
   *    section: 'group' // section에 대한 여부 section이 없는 경우 그리기 설정 불가
   *    option: {
   *      fill: '#000000',  // 채우기 색
   *      stroke: '#000000', // 선 색
   *      strokeWidth: 1, // 선 굵기
   *      opacity: 1 // 투명도
   *    },
   *    onFinished: function (obj) {  // 그리기가 끝난 후 callback function
   *    }
   *  });
   */
  drawingPolygon(opt) {
    let self = this,
        layerBase = null,
        doc = $(document);
    
    let optObj = Object.assign({}, opt),
        layerId = optObj.layerId ? optObj.layerId : null, // layer id
        isSet = optObj.isSet ? optObj.isSet : true, // is setting
        sectionName = optObj.section ? optObj.section : null, // section name
        option = optObj.option ? optObj.option : {},  // option
        drawStartCallback = optObj.onDrawStart || function () {},
        drawMoveCallback = optObj.onDraw || function () {},
        callback = optObj.onFinished || function () {};  // on finished callback
    
    try {
      if (!layerId) {
        throw 'layer id is not defined';
      } else {
        // change layer index
        this.changeIdx(layerId, (layer) => {
          // layer base 추출
          layerBase = layer.base;

          // polygon이 존재하는 경우 기존 polygon 정보들 삭제
          if (self._polygon) {
            layer.remove(self._polygon);
            self._polygon = null;
            self._startPos = null;
            self._drawingPathArr = [];
          }

          // 이벤트 해제
          layerBase.unbind(Event.DRAW_START);
          doc.unbind(Event.DRAW_MOVE);

          // setting이 있는 경우 또는 section name이 존재하는 경우 그리기 실행
          if (isSet && sectionName) {
            layerBase.removeClass('drawing');
            // pre map mode save
            this._preMapMode = this.mode;
            // change map mode none
            this.changeMode('none');

            // base add class drawing mode
            layerBase.addClass('drawing');
            // draw start event binding
            layerBase.bind(Event.DRAW_START, (ev) => {
              let pos = self.getBasePosition(ev),
                  pathLen = self._drawingPathArr.length,
                  isStart = pathLen == 0,
                  isFinish = pathLen > 3
                              && self._startPos != null
                              && Math.sqrt(Math.pow(pos.x - self._startPos.x, 2) + Math.pow(pos.y - self._startPos.y, 2)) <= 3;

              if (ev.button != 0) {
                return ;
              }

              drawStartCallback(pos);

              // if path length is 0
              if (isStart) {
                if (layer.type === 'canvas') {
                  self._polygon = {};
                } else {
                  layer.editPolygon(self._polygon, [pos], option, false, false);  
                }
                
                self._drawingPathArr.push(pos);
                self._startPos = pos;

                // document move event
                doc.bind(Event.DRAW_MOVE, (ev) => {
                  var movePos = self.getBasePosition(ev),
                      distance = Math.sqrt(Math.pow(movePos.x - self._startPos.x, 2) + Math.pow(movePos.y - self._startPos.y, 2)),
                      curLen = self._drawingPathArr.length;
                  
                  drawMoveCallback(movePos);
                  
                  // if finish position
                  if (distance <= 3 && curLen > 3) {
                    let pathArr = self._drawingPathArr;
                    // path array push
                    pathArr.push(self._startPos);
                    // polygon add
                    layer.editPolygon(self._polygon, self._drawingPathArr, option, true, false)
                  } else {
                    let paths = [];
                    // finished였다가 아닌 경우 startpos에 해당하는 객체를 삭제한다.
                    for(var idx=0; idx < self._drawingPathArr.length; idx++) {
                      let path = self._drawingPathArr[idx];

                      // array slice를 통해 삭제
                      if (idx != 0 && path.x != self._startPos && path.y != self._startPos.y) {
                        paths.push(path);
                      } else if (idx == 0) {
                        paths.push(path);
                      }
                    }

                    self._drawingPathArr = paths;

                    let pathArr = [...paths, movePos];

                    // path array push
                    // pathArr.push(movePos);
                    // polygon drawing
                    layer.editPolygon(self._polygon, pathArr, option, false, false)
                  }
                });
              } else if (isFinish) {
                // drawing path array push
                self._drawingPathArr.push(self._startPos);
                layer.addPolygon(self._polygon, self._drawingPathArr, sectionName, option, () => {
                  console.log('option is: ', option);
                  for(var key in option) {
                    if (key != 'fill' && key != 'stroke' && key != 'strokeWidth' && key != 'opacity') {
                      delete option[key];  
                    }
                  }

                  typeof callback == 'function' && callback(pos);
                  // drawingPolygon trigger
                  self.drawingPolygon(opt);
                });
              } else {
                self._drawingPathArr.push(pos);
                layer.editPolygon(self._polygon, self._drawingPathArr, option, false, false);
              }
            });
          } else if (!isSet && sectionName) {
            optObj.isSet = true;
            // drawing polygon trigger
            this.drawingPolygon(optObj);
          } else {
            return false;
          }
        });
      }
    } catch (e) {

    }
    
  }

  /**
   * layer를 show / hide 한다.
   * @param {String} layerId layer id
   * @param {Boolean} isShow show 할지 안할지에 대한 여부
   */
  controlLayerView(layerId, isShow) {
    let targetLayer = this.getLayer(layerId);

    // show 여부에 따른 show/hide
    switch(isShow) {
      case true:
        targetLayer.showLayer();
      break;
      case false:
        targetLayer.hideLayer();
      break;
    }
  }

  /**
   * layer에 해당하는 group을 show / hide한다.
   * @param {String} layerId layer id
   * @param {String} groupId group id
   * @param {Boolean} isShow show 할지에 대한 여부
   */
  controlGroupView(layerId, groupId, isShow) {
    let targetLayer = this.getLayer(layerId);

    switch(isShow) {
      case true:
        targetLayer.showGroup(groupId);
      break;
      case false:
        targetLayer.hideGroup(groupId);
      break;
    }
  }

  /**
   * layer에 해당하는 group을 삭제한다.
   * @param {String} layerId layer id
   * @param {String} groupId group id
   * @param {Function} callback callback function
   */
  deleteGroup(layerId, groupId, callback) {
    let targetLayer = this.getLayer(layerId);

    // 해당 target layer에 group에 대한 정보를 삭제한다.
    targetLayer.deleteGroup(groupId, () => {
      typeof callback == 'function' && callback();
    });
  }

  /**
   * get base position
   * @param  {Object} ev event object
   * @return {x} base position x
   * @return {y} base positoin y
   */
  getBasePosition(ev) {
    let basePosX = ev.offsetX,
        basePosY = ev.offsetY;

    return {
      x: parseInt(basePosX),
      y: parseInt(basePosY)
    };
  }

  /**
   * change index
   * @param  {String}   layerId  layer id
   * @param  {Function} callback layer id change callback
   */
  changeIdx(layerId, callback) {
    let targetLayer = this.getLayer(layerId),
        // target layer that z-index is 1.
        firstLayer = null;

    for (var layerId in this._layerList) {
      let layer = this._layerList[layerId];

      if (layer.zIndex == 1) {
        firstLayer = layer;
      }
    }

    // if target layer is first layer
    try {
      if (targetLayer) {
        if (targetLayer === firstLayer) {
          typeof callback == 'function' && callback(targetLayer);
        } else {
          // change index
          let copyIndex = targetLayer.zIndex;
          targetLayer.changeIndex(firstLayer.zIndex);
          firstLayer.changeIndex(copyIndex);
          copyIndex = null;

          this._controlLayer = targetLayer;

          typeof callback == 'function' && callback(targetLayer);
        }
      } else {
        throw 'target layer is empty.' + layerId;
      }
    } catch (e) {
      console.error('change index error: ', e.toString());
    }
    
  }
  
  /**
   * 소멸자
   * @memberof Flaats
   * @function destroy
   */
  destroy() {
    const self = this;

    for(let layerId in this._layerList) {
      let layer = self._layerList[layerId];
      layer.destroy();
    }

    this._palette = null; // palette
    this._base = null; // base
    this._scrollDiv = null; // scroll div
    this._flaatsBase = null; // flaats base
    this._scale = null; // scale
    this._zoomLevel = 0; // zoom level
    this._step = 4; // step
    this.mode = 'move'; // mode
    this._controlLayer = null;
    this.onInitialize = function () {}; //on initialize
    this._selector = null;  // selector
    // shape
    this._startPos = null;  // start position
    this._polygon = null; // polygon
    this._drawingPathArr = [];  // polygon path array
  }
}

export default Flaats;

// if (module.exports) {
//   module.exports = Flaats;
// } else {
//   window.Flaats = Flaats;
// }



