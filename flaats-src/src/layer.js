import Event from './events'; // events
import Color from './color'; // color

import Polygon from './element/canvas/polygon';
import ImageShape from './element/canvas/Image';
import Link from './element/canvas/Link';
/**
 * Flaats layer
 * @name  Layer
 * @version  0.1.0
 * @author  HanseungYoo(trustyoo86@linkit.kr)
 */
export default class Layer {
    /**
     * Layer constructor
     * @memberof Layer
     * @param {Object} target layer를 렌더링할 대상 객체
     * @param {Object} opt layer의 option값들을 포함한 객체
     */
    constructor(target, opt) {
        /**
         * layer를 그리기 위한 base element
         * @property base
         * @type {Object}
         */
        this.base = null; // base
        /**
         * 실제 레이어를 담당하고 있는 오브젝트 (svg / canvas)
         * @property layerObj
         * @type {Object}
         */
        this.layerObj = null; // layer object
        /**
         * 레이어의 이름
         * @property name
         * @type {String}
         */
        this.name = opt.name; // layer 이름
        /**
         * 레이어의 id 값
         * @property layerObjId
         * @type {String}
         */
        this.layerObjId = null;
        /**
         * 레이어의 타입
         * svg 또는 canvas로 설정
         * @property type
         * @type {String}
         */
        this.type = opt.type || 'canvas'; // type
        /**
         * 레이어를 그리고, 베이스를 설정하기 위한 jQuery 타겟 element
         * @property target
         * @type {Object}
         */
        this.target = target; // target
        /**
         * 레이어 id
         * @property layerId
         * @type {String}
         */
        this.layerId = opt.id; // layer id
        /**
         * 레이어의 넓이
         * @property width
         * @type {Number}
         */
        this.width = parseFloat(opt.width); // width
        /**
         * 레이어의 높이
         * @property height
         * @type {Number}
         */
        this.height = parseFloat(opt.height); // height
        /**
         * 레이어의 z-index값
         * 선택되는 레이어에 따라 z-index값을 교체함.
         * 레이어의 z-index는 순서에 따라 결정됨
         * @property zIndex
         * @type {Number}
         */
        this.zIndex = opt.zIndex + 1; // z-index
        /**
         * 수정하고 있는 shape object
         * @property editShape
         * @type {Object}
         */
        this.editShape = null;
        /**
         * shape의 텍스트 또는 크기조정 controller를 바인딩 하기 위한 jQuery control element
         * @property controlBase
         * @type {Object}
         */
        this.controlBase = null;
        // polygon
        /**
         * polygon을 그리고 있는 현재 객체 표시
         * @property _drawPath
         * @type {Object}
         */
        this._drawPath = null;
        /**
         * polygon을 그리기 위한 시작점
         * @property _drawStartPos
         * @type {Object}
         */
        this._drawStartPos = null;
        /**
         * polygon을 그리기 위한 포지션들을 가지고 있는 배열
         * @property _editPathArr
         * @type {Array}
         */
        this._editPathArr = [];

        /**
         * shape들을 저장하기 위한 단위. Object형태로 id를 key값 형태로 가지고 있음.
         * @property _group
         * @type {Object}
         */
        this._group = {};
        /**
         * shape가 추가될 경우, unique한 id를 생성하기 위한 변수
         * @property _uniqueId
         * @type {Number}
         */
        this._uniqueId = 0;

        /**
         * selector를 통해 선택된 shape의 리스트
         * @property _selectedShape
         * @type {Array}
         */
        this._selectedShape = [];

        /**
         * 편집 상태에서 image shape를 표현하기 위해서 필요한 image url
         * @property imageUrl
         * @type {String}
         */
        this.imageUrl = null;
        /**
         * 퍼포먼스 향상을 위해서, 계속해서 url에 대한 이미지 객체를 생성하는 것이 아닌, 한번 만들어놓고 사용하기 위한 image 객체
         * @property image
         * @type {Object}
         */
        this.image = null;

        /**
         * 선 연결시, 시작점 및 종착점, 시작 좌표 및 종착 좌표를 가지고 있는 배열 형태의 객체 모음
         * @property _linkInfo
         * @type {Array}
         */
        this._linkInfo = [];

        this.initialize();
    }

