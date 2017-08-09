<img src="http://www.flaats.org/assets/img/logo-1.png" />

## 개요 Summary
---
flaats.js는 토폴로지맵 또는 실내지도 모니터링을 시각화 해주거나, 저작도구를 만들 수 있도록 도와주는 canvas 기반의 javascript 라이브러리입니다.<br/>
Flaats.js is a canvas-based javascript library that helps you visualize your topology map or indoor map monitoring, or create authoring tools.

사용된 플러그인은 jQuery 이며, 이후 jQuery를 걷어낸 순수한 javascript library로 완성할 예정입니다.<br/>
The plug-in used is jQuery, and we plan to complete it with a pure javascript library that has been removed from jQuery.

데모는 [flaats 데모](http://demo.flaats.org) 에서 확인하실 수 있습니다.<br/>
The demo can be found in the [flaats demo] (http://demo.flaats.org).

## 브라우저 지원 Browser Support
---
- IE: 9+
- Chrome, Firefox, Safari, IE Edge


## 설치 Setup
---
flaats.js는 npm을 통해 install 하실 수 있습니다.<br/>
Flaats.js can be installed via npm.

```bash
$ npm install flaats
```

CommonJs를 이용하여 플러그인을 불러올 수 있습니다.<br/>
You can use CommonJs to load plug-ins.
```js
import flaats from 'flaats';

var flaats = require('flaats');
```

HTML에 직접 삽입도 가능합니다.<br/>
You can also insert it directly into HTML.
```html
<script src="path/to/flaats.min.js"></script>
```

## 사용법 Usage
---

### 초기화 Initialize
플러그인을 로드하면, new 생성자를 통해 옵션값으로 canvas를 세팅할 수 있습니다.<br/>
When you load the plugin, you can set the canvas as an option value via the new constructor.

```js
   var map = new Flaats({
     // Draw canvas wrapper element query string
     base: '.map',
     // If you want to put an image in the background, write down the path.
     image: 'path/to/image',
     // The function to call after the canvas has been set.
     onInitialize: function (layer) {},
     // Put the layer you want to use into an array.
     layer: [{
       id: 'layer id',
       name: 'layer name'
     }],
     // Zoom level step
     step: 4,
     // canvas scale
     scale: 0.5,
     // Zoom level
     zoomLevel: 0
   });
```

### 폴리곤 그리기 Drawing Polygon
Flaats를 생성한 상태에서, 폴리곤을 그리는 function을 호출합니다. 호출되는 function은 다른 모드로 바꾸지 않는 이상,계속해서 사용 가능합니다.
```js
  map.drawingPolygon({
    // draw layer id
    layerId: 'common-layer',
    // setting mode (true is enable drawing polygon)
    isSet: true,
    // group id
    section: this.objType,
    // option
    option: {
      // fill color
      fill: '#6d5cae',
      // stroke color
      stroke: '#000000',
      // stroke width
      strokeWidth: 2,
      // opacity
      opacity: 1
    },
    // draw start callback function
    onDrawStart: function (position) {

    },
    // draw move callback function
    onDraw: function (position) {

    },
    // draw finished callback function
    onFinished: function (position) {
    }
  });
```
### 오브젝트 그리기 Drawing Object
Flaats를 생성한 상태에서 오브젝트를 생성할 수 있습니다. (현재 image를 통한 오브젝트 그리기가 가능합니다.)<br/>
You can create objects with Flaats created. (You can draw objects through the current image.)

```js
  map.drawingShape({
    // layer id
    layerId: 'common-layer',
    // setting mode
    isSet: true,
    // section
    section: 'section',
    // option
    option: {
      // object type : image ? circle ? rect ? etc..
      type: 'image',
      // image url
      url: 'path/to/image',
      // fill color
      fill: '#bdbdbd',
      // stroke color (default black)
      stroke: '#000000',
      // stroke width(default 1)
      strokeWidth: 2,
      // opacity (default 0.5)
      opacity: 1
    },
    // on drag move callback function
    onDragMove: function (position) {
    },
    // on draw finished callback function
    onFinished: function (position) {
    }
  });
```

## 선 잇기 Line
<!-- Flaats.js를 생성한 후, 객체들끼리 선을 이어서 연결할 수 있습니다. 연결된 선은 오브젝트가 이동할 경우 따라서 움직입니다.<br/> -->
After you create Flaats.js, you can connect the lines between objects. The connected line moves accordingly when the object moves.

```js
let linkObj = {
  // layer id
  layerId: 'common-layer',
  // start point object (flaats object)
  target: {},
  // end point objects (flaats object array)
  link: []
};

map.linkShape(linkObj);
```

## Canvas 모드
현재까지 개발되어 있는 모드는 선택, 이동, 에디트 모드입니다. 각 모드는 flaats내의 함수를 통해 변경할 수 있습니다.<br/>
The modes that have been developed so far are select, move, and edit modes. Each mode can be changed through a function in flaats.

```js
  // select mode
  map.changeMode('select');
  // edit mode
  map.changeMode('edit');
  // move mode
  map.changeMode('move');
```

기타 자세한 내용들은 [flaats 문서 페이지](http://docs.flaats.org) 에서 확인하실 수 있습니다.<br/>
Other details can be found on the [flaats Documentation Page] (http://docs.flaats.org).

## License
MIT © [KernYoo](http://lazydev.tistory.com)