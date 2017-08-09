import Base from '../base';
import Color from '../../color';
import Event from '../../events';

class ImageShape extends Base {
    constructor(opt, ctx, isRender) {
        super.initialize(opt);
        const self = this;
        let controllerStr = '<div class="shape-controller" id="control-' + this.id + '" ' +
            'style="position:absolute;padding:5px;">' +
            ' <div class="controller-wrapper" style="position:relative;width:100%;height:100%;border:1px solid #6799FF;">' +
            '   <div class="handler" handler-type="lt" style="cursor:nw-resize;width:5px;height:5px;background:#6799FF;position:absolute;left:0px;top:0px;"></div>' +
            '   <div class="handler" handler-type="lb" style="cursor:sw-resize;width:5px;height:5px;background:#6799FF;position:absolute;left:0px;bottom:0px;"></div>' +
            '   <div class="handler" handler-type="rt" style="cursor:ne-resize;width:5px;height:5px;background:#6799FF;position:absolute;right:0px;top:0px;"></div>' +
            '   <div class="handler" handler-type="rb" style="cursor:se-resize;width:5px;height:5px;background:#6799FF;position:absolute;right:0px;bottom:0px;"></div>' +
            ' </div>' +
            '</div>';

        // 타입 바인딩
        this.type = 'image';

        // width값이 없는 경우
        if (!opt.width) {
            this.width = 25;
        }
        // height 값이 없는 경우
        if (!opt.height) {
            this.height = 25;
        }


        /**
         * shape를 제어할 controller
         * @property controller
         * @type {Object}
         */
        this.controller = $(controllerStr);

        this.textObj = $('<span class="text-obj"></span>')
            .css({
                position: 'absolute',
                padding: 2,
                'border-radius': 5,
                'font-size': 10,
                'pointer-events': 'none',
                'font-weight': 'normal',
                'text-align': 'center',
                'color': '#ffffff',
                'background-color': '#000000',
            });

        if (!opt.image) {
            let image = new Image();

            image.onload = () => {
                self.image = image;

                if (isRender) {
                    self.render(ctx);
                }
            };
            image.src = opt.url;
        } else {
            // image 객체 바인딩
            this.image = opt.image;
            if (isRender) {
                self.render(ctx);
            }
        }
    }

    /**
     * 오브젝트를 그린다.
     * @memberof Image
     * @function render
     * @param {Object} opt 렌더링 옵션
     */
    render(ctx) {

        ctx.drawImage(this.image, this.posx, this.posy, this.width, this.height);

        this.addText();
    }

    /**
     * text를 추가한다.
     * @memberof Image
     * @function addText
     */
    addText() {
        const self = this;
        let textArea = this.controlBase;

        if (this.showText) {
            if (this.textHtml) {
                this.textObj = $(this.textHtml);
            } else {
                this.textObj
                    .attr('id', 'text-' + this.id)
                    .attr('group-id', this.group)
                    .text(this.name || 'unnamed')
                    .css({
                        left: (this.posx + (this.width / 2)) - (this.textObj.width() / 2),
                        top: this.posy + this.height + 5
                    });
            }

            let timer = setTimeout(() => {
                clearTimeout(timer);
                textArea.append(self.textObj);
            }, 100);
        }
    }

    /**
     * shape 정보를 변경한다.
     * @memberof Image
     * @function modifyShape
     * @param {Object} opt 옵션 정보
     * @param {Function} callback 콜백 함수
     */
    modifyShape(opt, callback) {
        this.posx = opt.left;
        this.posy = opt.top;

        if (opt.width) {
            this.width = opt.width;
        }

        if (opt.height) {
            this.height = opt.height;
        }

        // center position 설정
        this.centerx = this.posx + this.width / 2;
        this.centery = this.posy + this.height / 2;

        typeof callback == 'function' && callback();
    }

    /**
     * 해당 객체를 선택 상태로 놓는다.
     * @memberof Image
     * @function select
     */
    select(resizeOpt, dndOpt) {
        const self = this;

        this.controller
            .css({
                width: this.width + 10,
                height: this.height + 10,
                left: this.posx - 5, // 5만큼 크게 잡기
                top: this.posy - 5 // 5만큼 크게 잡고 나머지 위치 조정
            });

        // control base에 controller를 배치한다.
        self.controlBase
            .append(this.controller);
    }

    /**
     * 해당 객체를 선택 해제 상태로 놓는다.
     * @memberof Image
     * @function unSelect
     */
    unSelect() {
        this.controller.remove();
    }

    /**
     * 이미지 정보를 반환한다.
     * @memberof Image
     * @function getImage
     * @return {Object} this.image
     */
    getImage() {
        return this.image;
    }
}

export default ImageShape;