    /**
     * initialize
     * @memberOf  Layer
     * @function initialize
     */
    initialize() {
        let self = this,
            // 타이틀 등의 text base
            controlBase = $('<div class="control-base"></div>')
            .css({
                width: '100%',
                height: '100%',
                position: 'absolute',
                'pointer-events': 'none'
            }),
            // layer base
            layerBase = $('<div class="layer-base"></div>')
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
                'z-index': self.zIndex,
                width: self.width,
                height: self.height
            });
        // text base 바인딩
        this.controlBase = controlBase;

        try {
            // layer base에 id 설정
            layerBase.attr('layer-id', this.layerId);

            // text layer 추가
            layerBase.append(controlBase);

            this.target
                .append(layerBase);

            // generate layer using type
            switch (this.type) {
                case 'canvas':
                    // layerObjId making
                    self.layerObjId = 'canvas-' + self.layerId;

                    // layer obj generate
                    let canvas = document.createElement('canvas');
                    // layer id binding
                    canvas.id = self.layerObjId;

                    // NOTE: default canvas set width / height
                    // layer width binding
                    canvas.width = self.width;
                    // layer height binding
                    canvas.height = self.height;

                    // canvas append
                    layerBase.append($(canvas));

                    // generate fabric object
                    this.layerObj = canvas;
                    break;
                case 'svg':
                    break;
            }

            this.base = layerBase;
        } catch (e) {
            console.error('set layer error:', e.toString());
        }
    }

    /**
     * layer에서 사용되는 this 변수들을 초기화한다.
     * @memberof Layer
     * @function initVariables
     */
    initVariables() {
        // polygon
        this._drawPath = null;
        this._drawStartPos = null;
        this._editPathArr = [];

        // image 객체
        this.imageUrl = null;
        this.image = null;
    }

    /**
     * layer를 showing 한다.
     * @memberof Layer
     * @function showLayer
     */
    showLayer() {
        this.base.css('display', '');
    }

    /**
     * layer를 hide 한다.
     * @memberof Layer
     * @function hideLayer
     */
    hideLayer() {
        this.base.css('display', 'none');
    }

    /**
     * group을 showing 한다.
     * @memberof Layer
     * @function showGroup
     * @param {String} groupId group id
     */
    showGroup(groupId) {
        this._group[groupId].show = true;
        this.controlBase.find('.text-obj[group-id="' + groupId + '"]').css('display', '');
        this.drawLayer();
    }

    /**
     * group을 hide 한다.
     * @memberof Layer
     * @function hideGroup
     * @param {String} groupId group id
     */
    hideGroup(groupId) {
        this._group[groupId].show = false;
        this.controlBase.find('.text-obj[group-id="' + groupId + '"]').css('display', 'none');
        this.drawLayer();
    }

    /**
     * change index
     * @param  {Number} zIndex z-index
     */
    changeIndex(zIndex) {
        this.zIndex = zIndex;
        this.base.css('z-index', zIndex);
    }

    /**
     * shape를 선으로 연결한다.
     * @memberof Layer
     * @function linkShape
     * @param {Object} target
     * @param {Array} link
     */
    linkShape(target, link, opt) {
        const self = this;

        let linkArr = [];

        for (let idx = 0; idx < link.length; idx++) {
            let linkObj = link[idx],
                linkInfo = {
                    id: target.id + '~' + linkObj.id,
                    targetId: target.id,
                    linkId: linkObj.id,
                    layer: self.layerObj,
                    sx: target.posx + (target.width / 2),
                    sy: target.posy + (target.height / 2),
                    ex: linkObj.posx + (linkObj.width / 2),
                    ey: linkObj.posy + (linkObj.height / 2)
                };

            linkInfo = Object.assign(linkInfo, opt);

            linkArr.push(linkInfo);
        }

        // link info에 같이 merge한다.
        this._linkInfo = [...this._linkInfo, ...linkArr];
        this.drawLayer();
    }

    /**
     * link를 그린다.
     * @memberof Layer
     * @function addLink
     * @param {Array} linkInfo link 정보
     * @param {Object} opt option object
     * @param {Function} callback callback function
     */
    addLink(linkInfo, opt, callback) {
        const self = this;

        for (let idx in linkInfo) {
            let linkObj = linkInfo[idx];

            linkObj.layer = self.layerObj;
        }

        // link info에 merge 한다.
        this._linkInfo = [...this._linkInfo, ...linkInfo];

        this.drawLink(() => {
            typeof callback == 'function' && callback();
        });
    }

    /**
     * remove shape
     * @param  {Object} shape shape object
     */
    remove(shape) {
        // remove object type
        switch (this.type) {
            case 'canvas':
                //this.layerObj.remove(shape);
                break;
            case 'svg':
                break;
        }
    }

    /**
     * position에 따른 해당 레이어의 shape를 반환한다.
     * @memberof Layer
     * @function searchByPosition
     * @param {Number} sx start x
     * @param {Number} sy start y
     * @param {Number} ex end x
     * @param {Number} ey end y
     * @return {Array} list 해당 정보가 포함된 shpae들의 리스트
     */
    searchByPosition(sx, sy, ex, ey) {
        let self = this,
            list = [];

        // group에서 shape 추출
        for (let groupId in this._group) {
            let group = self._group[groupId],
                shapes = group.items;

            // group 내의 shape들을 loop돌며 비교
            for (let shapeId in shapes) {
                let shape = shapes[shapeId].obj;

                switch (shape.type) {
                    case 'polygon':
                        // click의 경우
                        if (sx === ex && sy === ey) {
                            if (sx > shape.x1 && shape.x2 > ex && sy > shape.y1 && shape.y2 > ey) {
                                list.push(shape);
                            }
                            // 드래그 하는 경우
                        } else {
                            if (sx < shape.posx && shape.posx < ex && sy < shape.posy && shape.posy < ey) {
                                list.push(shape);
                            }
                        }
                        break;
                    case 'image':
                        let startx = shape.posx,
                            starty = shape.posy,
                            endx = shape.posx + shape.width,
                            endy = shape.posy + shape.height;

                        if (sx === ex && sy === ey) {
                            if (sx > startx && endx > ex && sy > starty && endy > ey) {
                                list.push(shape);
                            }
                        } else {
                            if (sx < startx && endx < ex && sy < starty && endy < ey) {
                                list.push(shape);
                            }
                        }
                        break;
                }
            }
        }

        return list;
    }

    /**
     * shape들을 선택 상태로 변경한다.
     * @memberof Layer
     * @function selectShape
     * @param {Array} list shape list
     * @param {Object} resizeOpt resize 관련 option
     * @param {Object} dndOpt drag drop 관련 option
     */
    selectShape(list, resizeOpt, dndOpt) {
        this._selectedShape = list;

        if (list.length > 0) {
            for (let idx = 0; idx < list.length; idx++) {
                let shape = list[idx];
                shape.select();
            }

            // control base의 pointer events를 활성화 한다.
            this.controlBase
                .css('pointer-events', '');
        }

        this.drawLayer();
        this.controlHandler(resizeOpt, dndOpt);
    }

    /**
     * bounding position 값을 추출한다.
     * @memberof Layer
     * @function getBoundingPosition
     * @param {Object} ev event object
     * @return {Number} x position x
     * @return {Number} y position y
     */
    getBoundingPosition(ev) {
        let boundingBox = this.layerObj.getBoundingClientRect(),
            x = (ev.clientX - boundingBox.left) * (this.layerObj.width / boundingBox.width),
            y = (ev.clientY - boundingBox.top) * (this.layerObj.height / boundingBox.height);

        return {
            x: parseInt(x),
            y: parseInt(y)
        };
    }

    /**
     * control base에서 이벤트를 핸들링한다.
     * @memberof Layer
     * @function controlHandler
     * @param {Object} resizeOpt resize 옵션
     * @param {Object} dndOpt drag drop 옵션
     */
    controlHandler(resizeOpt, dndOpt) {
        const self = this,
            doc = $(document);

        this.controlBase.unbind(Event.DRAW_START);
        doc.unbind(Event.DRAW_MOVE);
        this.controlBase.unbind(Event.DRAW_END);

        this.controlBase.bind(Event.DRAW_START, (sv) => {
            let target = $(sv.target),
                parent = target.closest('.shape-controller');


            // event의 target이 핸들러인 경우 이벤트 바인딩
            if (target.hasClass('handler')) {
                let boundingPosition = self.getBoundingPosition(sv),
                    targetType = target.attr('handler-type'),
                    targetId = parent.attr('id').split('control-')[1],
                    left = boundingPosition.x,
                    top = boundingPosition.y,
                    width = parseInt(parent.width()),
                    height = parseInt(parent.height()),
                    diffX, diffY;

                switch (targetType) {
                    case 'lt':
                        diffX = left + width;
                        diffY = top + height;
                        break;
                    case 'lb':
                        diffX = left + width;
                        diffY = top - height;
                        break;
                    case 'rt':
                        diffX = left - width;
                        diffY = top + height;
                        break;
                    case 'rb':
                        diffX = left - width;
                        diffY = top - height;
                        break;
                }

                sv.stopPropagation();
                doc.bind(Event.DRAW_MOVE, (mv) => {
                    mv.stopPropagation();
                    let movePos = self.getBoundingPosition(mv);

                    switch (targetType) {
                        // 좌상
                        case 'lt':
                            if (movePos.x < diffX) {
                                left = movePos.x;
                                width = diffX - movePos.x;
                            }

                            if (movePos.y < diffY) {
                                top = movePos.y;
                                height = diffY - movePos.y;
                            }
                            break;
                            // 좌하
                        case 'lb':
                            if (movePos.x < diffX) {
                                left = movePos.x;
                                width = diffX - movePos.x;
                            }

                            if (movePos.y > diffY) {
                                top = diffY;
                                height = movePos.y - diffY;
                            }
                            break;
                            // 우상
                        case 'rt':
                            if (movePos.x > diffX) {
                                left = diffX;
                                width = movePos.x - diffX;
                            }

                            if (movePos.y < diffY) {
                                top = movePos.y;
                                height = diffY - movePos.y;
                            }
                            break;
                            // 우하
                        case 'rb':
                            if (movePos.x > diffX) {
                                left = diffX;
                                width = movePos.x - diffX;
                            }

                            if (movePos.y > diffY) {
                                top = diffY;
                                height = movePos.y - diffY;
                            }
                            break;
                    }

                    // 셀렉터에 대한 css를 변경한다.
                    parent.css({
                        left: left - 5,
                        top: top - 5,
                        width: width + 10,
                        height: height + 10
                    });

                    // 객체를 선택하고, 변경 값에 따른 오브젝트를 변경한다.
                    self.modifyShape({
                        id: targetId,
                        left: left,
                        top: top,
                        width: width,
                        height: height
                    }, () => {
                        // layer를 다시 그린다.
                        self.drawLayer();
                    });
                });

                typeof resizeOpt.onResize === 'function' && resizeOpt.onResize(self.getShape(null, targetId), moveLeft, moveTop, moveWidth, moveHeight);

                self.controlBase.one(Event.DRAW_END, (ev) => {
                    ev.stopPropagation();
                    let endPos = self.getBoundingPosition(ev);

                    typeof resizeOpt.onEnd === 'function' && resizeOpt.onEnd(self.getShape(null, targetId), left, top, width, height);

                    self.controlHandler(resizeOpt, dndOpt);
                });
            } else if (target.hasClass('controller-wrapper')) {
                let targetId = parent.attr('id').split('control-')[1];
                sv.stopPropagation();
                const pw = parseInt(parent.width()),
                    ph = parseInt(parent.height());
                // 드래그 중
                doc.bind(Event.DRAW_MOVE, (mv) => {
                    mv.stopPropagation();
                    let movePos = self.getBoundingPosition(mv),
                        // 중심점을 이동 점으로 보고 x, y좌표 설정
                        sx = movePos.x - (pw / 2),
                        sy = movePos.y - (ph / 2);

                    // 셀렉터에 대한 css를 변경한다.
                    parent.css({
                        left: sx - 5,
                        top: sy - 5
                    });

                    typeof dndOpt.onMove === 'function' && dndOpt.onMove(self.getShape(null, targetId), sx, sy);

                    // 객체를 선택하고, 변경 값에 따른 오브젝트를 변경한다.
                    self.modifyShape({
                        left: sx,
                        top: sy,
                        id: targetId
                    }, () => {
                        // layer를 다시 그린다.
                        self.drawLayer();
                    });
                });

                // 드래그 종료
                self.controlBase.one(Event.DRAW_END, (ev) => {
                    ev.stopPropagation();
                    // 드래그 엔드에 대한 포지션 추출
                    let endPos = self.getBoundingPosition(ev),
                        sx = endPos.x - (pw / 2),
                        sy = endPos.y - (ph / 2);

                    // 셀렉터에 대한 css를 변경한다.
                    parent.css({
                        left: sx - 5,
                        top: sy - 5
                    });

                    // 객체를 선택하고, 변경 값에 따른 오브젝트를 변경한다.
                    self.modifyShape({
                        left: sx,
                        top: sy,
                        id: targetId
                    }, () => {
                        // layer를 다시 그린다.
                        self.drawLayer();
                        self.controlHandler(resizeOpt, dndOpt);
                        typeof dndOpt.onEnd === 'function' && dndOpt.onEnd(self.getShape(null, targetId), sx, sy);
                    });
                });
            }
        });
    }

    /**
     * 연결 정보를 이동 시킨다.
     * @memberof Layer
     * @function linkMove
     * @param {Object} target target
     * @param {Function} callback 호출 후 callback function
     */
    linkMove(target, callback) {
        const self = this;

        for (var idx = 0; idx < this._linkInfo.length; idx++) {
            let link = self._linkInfo[idx],
                linkObj = link.obj,
                type = null,
                x = target.posx + (target.width / 2),
                y = target.posy + (target.height / 2);

            // targetId가 동일한 경우
            if (link.targetId === target.id) {
                type = 'start';
            }

            if (link.linkId === target.id) {
                type = 'end';
            }

            linkObj.modifyPosition(type, x, y);
        }


        typeof callback == 'function' && callback();
    }

    /**
     * 형태를 변경한다.
     * @memberof Layer
     * @function modifyShape
     * @param {Object} opt option object
     * @param {Function} callback 형태 변경 한 후의 callback function
     */
    modifyShape(opt, callback) {
        let self = this;
        const list = this._selectedShape;

        if (list.length > 0) {
            for (let idx = 0; idx < list.length; idx++) {
                let shape = list[idx];

                if (shape.id == opt.id) {
                    // 형태 변경
                    shape.modifyShape(opt, () => {
                        self.linkMove(shape, () => {
                            typeof callback == 'function' && callback();
                        });
                    });
                }
            }
        }
    }

    /**
     * 선택된 모든 shape들을 해체 상태로 놓는다.
     * @memberof Layer
     * @function unselectShapeAll
     */
    unselectShapeAll() {
        let list = this._selectedShape;

        for (let idx = 0; idx < list.length; idx++) {
            let shape = list[idx];
            shape.unSelect();
        }

        this.drawLayer();
    }

    /**
     * 오브젝트를 추가한다.
     * @memberof Layer
     * @function addObj
     * @param {Object} position 위치 객체
     * @param {Object} opt 옵션 객체
     * @param {Function} callback callback function
     */
    addObj(position, section, opt, callback) {
        let option = Object.assign({}, opt);

        if (!this._group[section.id]) {
            this._group[section.id] = {
                name: section.name || section.id,
                show: true,
                items: {}
            };
        }

        if (!option.id) {
            this._uniqueId++;
            option.id = section.id + '-' + this._uniqueId;
        }

        if (option.type === 'image') {
            let image = new Image();

            image.src = option.url;
            option.image = image;
        }

        if (!option.width) {
            option.width = 25;
        }

        if (!option.height) {
            option.height = 25;
        }

        option.type = opt.type;
        option.posx = position.x;
        option.posy = position.y;
        // layer 추가
        option.layer = this.layerObj;
        // text base 추가
        option.controlBase = this.controlBase;
        option.group = {
            id: section.id,
            show: this._group[section.id].show,
            name: this._group[section.id].name
        };

        if (!this._group[section.id]['items'][option.id]) {
            this._group[section.id]['items'][option.id] = option;
            this.drawLayer(callback);
        }
    }

    /**
     * add polygon shape
     * @memberof Layer
     * @function addPolygon
     * @param {Object}   polygon   polygon object
     * @param {Array}   pathArr   path array
     * @param {String}   groupName group name
     * @param {Object}   opt       option object
     * @param {Function} callback  callback function
     */
    addPolygon(polygon, pathArr, groupId, opt, callback) {
        var shapeOpt = null;

        if (!this._group[groupId]) {
            this._group[groupId] = {
                name: groupId,
                show: true,
                items: {}
            };
        }

        // if not exist opt, create object
        if (!opt) {
            shapeOpt = {};
        } else {
            shapeOpt = opt;
        }

        shapeOpt.type = 'polygon';

        // obj id
        let objId = null;
        // unique id make      
        if (!shapeOpt.id) {
            this._uniqueId++;
            objId = groupId + '_' + this._uniqueId;
        } else {
            objId = shapeOpt.id;
        }

        // name make
        let objName = null;
        if (!shapeOpt.name) {
            objName = 'unnamed';
        } else {
            objName = shapeOpt.name;
        }

        let objInfo = this.getObjPolygonInfo(pathArr, shapeOpt);

        // shape option 바인딩
        for (let key in shapeOpt) {
            objInfo[key] = shapeOpt[key];
        }

        // type 추가
        objInfo.type = 'polygon';
        // id 추가
        objInfo.id = objId;
        // name 추가
        objInfo.name = objName;
        // layer 추가
        objInfo.layer = this.layerObj;
        // text base 추가
        objInfo.controlBase = this.controlBase;
        // add separator
        objInfo.group = {
            id: groupId,
            show: this._group[groupId].show,
            name: this._group[groupId].name
        };
        // show text
        objInfo.showText = true;
        // if group object is not exist, add polygon
        if (!this._group[groupId]['items'][objId]) {
            this._group[groupId]['items'][objId] = objInfo;
            this.drawLayer(callback);
        } else {
            throw 'object is duplicated in this group';
        }
    }

    /**
     * shape 정보를 조회한다.
     * @memberof Layer
     * @function getShape
     * @param {String} separatorName separator 이름
     * @param {String} shapeId shape id
     * @return {Object} obj 조회될 object
     */
    getShape(groupId, shapeId) {
        var obj = null;

        // group이 있는 경우
        if (this._group) {
            if (groupId != void 0) {
                // separatorName에 해당하는 group이 있는 경우
                if (this._group[groupId]) {
                    let targetGroup = this._group[groupId].items;

                    for (var id in targetGroup) {
                        let shape = targetGroup[id];

                        if (id === shapeId) {
                            obj = shape;
                        }
                    }
                }
            } else {
                let shapeArr = [];
                // group id가 없는 경우 object를 돌며 확인한다.
                for (let id in this._group) {
                    let group = this._group[id];

                    for (let sid in group.items) {
                        let shape = group.items[sid];

                        if (shape.id === shapeId) {
                            shapeArr.push(shape);
                        }
                    }
                }

                // array를 object에 넣는다.
                obj = shapeArr;
            }
        }

        return obj;
    }

    /**
     * add group
     * @param {Object} item      add object
     * @param {String} groupName group id
     */
    addGroup(item, groupOpt) {
        var groupId = groupOpt.id,
            groupName = groupOpt.name;

        if (!this._group[groupId]) {
            this._group[groupId] = {
                name: groupName ? groupName : groupId, // group name 있는지 여부에 따라 바인딩
                show: true,
                items: {}
            };
        }

        if (!this._group[groupId]['items'][item.id]) {
            if (!item.layer || JSON.stringify(item.layer) == '{}') {
                item.layer = this.layerObj;
            }

            if (!item.controlBase || JSON.stringify(item.controlBase) == '{}') {
                item.controlBase = this.controlBase;
            }

            this._group[groupId]['items'][item.id] = item;
            return true;
        } else {
            return false;
            throw 'object is duplicated in this group';
        }
    }

    /**
     * group 및 관련된 데이터를 전체 삭제한다.
     * @param {String} groupId group id
     * @param {Function} callback callback function
     */
    deleteGroup(groupId, callback) {
        if (this._group[groupId]) {
            delete this._group[groupId];
        }

        // layer 그리고 난 후 callback 트리거
        this.drawLayer(() => {
            typeof callback == 'function' && callback();
        });
    }

    /**
     * link를 그린다.
     * @memberof Layer
     * @function drawLink
     * @param {Function} callback 그리고 난 후 callback function
     */
    drawLink(callback) {
        const self = this;
        const ctx = this.layerObj.getContext('2d');

        for (var idx = 0; idx < this._linkInfo.length; idx++) {
            let link = self._linkInfo[idx];

            if (!link.obj) {
                link.obj = new Link(link);
            }

            let line = link.obj;

            line.render(ctx);
        }

        typeof callback == 'function' && callback();
    }

    /**
     * draw layer
     * @memberof Layer
     * @function drawLayer
     * @param  {Function} callback callback after draw layer object
     */
    drawLayer(callback) {
        let self = this,
            ctx = self.layerObj.getContext('2d'),
            width = this.width,
            height = this.height;

        // clear rect
        ctx.clearRect(0, 0, width, height);

        for (var idx = 0; idx < this._linkInfo.length; idx++) {
            let link = self._linkInfo[idx];

            if (!link.obj) {
                link.obj = new Link(link);
            }

            let line = link.obj;

            line.render(ctx);
        }


        // shape 정보 그리기
        for (var id in this._group) {
            let group = self._group[id].items;

            // group에서 show property가 true인 경우에만 렌더링
            if (self._group[id].show) {
                for (var id in group) {
                    (() => {
                        let shape = group[id];

                        switch (shape.type) {
                            case 'polygon':
                                if (!shape.obj) {
                                    shape.obj = new Polygon(shape, ctx);
                                }

                                // obj 추출
                                let polygon = shape.obj;

                                polygon.render(ctx);
                                break;
                            case 'image':
                                if (!shape.obj) {
                                    shape.obj = new ImageShape(shape, ctx, true);
                                } else {
                                    let image = shape.obj;

                                    image.render(ctx);
                                }
                                break;
                        }
                    })();
                }
            }
        }

        typeof callback == 'function' && callback();
    }

    /**
     * edit polygon 
     * @memberof Layer
     * @function editPolygon
     * @param  {Object}   polygon  polygon
     * @param  {Array}   pathArr  path info
     * @param  {Object}   opt      option info
     * @param  {Boolean}  isEnd    is end boolean
     * @param  {Boolean}  isFinish is finish
     * @param  {Function} callback callback function after edit
     */
    editPolygon(polygon, pathArr, opt, isEnd, isFinish, callback) {
        let self = this;

        this.drawLayer(() => {
            switch (self.type) {
                case 'canvas':
                    self.drawCanvasPolygon(pathArr, opt, isEnd, isFinish, callback);
                    break;
                case 'svg':
                    break;
            }
        });
    }

    /**
     * 오브젝트를 레이어에 그린다.
     * @memberof Layer
     * @function drawObj
     * @param {Object} position 포지션
     * @param {Object} option 오브젝트 옵션
     */
    drawShape(position, option) {
        let self = this;
        this.drawLayer(() => {
            switch (self.type) {
                case 'canvas':
                    self.drawCanvasObj(position, option);
                    break;
                case 'svg':
                    break;
            }
        });
    }

    /**
     * 레이어에 오브젝트를 그린다.
     * @memberof Layer
     * @function drawCanvasObj
     * @param {Object} position 포지션 객체
     * @param {Object} option 옵션 객체
     */
    drawCanvasObj(position, option) {
        let self = this,
            layerCanvas = this.layerObj,
            ctx = layerCanvas.getContext('2d');

        // option type에 따라 분기 처리
        switch (option.type) {
            case 'image': // 이미지인 경우
                // 현재 설정되어 있는 이미지가 option url이 아닌 경우
                if (self.imageUrl != option.url) {
                    self.image = null;

                    let image = new Image();

                    image.onload = function() {
                        console.log('image onload');
                        ctx.drawImage(image, position.x, position.y, option.width || 25, option.height || 25);
                    };

                    image.onerror = function(e) {
                        console.log('e');
                    };

                    image.src = option.url;

                    self.image = image;
                    self.imageUrl = option.url;
                } else {
                    ctx.drawImage(self.image, position.x, position.y, option.width || 25, option.height || 25);
                }
                break;
            case 'shape':
                break;
        }
    }

    /**
     * draw canvas polygon
     * @memberof Layer
     * @function drawCanvasPolygon
     * @param  {Array}   pathArr  path info array
     * @param  {Object}   opt      option info
     * @param  {Boolean}  isEnd    is end
     * @param  {Boolean}  isFinish is finish
     * @param  {Function} callback callback function
     */
    drawCanvasPolygon(pathArr, opt, isEnd, isFinish, callback) {
        let self = this,
            ctx = this.layerObj.getContext('2d');

        if (self._prevData) {
            ctx.putImageData(self._prevData, 0, 0);
        }

        // set stroke style
        ctx.strokeStyle = opt ? (opt.stroke || '#000000') : '#000000';

        // set begin path
        ctx.beginPath();

        // path loop move adn line to
        for (var idx = 0; idx < pathArr.length; idx++) {
            let pos = pathArr[idx];
            switch (idx) {
                case 0:
                    ctx.moveTo(pos.x, pos.y);
                    break;
                default:
                    ctx.lineTo(pos.x, pos.y);
                    break;
            }
        }

        // if is end
        if (isEnd) {
            this._editPolygon = null;

            let fillStyle = null;
            if (opt) {
                if (opt.fill) {
                    fillStyle = Color.isHex(opt.fill) ? (Color.hexToRgba((opt.fill || '#bdbdbd'))) : opt.fill;
                } else {
                    fillStyle = Color.hexToRgba('#bdbdbd');
                }
            }
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        ctx.stroke();
        ctx.closePath();

        // if is not end, draw circle point
        if (!isEnd) {
            for (var idx = 0; idx < pathArr.length; idx++) {
                let pos = pathArr[idx];

                self.drawCanvasPolygonHandler(ctx, pos);
            }
        }

        if (isFinish) {
            ctx.save();
            typeof callback == 'function' && callback();
        }
    }

    /**
     * draw canvas handler for polygon
     * @param  {Object} ctx context 2d object
     * @param  {Object} pos position object
     */
    drawCanvasPolygonHandler(ctx, pos) {
        // draw arc
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        // close path
    }

    /**
     * copy canvas image data
     * @memberof Layer
     * @function copyCanvasImageData
     */
    copyCanvasImageData(callback) {
        let layer = this.layerObj,
            ctx = layer.getContext('2d');

        this._prevData = ctx.getImageData(0, 0, this.width, this.height);

        typeof callback == 'function' && callback();
    }

    /**
     * get canvas path info
     * @memberof Layer
     * @function getObjPolygonInfo
     * @param  {Array} pathArr path array
     */
    getObjPolygonInfo(pathArr) {
        let posxArr = [],
            posyArr = [];

        // posx, posy making array
        for (var idx = 0; idx < pathArr.length; idx++) {
            posxArr.push(pathArr[idx].x);
            posyArr.push(pathArr[idx].y);
        }

        let minx = Math.min(...posxArr), // x 최소값
            maxx = Math.max(...posxArr), // x 최대값
            miny = Math.min(...posyArr), // y 최소값
            maxy = Math.max(...posyArr), // y 최대값
            width = Math.abs(maxx - minx),
            height = Math.abs(maxy - miny);

        let returnObj = {
            paths: pathArr,
            posx: parseInt((minx + maxx) / 2, 10),
            posy: parseInt((miny + maxy) / 2, 10),
            width: width,
            height: height,
            x1: minx,
            y1: miny,
            x2: maxx,
            y2: maxy
        };

        return returnObj;
    }

    /**
     * layer내의 위치를 반환한다.
     * @memberof Layer
     * @function getLayerPosition
     * @param {Object} ev event
     */
    getLayerPosition(ev) {
        let layerPosX = ev.offsetX,
            layerPosY = ev.offsetY;

        return {
            x: parseInt(layerPosX),
            y: parseInt(layerPosY)
        };
    }

    /**
     * 페이지 이동 등, flaats 내에서 layer에 대한 모든 객체를 초기화 하기 위한 소멸자 함수
     * @memberof Layer
     * @function destroy
     */
    destroy() {
        const self = this;

        for (let groupId in this._group) {
            let group = self._group[groupId];

            for (let shapeId in group.items) {
                let shape = group.items[shapeId];

                shape = null;
            }

            group = null;
        }

        this.base = null; // base
        this.layerObj = null; // layer object
        this.layerObjId = null;
        this.editShape = null;
        this.controlBase = null;
        // polygon
        this._drawPath = null;
        this._drawStartPos = null;
        this._editPathArr = [];

        // section group
        this._uniqueId = 0;

        // 선택된 shape들
        this._selectedShape = [];

        // image 객체
        this.imageUrl = null;
        this.image = null;

        // link 객체
        this._linkInfo = [];
    }
}