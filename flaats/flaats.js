(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/*!
 * iScroll v4.2.5 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
/**
 * NOTE
*   modefy date   actor   reason    
*   2013.08.01    jku   좀더 자연스러운 동작을 위해 이벤트를 wrapper에 bind alc unbind 하도록 수정..
* 2013.09.05    jku   scrollbar의 z-index를 삭제...
* 2014.02.28    jku   snap 동작 관련 수정
 */
(function (window, doc) {
  var m = Math,
      dummyStyle = doc.createElement("div").style,
      vendor = (function () {
    var vendors = "t,webkitT,MozT,msT,OT".split(","),
        t,
        i = 0,
        l = vendors.length;

    for (; i < l; i++) {
      t = vendors[i] + "ransform";
      if (t in dummyStyle) {
        return vendors[i].substr(0, vendors[i].length - 1);
      }
    }

    return false;
  })(),
      cssVendor = vendor ? "-" + vendor.toLowerCase() + "-" : "",


  // Style properties
  transform = prefixStyle("transform"),
      transitionProperty = prefixStyle("transitionProperty"),
      transitionDuration = prefixStyle("transitionDuration"),
      transformOrigin = prefixStyle("transformOrigin"),
      transitionTimingFunction = prefixStyle("transitionTimingFunction"),
      transitionDelay = prefixStyle("transitionDelay"),


  // Browser capabilities
  isAndroid = /android/gi.test(navigator.appVersion),
      isIDevice = /iphone|ipad/gi.test(navigator.appVersion),
      isTouchPad = /hp-tablet/gi.test(navigator.appVersion),
      has3d = (prefixStyle("perspective") in dummyStyle),
      hasTouch = "ontouchstart" in window && !isTouchPad,
      hasTransform = vendor !== false,
      hasTransitionEnd = (prefixStyle("transition") in dummyStyle),
      RESIZE_EV = "onorientationchange" in window ? "orientationchange" : "resize",
      START_EV = hasTouch ? "touchstart" : "mousedown",
      MOVE_EV = hasTouch ? "touchmove" : "mousemove",
      END_EV = hasTouch ? "touchend" : "mouseup",
      CANCEL_EV = hasTouch ? "touchcancel" : "mouseup",
      TRNEND_EV = (function () {
    if (vendor === false) return false;

    var transitionEnd = {
      "": "transitionend",
      webkit: "webkitTransitionEnd",
      Moz: "transitionend",
      O: "otransitionend",
      ms: "MSTransitionEnd"
    };

    return transitionEnd[vendor];
  })(),
      nextFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
      return setTimeout(callback, 1);
    };
  })(),
      cancelFrame = (function () {
    return window.cancelRequestAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout;
  })(),


  // Helpers
  translateZ = has3d ? " translateZ(0)" : "",


  // Constructor
  iScroll = function (el, options) {
    var that = this,
        i;

    that.wrapper = typeof el == "object" ? el : doc.getElementById(el);
    that.wrapper.style.overflow = "hidden";
    that.scroller = that.wrapper.children[0];

    // Default options
    that.options = {
      hScroll: true,
      vScroll: true,
      x: 0,
      y: 0,
      bounce: true,
      bounceLock: false,
      momentum: true,
      lockDirection: true,
      useTransform: true,
      useTransition: false,
      topOffset: 0,
      checkDOMChanges: false, // Experimental
      handleClick: true,

      // Scrollbar
      hScrollbar: true,
      vScrollbar: true,
      fixedScrollbar: isAndroid,
      hideScrollbar: isIDevice,
      fadeScrollbar: isIDevice && has3d,
      scrollbarClass: "",

      // Zoom
      zoom: false,
      zoomMin: 1,
      zoomMax: 4,
      doubleTapZoom: 2,
      wheelAction: "scroll",

      // Snap
      snap: false,
      snapThreshold: 1,

      // Events
      onRefresh: null,
      onBeforeScrollStart: function (e) {
        e.preventDefault();
      },
      onScrollStart: null,
      onBeforeScrollMove: null,
      onScrollMove: null,
      onBeforeScrollEnd: null,
      onScrollEnd: null,
      onTouchEnd: null,
      onDestroy: null,
      onZoomStart: null,
      onZoom: null,
      onZoomEnd: null
    };

    // User defined options
    for (i in options) that.options[i] = options[i];

    // Set starting position
    that.x = that.options.x;
    that.y = that.options.y;

    // Normalize options
    that.options.useTransform = hasTransform && that.options.useTransform;
    that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
    that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
    that.options.zoom = that.options.useTransform && that.options.zoom;
    that.options.useTransition = hasTransitionEnd && that.options.useTransition;

    // Helpers FIX ANDROID BUG!
    // translate3d and scale doesn't work together!
    // Ignoring 3d ONLY WHEN YOU SET that.options.zoom
    if (that.options.zoom && isAndroid) {
      translateZ = "";
    }

    // Set some default styles
    that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + "transform" : "top left";
    that.scroller.style[transitionDuration] = "0";
    that.scroller.style[transformOrigin] = "0 0";
    if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = "cubic-bezier(0.33,0.66,0.66,1)";

    if (that.options.useTransform) that.scroller.style[transform] = "translate(" + that.x + "px," + that.y + "px)" + translateZ;else that.scroller.style.cssText += ";position:absolute;top:" + that.y + "px;left:" + that.x + "px";

    if (that.options.useTransition) that.options.fixedScrollbar = true;

    that.refresh();

    that._bind(RESIZE_EV, window);
    that._bind(START_EV);
    if (!hasTouch) {
      if (that.options.wheelAction != "none") {
        that._bind("DOMMouseScroll");
        that._bind("mousewheel");
      }
    }

    if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
      that._checkDOMChanges();
    }, 500);
  };

  // Prototype
  iScroll.prototype = {
    enabled: true,
    x: 0,
    y: 0,
    steps: [],
    scale: 1,
    currPageX: 0, currPageY: 0,
    pagesX: [], pagesY: [],
    aniTime: null,
    wheelZoomCount: 0,

    handleEvent: function (e) {
      var that = this;
      switch (e.type) {
        case START_EV:
          if (!hasTouch && e.button !== 0) return;
          that._start(e);
          break;
        case MOVE_EV:
          that._move(e);break;
        case END_EV:
        case CANCEL_EV:
          that._end(e);break;
        case RESIZE_EV:
          that._resize();break;
        case "DOMMouseScroll":
        case "mousewheel":
          that._wheel(e);break;
        case TRNEND_EV:
          that._transitionEnd(e);break;
      }
    },

    _checkDOMChanges: function () {
      if (this.moved || this.zoomed || this.animating || this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale) return;

      this.refresh();
    },

    _scrollbar: function (dir) {
      var that = this,
          bar;

      if (!that[dir + "Scrollbar"]) {
        if (that[dir + "ScrollbarWrapper"]) {
          if (hasTransform) that[dir + "ScrollbarIndicator"].style[transform] = "";
          that[dir + "ScrollbarWrapper"].parentNode.removeChild(that[dir + "ScrollbarWrapper"]);
          that[dir + "ScrollbarWrapper"] = null;
          that[dir + "ScrollbarIndicator"] = null;
        }

        return;
      }

      // modify by jku -> scroll bar의 z-index 삭제.
      if (!that[dir + "ScrollbarWrapper"]) {
        // Create the scrollbar wrapper
        bar = doc.createElement("div");

        if (that.options.scrollbarClass) bar.className = that.options.scrollbarClass + dir.toUpperCase();
        //else bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:' + (that.vScrollbar ? '7' : '2') + 'px' : 'width:7px;bottom:' + (that.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px');
        else bar.style.cssText = "position:absolute;" + (dir == "h" ? "height:7px;bottom:1px;left:2px;right:" + (that.vScrollbar ? "7" : "2") + "px" : "width:7px;bottom:" + (that.hScrollbar ? "7" : "2") + "px;top:2px;right:1px");
        bar.style.cssText += ";pointer-events:none;" + cssVendor + "transition-property:opacity;" + cssVendor + "transition-duration:" + (that.options.fadeScrollbar ? "350ms" : "0") + ";overflow:hidden;opacity:" + (that.options.hideScrollbar ? "0" : "1");

        that.wrapper.appendChild(bar);
        that[dir + "ScrollbarWrapper"] = bar;

        // Create the scrollbar indicator
        bar = doc.createElement("div");
        if (!that.options.scrollbarClass) {
          //bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);' + cssVendor + 'background-clip:padding-box;' + cssVendor + 'box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';' + cssVendor + 'border-radius:3px;border-radius:3px';
          bar.style.cssText = "position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);" + cssVendor + "background-clip:padding-box;" + cssVendor + "box-sizing:border-box;" + (dir == "h" ? "height:100%" : "width:100%") + ";" + cssVendor + "border-radius:3px;border-radius:3px";
        }
        bar.style.cssText += ";pointer-events:none;" + cssVendor + "transition-property:" + cssVendor + "transform;" + cssVendor + "transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);" + cssVendor + "transition-duration:0;" + cssVendor + "transform: translate(0,0)" + translateZ;
        if (that.options.useTransition) bar.style.cssText += ";" + cssVendor + "transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)";

        that[dir + "ScrollbarWrapper"].appendChild(bar);
        that[dir + "ScrollbarIndicator"] = bar;
      }

      if (dir == "h") {
        that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
        that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
        that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + "px";
        that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
        that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
      } else {
        that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
        that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
        that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + "px";
        that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
        that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
      }

      // Reset position
      that._scrollbarPos(dir, true);
    },

    _resize: function () {
      var that = this;
      setTimeout(function () {
        that.refresh();
      }, isAndroid ? 200 : 0);
    },

    _pos: function (x, y) {
      if (this.zoomed) return;

      x = this.hScroll ? x : 0;
      y = this.vScroll ? y : 0;

      if (this.options.useTransform) {
        this.scroller.style[transform] = "translate(" + x + "px," + y + "px) scale(" + this.scale + ")" + translateZ;
      } else {
        x = m.round(x);
        y = m.round(y);
        this.scroller.style.left = x + "px";
        this.scroller.style.top = y + "px";
      }

      this.x = x;
      this.y = y;

      this._scrollbarPos("h");
      this._scrollbarPos("v");
    },

    _scrollbarPos: function (dir, hidden) {
      var that = this,
          pos = dir == "h" ? that.x : that.y,
          size;

      if (!that[dir + "Scrollbar"]) return;

      pos = that[dir + "ScrollbarProp"] * pos;

      if (pos < 0) {
        if (!that.options.fixedScrollbar) {
          size = that[dir + "ScrollbarIndicatorSize"] + m.round(pos * 3);
          if (size < 8) size = 8;
          that[dir + "ScrollbarIndicator"].style[dir == "h" ? "width" : "height"] = size + "px";
        }
        pos = 0;
      } else if (pos > that[dir + "ScrollbarMaxScroll"]) {
        if (!that.options.fixedScrollbar) {
          size = that[dir + "ScrollbarIndicatorSize"] - m.round((pos - that[dir + "ScrollbarMaxScroll"]) * 3);
          if (size < 8) size = 8;
          that[dir + "ScrollbarIndicator"].style[dir == "h" ? "width" : "height"] = size + "px";
          pos = that[dir + "ScrollbarMaxScroll"] + (that[dir + "ScrollbarIndicatorSize"] - size);
        } else {
          pos = that[dir + "ScrollbarMaxScroll"];
        }
      }

      that[dir + "ScrollbarWrapper"].style[transitionDelay] = "0";
      that[dir + "ScrollbarWrapper"].style.opacity = hidden && that.options.hideScrollbar ? "0" : "1";
      that[dir + "ScrollbarIndicator"].style[transform] = "translate(" + (dir == "h" ? pos + "px,0)" : "0," + pos + "px)") + translateZ;
    },

    _start: function (e) {
      var that = this,
          point = hasTouch ? e.touches[0] : e,
          matrix,
          x,
          y,
          c1,
          c2;

      // modify by jku that.enabled -> 동작 유무 처리 that.animating -> snap 자연스럽게 하기 위해
      if (!that.enabled || that.animating) return;

      if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);

      if (that.options.useTransition || that.options.zoom) that._transitionTime(0);

      that.moved = false;
      that.animating = false;
      that.zoomed = false;
      that.distX = 0;
      that.distY = 0;
      that.absDistX = 0;
      that.absDistY = 0;
      that.dirX = 0;
      that.dirY = 0;

      // Gesture start
      if (that.options.zoom && hasTouch && e.touches.length > 1) {
        c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
        c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
        that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);

        that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
        that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;

        if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
      }

      if (that.options.momentum) {
        if (that.options.useTransform) {
          // Very lame general purpose alternative to CSSMatrix
          matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, "").split(",");
          x = +(matrix[12] || matrix[4]);
          y = +(matrix[13] || matrix[5]);
        } else {
          x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, "");
          y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, "");
        }

        if (x != that.x || y != that.y) {
          if (that.options.useTransition) that._unbind(TRNEND_EV);else cancelFrame(that.aniTime);
          that.steps = [];
          that._pos(x, y);
          if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
        }
      }

      that.absStartX = that.x; // Needed by snap threshold
      that.absStartY = that.y;

      that.startX = that.x;
      that.startY = that.y;
      that.pointX = point.pageX;
      that.pointY = point.pageY;

      that.startTime = e.timeStamp || Date.now();

      if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);

      that._bind(MOVE_EV, window);
      that._bind(END_EV, window);
      that._bind(CANCEL_EV, window);
    },

    _move: function (e) {
      var that = this,
          point = hasTouch ? e.touches[0] : e,
          deltaX = point.pageX - that.pointX,
          deltaY = point.pageY - that.pointY,
          newX = that.x + deltaX,
          newY = that.y + deltaY,
          c1,
          c2,
          scale,
          timestamp = e.timeStamp || Date.now();

      if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);

      // Zoom
      if (that.options.zoom && hasTouch && e.touches.length > 1) {
        c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
        c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
        that.touchesDist = m.sqrt(c1 * c1 + c2 * c2);

        that.zoomed = true;

        scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;

        if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2, scale / that.options.zoomMin);else if (scale > that.options.zoomMax) scale = 2 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);

        that.lastScale = scale / this.scale;

        newX = this.originX - this.originX * that.lastScale + this.x;
        newY = this.originY - this.originY * that.lastScale + this.y;

        this.scroller.style[transform] = "translate(" + newX + "px," + newY + "px) scale(" + scale + ")" + translateZ;

        if (that.options.onZoom) that.options.onZoom.call(that, e);
        return;
      }

      that.pointX = point.pageX;
      that.pointY = point.pageY;

      // Slow down if outside of the boundaries
      if (newX > 0 || newX < that.maxScrollX) {
        newX = that.options.bounce ? that.x + deltaX / 2 : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
      }
      if (newY > that.minScrollY || newY < that.maxScrollY) {
        newY = that.options.bounce ? that.y + deltaY / 2 : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
      }

      that.distX += deltaX;
      that.distY += deltaY;
      that.absDistX = m.abs(that.distX);
      that.absDistY = m.abs(that.distY);

      if (that.absDistX < 6 && that.absDistY < 6) {
        return;
      }

      // Lock direction
      if (that.options.lockDirection) {
        if (that.absDistX > that.absDistY + 5) {
          newY = that.y;
          deltaY = 0;
        } else if (that.absDistY > that.absDistX + 5) {
          newX = that.x;
          deltaX = 0;
        }
      }

      that.moved = true;
      that._pos(newX, newY);
      that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
      that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

      if (timestamp - that.startTime > 300) {
        that.startTime = timestamp;
        that.startX = that.x;
        that.startY = that.y;
      }

      if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
    },

    _end: function (e) {
      if (hasTouch && e.touches.length !== 0) return;

      var that = this,
          point = hasTouch ? e.changedTouches[0] : e,
          target,
          ev,
          momentumX = { dist: 0, time: 0 },
          momentumY = { dist: 0, time: 0 },
          duration = (e.timeStamp || Date.now()) - that.startTime,
          newPosX = that.x,
          newPosY = that.y,
          distX,
          distY,
          newDuration,
          snap,
          scale;

      that._unbind(MOVE_EV, window);
      that._unbind(END_EV, window);
      that._unbind(CANCEL_EV, window);

      if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);

      if (that.zoomed) {
        scale = that.scale * that.lastScale;
        scale = Math.max(that.options.zoomMin, scale);
        scale = Math.min(that.options.zoomMax, scale);
        that.lastScale = scale / that.scale;
        that.scale = scale;

        that.x = that.originX - that.originX * that.lastScale + that.x;
        that.y = that.originY - that.originY * that.lastScale + that.y;

        that.scroller.style[transitionDuration] = "200ms";
        that.scroller.style[transform] = "translate(" + that.x + "px," + that.y + "px) scale(" + that.scale + ")" + translateZ;

        that.zoomed = false;
        that.refresh();

        if (that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
        return;
      }

      if (!that.moved) {
        if (hasTouch) {
          if (that.doubleTapTimer && that.options.zoom) {
            // Double tapped
            clearTimeout(that.doubleTapTimer);
            that.doubleTapTimer = null;
            if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
            that.zoom(that.pointX, that.pointY, that.scale == 1 ? that.options.doubleTapZoom : 1);
            if (that.options.onZoomEnd) {
              setTimeout(function () {
                that.options.onZoomEnd.call(that, e);
              }, 200); // 200 is default zoom duration
            }
          } else if (this.options.handleClick) {
            that.doubleTapTimer = setTimeout(function () {
              that.doubleTapTimer = null;

              // Find the last touched element
              target = point.target;
              while (target.nodeType != 1) target = target.parentNode;

              if (target.tagName != "SELECT" && target.tagName != "INPUT" && target.tagName != "TEXTAREA") {
                ev = doc.createEvent("MouseEvents");
                ev.initMouseEvent("click", true, true, e.view, 1, point.screenX, point.screenY, point.clientX, point.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);
                ev._fake = true;
                target.dispatchEvent(ev);
              }
            }, that.options.zoom ? 250 : 0);
          }
        }

        that._resetPos(400);

        if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
        return;
      }

      if (duration < 300 && that.options.momentum) {
        momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
        momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0, that.options.bounce ? that.wrapperH : 0) : momentumY;

        newPosX = that.x + momentumX.dist;
        newPosY = that.y + momentumY.dist;

        if (that.x > 0 && newPosX > 0 || that.x < that.maxScrollX && newPosX < that.maxScrollX) momentumX = { dist: 0, time: 0 };
        if (that.y > that.minScrollY && newPosY > that.minScrollY || that.y < that.maxScrollY && newPosY < that.maxScrollY) momentumY = { dist: 0, time: 0 };
      }

      if (momentumX.dist || momentumY.dist) {
        newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

        // Do we need to snap?
        if (that.options.snap) {
          distX = newPosX - that.absStartX;
          distY = newPosY - that.absStartY;
          if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) {
            that.scrollTo(that.absStartX, that.absStartY, 200);
          } else {
            snap = that._snap(newPosX, newPosY);
            newPosX = snap.x;
            newPosY = snap.y;
            newDuration = m.max(snap.time, newDuration);
          }
        }

        that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);

        if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
        return;
      }

      // Do we need to snap?
      if (that.options.snap) {
        distX = newPosX - that.absStartX;
        distY = newPosY - that.absStartY;
        if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) that.scrollTo(that.absStartX, that.absStartY, 200);else {
          snap = that._snap(that.x, that.y);
          if (snap.x != that.x || snap.y != that.y) that.scrollTo(snap.x, snap.y, snap.time);
        }

        if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
        return;
      }

      that._resetPos(200);
      if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
    },

    _resetPos: function (time) {
      var that = this,
          resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
          resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

      if (resetX == that.x && resetY == that.y) {
        if (that.moved) {
          that.moved = false;
          if (that.options.onScrollEnd) that.options.onScrollEnd.call(that); // Execute custom code on scroll end
        }

        if (that.hScrollbar && that.options.hideScrollbar) {
          if (vendor == "webkit") that.hScrollbarWrapper.style[transitionDelay] = "300ms";
          that.hScrollbarWrapper.style.opacity = "0";
        }
        if (that.vScrollbar && that.options.hideScrollbar) {
          if (vendor == "webkit") that.vScrollbarWrapper.style[transitionDelay] = "300ms";
          that.vScrollbarWrapper.style.opacity = "0";
        }

        return;
      }

      that.scrollTo(resetX, resetY, time || 0);
    },

    _wheel: function (e) {
      var that = this,
          wheelDeltaX,
          wheelDeltaY,
          deltaX,
          deltaY,
          deltaScale;

      if ("wheelDeltaX" in e) {
        wheelDeltaX = e.wheelDeltaX / 12;
        wheelDeltaY = e.wheelDeltaY / 12;
      } else if ("wheelDelta" in e) {
        wheelDeltaX = wheelDeltaY = e.wheelDelta / 12;
      } else if ("detail" in e) {
        wheelDeltaX = wheelDeltaY = -e.detail * 3;
      } else {
        return;
      }

      if (that.options.wheelAction == "zoom") {
        deltaScale = that.scale * Math.pow(2, 1 / 3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
        if (deltaScale < that.options.zoomMin) deltaScale = that.options.zoomMin;
        if (deltaScale > that.options.zoomMax) deltaScale = that.options.zoomMax;

        if (deltaScale != that.scale) {
          if (!that.wheelZoomCount && that.options.onZoomStart) that.options.onZoomStart.call(that, e);
          that.wheelZoomCount++;

          that.zoom(e.pageX, e.pageY, deltaScale, 400);

          setTimeout(function () {
            that.wheelZoomCount--;
            if (!that.wheelZoomCount && that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
          }, 400);
        }

        return;
      }

      deltaX = that.x + wheelDeltaX;
      deltaY = that.y + wheelDeltaY;

      if (deltaX > 0) deltaX = 0;else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;

      if (deltaY > that.minScrollY) deltaY = that.minScrollY;else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;

      if (that.maxScrollY < 0) {
        that.scrollTo(deltaX, deltaY, 0);
      }
    },

    _transitionEnd: function (e) {
      var that = this;

      if (e.target != that.scroller) return;

      that._unbind(TRNEND_EV);

      that._startAni();
    },


    /**
    *
    * Utilities
    *
    */
    _startAni: function () {
      var that = this,
          startX = that.x,
          startY = that.y,
          startTime = Date.now(),
          step,
          easeOut,
          animate;

      if (that.animating) return;

      if (!that.steps.length) {
        that._resetPos(400);
        return;
      }

      step = that.steps.shift();

      if (step.x == startX && step.y == startY) step.time = 0;

      that.animating = true;
      that.moved = true;

      // modify by jku > 성능  고도화를 위해서 return 구조를 if else 구조로 변경
      if (that.options.useTransition) {
        that._transitionTime(step.time);
        that._pos(step.x, step.y);
        that.animating = false;
        if (step.time) that._bind(TRNEND_EV);else that._resetPos(0);
      } else {
        animate = function () {
          var now = Date.now(),
              newX,
              newY;

          if (now >= startTime + step.time) {
            that._pos(step.x, step.y);
            that.animating = false;
            if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that); // Execute custom code on animation end
            that._startAni();
          } else {
            now = (now - startTime) / step.time - 1;
            easeOut = m.sqrt(1 - now * now);
            newX = (step.x - startX) * easeOut + startX;
            newY = (step.y - startY) * easeOut + startY;
            that._pos(newX, newY);
            if (that.animating) that.aniTime = nextFrame(animate);
          }
        };
        animate();
      }
    },

    _transitionTime: function (time) {
      time += "ms";
      this.scroller.style[transitionDuration] = time;
      if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
      if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
    },

    _momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
      var deceleration = 0.0006,
          speed = m.abs(dist) / time,
          newDist = speed * speed / (2 * deceleration),
          newTime = 0,
          outsideDist = 0;

      // Proportinally reduce speed if we are outside of the boundaries
      if (dist > 0 && newDist > maxDistUpper) {
        outsideDist = size / (6 / (newDist / speed * deceleration));
        maxDistUpper = maxDistUpper + outsideDist;
        speed = speed * maxDistUpper / newDist;
        newDist = maxDistUpper;
      } else if (dist < 0 && newDist > maxDistLower) {
        outsideDist = size / (6 / (newDist / speed * deceleration));
        maxDistLower = maxDistLower + outsideDist;
        speed = speed * maxDistLower / newDist;
        newDist = maxDistLower;
      }

      newDist = newDist * (dist < 0 ? -1 : 1);
      newTime = speed / deceleration;

      return { dist: newDist, time: m.round(newTime) };
    },

    _offset: function (el) {
      var left = -el.offsetLeft,
          top = -el.offsetTop;

      while (el = el.offsetParent) {
        left -= el.offsetLeft;
        top -= el.offsetTop;
      }

      if (el != this.wrapper) {
        left *= this.scale;
        top *= this.scale;
      }

      return { left: left, top: top };
    },

    _snap: function (x, y) {
      var that = this,
          i,
          l,
          page,
          time,
          sizeX,
          sizeY;

      // Check page X
      page = that.pagesX.length - 1;
      for (i = 0, l = that.pagesX.length; i < l; i++) {
        if (x >= that.pagesX[i]) {
          page = i;
          break;
        }
      }
      if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
      x = that.pagesX[page];
      sizeX = m.abs(x - that.pagesX[that.currPageX]);
      sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
      that.currPageX = page;

      // Check page Y
      page = that.pagesY.length - 1;
      for (i = 0; i < page; i++) {
        if (y >= that.pagesY[i]) {
          page = i;
          break;
        }
      }
      if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
      y = that.pagesY[page];
      sizeY = m.abs(y - that.pagesY[that.currPageY]);
      sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
      that.currPageY = page;

      // Snap with constant speed (proportional duration)
      time = m.round(m.max(sizeX, sizeY)) || 200;

      return { x: x, y: y, time: time };
    },

    _bind: function (type, el, bubble) {
      // modify by jku
      //(el || this.scroller).addEventListener(type, this, !!bubble);
      (el || this.wrapper).addEventListener(type, this, !!bubble);
    },

    _unbind: function (type, el, bubble) {
      // modify by jku
      //(el || this.scroller).removeEventListener(type, this, !!bubble);
      (el || this.wrapper).removeEventListener(type, this, !!bubble);
    },


    /**
    *
    * Public methods
    *
    */
    destroy: function () {
      var that = this;

      that.scroller.style[transform] = "";

      // Remove the scrollbars
      that.hScrollbar = false;
      that.vScrollbar = false;
      that._scrollbar("h");
      that._scrollbar("v");

      // Remove the event listeners
      that._unbind(RESIZE_EV, window);
      that._unbind(START_EV);
      that._unbind(MOVE_EV, window);
      that._unbind(END_EV, window);
      that._unbind(CANCEL_EV, window);

      if (!that.options.hasTouch) {
        that._unbind("DOMMouseScroll");
        that._unbind("mousewheel");
      }

      if (that.options.useTransition) that._unbind(TRNEND_EV);

      if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);

      if (that.options.onDestroy) that.options.onDestroy.call(that);
    },

    refresh: function () {
      var that = this,
          offset,
          i,
          l,
          els,
          pos = 0,
          page = 0;

      if (that.scale < that.options.zoomMin) that.scale = that.options.zoomMin;
      that.wrapperW = that.wrapper.clientWidth || 1;
      that.wrapperH = that.wrapper.clientHeight || 1;

      that.minScrollY = -that.options.topOffset || 0;
      that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
      that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
      that.maxScrollX = that.wrapperW - that.scrollerW;
      that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
      that.dirX = 0;
      that.dirY = 0;

      if (that.options.onRefresh) that.options.onRefresh.call(that);

      that.hScroll = that.options.hScroll && that.maxScrollX < 0;
      that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);

      that.hScrollbar = that.hScroll && that.options.hScrollbar;
      that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

      offset = that._offset(that.wrapper);
      that.wrapperOffsetLeft = -offset.left;
      that.wrapperOffsetTop = -offset.top;

      // Prepare snap
      if (typeof that.options.snap == "string") {
        that.pagesX = [];
        that.pagesY = [];
        els = that.scroller.querySelectorAll(that.options.snap);
        for (i = 0, l = els.length; i < l; i++) {
          pos = that._offset(els[i]);
          pos.left += that.wrapperOffsetLeft;
          pos.top += that.wrapperOffsetTop;
          that.pagesX[i] = pos.left < that.maxScrollX ? that.maxScrollX : pos.left * that.scale;
          that.pagesY[i] = pos.top < that.maxScrollY ? that.maxScrollY : pos.top * that.scale;
        }
      } else if (that.options.snap) {
        that.pagesX = [];
        while (pos >= that.maxScrollX) {
          that.pagesX[page] = pos;
          pos = pos - that.wrapperW;
          page++;
        }
        if (that.maxScrollX % that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length - 1] + that.pagesX[that.pagesX.length - 1];

        pos = 0;
        page = 0;
        that.pagesY = [];
        while (pos >= that.maxScrollY) {
          that.pagesY[page] = pos;
          pos = pos - that.wrapperH;
          page++;
        }
        if (that.maxScrollY % that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length - 1] + that.pagesY[that.pagesY.length - 1];
      }

      // Prepare the scrollbars
      that._scrollbar("h");
      that._scrollbar("v");

      if (!that.zoomed) {
        that.scroller.style[transitionDuration] = "0";
        that._resetPos(400);
      }
    },

    scrollTo: function (x, y, time, relative) {
      var that = this,
          step = x,
          i,
          l;

      that.stop();

      if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];

      for (i = 0, l = step.length; i < l; i++) {
        if (step[i].relative) {
          step[i].x = that.x - step[i].x;step[i].y = that.y - step[i].y;
        }
        that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
      }

      that._startAni();
    },

    scrollToElement: function (el, time) {
      var that = this,
          pos;
      el = el.nodeType ? el : that.scroller.querySelector(el);
      if (!el) return;

      pos = that._offset(el);
      pos.left += that.wrapperOffsetLeft;
      pos.top += that.wrapperOffsetTop;

      pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
      pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
      time = time === undefined ? m.max(m.abs(pos.left) * 2, m.abs(pos.top) * 2) : time;

      that.scrollTo(pos.left, pos.top, time);
    },

    scrollToPage: function (pageX, pageY, time) {
      var that = this,
          x,
          y;

      time = time === undefined ? 400 : time;

      if (that.options.onScrollStart) that.options.onScrollStart.call(that);

      if (that.options.snap) {
        pageX = pageX == "next" ? that.currPageX + 1 : pageX == "prev" ? that.currPageX - 1 : pageX;
        pageY = pageY == "next" ? that.currPageY + 1 : pageY == "prev" ? that.currPageY - 1 : pageY;

        pageX = pageX < 0 ? 0 : pageX > that.pagesX.length - 1 ? that.pagesX.length - 1 : pageX;
        pageY = pageY < 0 ? 0 : pageY > that.pagesY.length - 1 ? that.pagesY.length - 1 : pageY;

        that.currPageX = pageX;
        that.currPageY = pageY;
        x = that.pagesX[pageX];
        y = that.pagesY[pageY];
      } else {
        x = -that.wrapperW * pageX;
        y = -that.wrapperH * pageY;
        if (x < that.maxScrollX) x = that.maxScrollX;
        if (y < that.maxScrollY) y = that.maxScrollY;
      }

      that.scrollTo(x, y, time);
    },

    disable: function () {
      this.stop();
      this._resetPos(0);
      this.enabled = false;

      // If disabled after touchstart we make sure that there are no left over events
      this._unbind(MOVE_EV, window);
      this._unbind(END_EV, window);
      this._unbind(CANCEL_EV, window);
    },

    enable: function () {
      this.enabled = true;
    },

    stop: function () {
      if (this.options.useTransition) this._unbind(TRNEND_EV);else cancelFrame(this.aniTime);
      this.steps = [];
      this.moved = false;
      this.animating = false;
    },

    zoom: function (x, y, scale, time) {
      var that = this,
          relScale = scale / that.scale;

      if (!that.options.useTransform) return;

      that.zoomed = true;
      time = time === undefined ? 200 : time;
      x = x - that.wrapperOffsetLeft - that.x;
      y = y - that.wrapperOffsetTop - that.y;
      that.x = x - x * relScale + that.x;
      that.y = y - y * relScale + that.y;

      that.scale = scale;
      that.refresh();

      that.x = that.x > 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x;
      that.y = that.y > that.minScrollY ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;

      that.scroller.style[transitionDuration] = time + "ms";
      that.scroller.style[transform] = "translate(" + that.x + "px," + that.y + "px) scale(" + scale + ")" + translateZ;
      that.zoomed = false;
    },

    isReady: function () {
      return !this.moved && !this.zoomed && !this.animating;
    }
  };

  function prefixStyle(style) {
    if (vendor === "") {
      return style;
    }style = style.charAt(0).toUpperCase() + style.substr(1);
    return vendor + style;
  }

  dummyStyle = null; // for the sake of it

  if (typeof exports !== "undefined") exports.iScroll = iScroll;else window.iScroll = iScroll;
})(window, document);

},{}],2:[function(require,module,exports){
"use strict";

/**
 * color info class
 * @name  Color
 * @version  0.1.0
 * @author  trustyoo86@linkit.kr
 */

module.exports = {
  /**
   * is hex
   * @param  {String}  str string
   * @return {Boolean} isHex is hex string
   */
  isHex: function isHex(str) {
    var isHex = false;

    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(str)) {
      isHex = true;
    } else {
      isHex = false;
    }

    return isHex;
  },

  /**
   * hex to rgba string
   * @param  {String} hex     hex string
   * @param  {Number} opacity opacity
   */
  hexToRgba: function hexToRgba(hex, opacity) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return "rgba(" + [c >> 16 & 255, c >> 8 & 255, c & 255].join(",") + "," + (opacity || 0.5) + ")";
    } else {
      throw new Error("Bad Hex");
    }
  }
};

},{}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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
var Base = (function () {
  function Base() {
    _classCallCheck(this, Base);
  }

  _prototypeProperties(Base, null, {
    initialize: {
      /**
       * 객체 옵션에 따른 초기화를 한다.
       * @memberof Base
       * @function intialize
       * @param {Object} opt shape의 옵션
       */
      value: function initialize(opt) {
        var option = opt || {};

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
        this.name = option.name || "unnamed";
        /**
         * element에 그려지는 layer 객체
         * @property layer
         * @type {Object}
         */
        this.layer = option.layer; // layer
        /**
         * element를 control 하기 위한 jQuery base element
         * @property controlBase
         * @type {Object}
         */
        this.controlBase = option.controlBase; // text layer
        /**
         * shape가 포함되는 group의 id
         * @property group
         * @type {String}
         */
        this.group = option.group.id; // group
        /**
         * shape를 칠하기 위한 색
         * @property fill
         * @type {String}
         */
        this.fill = option.fill || "#bdbdbd"; // fill
        /**
         * shape의 테두리 색
         * @property stroke
         * @type {String}
         */
        this.stroke = option.stroke || "#000000"; // stroke
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
        this.paths = option.paths || []; // path array
        /**
         * shape를 그리기 위한 x 좌표
         * @property posx
         * @type {Number}
         */
        this.posx = option.posx; // center x
        /**
         * shape를 그리기 위한 y 좌표
         * @property posy
         * @type {Number}
         */
        this.posy = option.posy; // center y
        /**
         * shape의 넓이값
         * @property width
         * @type {Number}
         */
        this.width = option.width; // width
        /**
         * shape의 높이값
         * @property height
         * @type {Number}
         */
        this.height = option.height; // height
        /**
         * control base에 shape의 이름을 표시하기 위한 여부
         * @property showText
         * @type {Boolean}
         */
        this.showText = option.showText || true; // show text
        /**
         * html로 shape의 이름 영역을 그리는 경우 사용하는 변수
         * @property textHtml
         * @type {String}
         */
        this.textHtml = option.textHtml; // text html
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

        if (this.type === "polygon") {
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
          this.centerx = this.posx + this.width / 2;
          /**
           * 중앙점 y 좌표
           * @property centery
           * @type {Number}
           */
          this.centery = this.posy + this.height / 2;
        }
      },
      writable: true,
      configurable: true
    },
    getTotalInfo: {

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
      value: function getTotalInfo() {
        return {
          x: this.posx,
          y: this.posy,
          width: this.width,
          height: this.height
        };
      },
      writable: true,
      configurable: true
    },
    getSize: {

      /**
       * 사이즈 정보를 조회한다.
       * @memberof Base
       * @function getSize
       * @returns {Object} 사이즈 정보
       * @return {Number} width 넓이
       * @return {Number} height 높이
       */
      value: function getSize() {
        return {
          width: this.width,
          height: this.height
        };
      },
      writable: true,
      configurable: true
    },
    getPosition: {

      /**
       * 위치 정보를 가져온다.
       * @memberof Base
       * @function getPosition
       * @returns {Object} 위치 정보
       * @return {Number} x x 좌표
       * @return {Number} y y 좌표
       */
      value: function getPosition() {
        return {
          x: this.posx,
          y: this.posy
        };
      },
      writable: true,
      configurable: true
    },
    getCenterPosition: {

      /**
       * 중심 좌표를 반환한다.
       * @memberof Base
       * @function getCenterPosition
       * @return {Number} x center x position
       * @return {Number} y center y position
       */
      value: function getCenterPosition() {
        return {
          x: this.centerx,
          y: this.centery
        };
      },
      writable: true,
      configurable: true
    },
    getTextPosition: {

      /**
       * 텍스트 정보를 반환한다.
       * @memberof Base
       * @function getTextInfo
       * @return {Number} x text x
       * @return {Number} y text y
       * @return {String} label label string
       */
      value: function getTextPosition() {
        return {
          x: this.posx,
          y: this.posy,
          label: ""
        };
      },
      writable: true,
      configurable: true
    }
  });

  return Base;
})();

module.exports = Base;

},{}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Base = _interopRequire(require("../base"));

var Color = _interopRequire(require("../../color"));

var Event = _interopRequire(require("../../events"));

var ImageShape = (function (Base) {
    function ImageShape(opt, ctx, isRender) {
        _classCallCheck(this, ImageShape);

        _get(Object.getPrototypeOf(ImageShape.prototype), "initialize", this).call(this, opt);
        var self = this;
        var controllerStr = "<div class=\"shape-controller\" id=\"control-" + this.id + "\" " + "style=\"position:absolute;padding:5px;\">" + " <div class=\"controller-wrapper\" style=\"position:relative;width:100%;height:100%;border:1px solid #6799FF;\">" + "   <div class=\"handler\" handler-type=\"lt\" style=\"cursor:nw-resize;width:5px;height:5px;background:#6799FF;position:absolute;left:0px;top:0px;\"></div>" + "   <div class=\"handler\" handler-type=\"lb\" style=\"cursor:sw-resize;width:5px;height:5px;background:#6799FF;position:absolute;left:0px;bottom:0px;\"></div>" + "   <div class=\"handler\" handler-type=\"rt\" style=\"cursor:ne-resize;width:5px;height:5px;background:#6799FF;position:absolute;right:0px;top:0px;\"></div>" + "   <div class=\"handler\" handler-type=\"rb\" style=\"cursor:se-resize;width:5px;height:5px;background:#6799FF;position:absolute;right:0px;bottom:0px;\"></div>" + " </div>" + "</div>";

        // 타입 바인딩
        this.type = "image";

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

        this.textObj = $("<span class=\"text-obj\"></span>").css({
            position: "absolute",
            padding: 2,
            "border-radius": 5,
            "font-size": 10,
            "pointer-events": "none",
            "font-weight": "normal",
            "text-align": "center",
            color: "#ffffff",
            "background-color": "#000000" });

        if (!opt.image) {
            (function () {
                var image = new Image();

                image.onload = function () {
                    self.image = image;

                    if (isRender) {
                        self.render(ctx);
                    }
                };
                image.src = opt.url;
            })();
        } else {
            // image 객체 바인딩
            this.image = opt.image;
            if (isRender) {
                self.render(ctx);
            }
        }
    }

    _inherits(ImageShape, Base);

    _prototypeProperties(ImageShape, null, {
        render: {

            /**
             * 오브젝트를 그린다.
             * @memberof Image
             * @function render
             * @param {Object} opt 렌더링 옵션
             */
            value: function render(ctx) {
                ctx.drawImage(this.image, this.posx, this.posy, this.width, this.height);

                this.addText();
            },
            writable: true,
            configurable: true
        },
        addText: {

            /**
             * text를 추가한다.
             * @memberof Image
             * @function addText
             */
            value: function addText() {
                var _this = this;
                var self = this;
                var textArea = this.controlBase;

                if (this.showText) {
                    (function () {
                        if (_this.textHtml) {
                            _this.textObj = $(_this.textHtml);
                        } else {
                            _this.textObj.attr("id", "text-" + _this.id).attr("group-id", _this.group).text(_this.name || "unnamed").css({
                                left: _this.posx + _this.width / 2 - _this.textObj.width() / 2,
                                top: _this.posy + _this.height + 5
                            });
                        }

                        var timer = setTimeout(function () {
                            clearTimeout(timer);
                            textArea.append(self.textObj);
                        }, 100);
                    })();
                }
            },
            writable: true,
            configurable: true
        },
        modifyShape: {

            /**
             * shape 정보를 변경한다.
             * @memberof Image
             * @function modifyShape
             * @param {Object} opt 옵션 정보
             * @param {Function} callback 콜백 함수
             */
            value: function modifyShape(opt, callback) {
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

                typeof callback == "function" && callback();
            },
            writable: true,
            configurable: true
        },
        select: {

            /**
             * 해당 객체를 선택 상태로 놓는다.
             * @memberof Image
             * @function select
             */
            value: function select(resizeOpt, dndOpt) {
                var self = this;

                this.controller.css({
                    width: this.width + 10,
                    height: this.height + 10,
                    left: this.posx - 5, // 5만큼 크게 잡기
                    top: this.posy - 5 // 5만큼 크게 잡고 나머지 위치 조정
                });

                // control base에 controller를 배치한다.
                self.controlBase.append(this.controller);
            },
            writable: true,
            configurable: true
        },
        unSelect: {

            /**
             * 해당 객체를 선택 해제 상태로 놓는다.
             * @memberof Image
             * @function unSelect
             */
            value: function unSelect() {
                this.controller.remove();
            },
            writable: true,
            configurable: true
        },
        getImage: {

            /**
             * 이미지 정보를 반환한다.
             * @memberof Image
             * @function getImage
             * @return {Object} this.image
             */
            value: function getImage() {
                return this.image;
            },
            writable: true,
            configurable: true
        }
    });

    return ImageShape;
})(Base);

module.exports = ImageShape;

},{"../../color":2,"../../events":7,"../base":3}],5:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * 객체간 링크
 * @name Link
 */
var Link = (function () {
  function Link(opt) {
    _classCallCheck(this, Link);

    Object.assign(this, opt);

    if (!opt.stroke) {
      this.stroke = "#6799FF";
    }

    if (!opt.strokeWidth) {
      this.strokeWidth = 2;
    }

    if (!opt.strokeStyle) {
      this.strokeStyle = "full";
    }

    if (!opt.strokeDash) {
      this.strokeDash = 1;
    }
  }

  _prototypeProperties(Link, null, {
    render: {

      /**
       * 라인을 그린다.
       * @memberof Link
       * @function render
       * @param {Object} opt option object
       */
      value: function render(ctx, callback) {
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

        typeof callback == "function" && callback();
      },
      writable: true,
      configurable: true
    },
    modifyPosition: {

      /**
       * 객체에 따른 position을 변경한다.
       * @param {String} type type(시작 / 끝)
       * @param {Object} shape target이 될 shape 객체
       */
      value: function modifyPosition(type, x, y) {
        var self = this;

        switch (type) {
          case "start":
            self.sx = x;
            self.sy = y;
            break;
          case "end":
            self.ex = x;
            self.ey = y;
            break;
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Link;
})();

module.exports = Link;

},{}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Base = _interopRequire(require("../base"));

var Color = _interopRequire(require("../../color"));

var Polygon = (function (Base) {
  function Polygon(opt, ctx) {
    _classCallCheck(this, Polygon);

    _get(Object.getPrototypeOf(Polygon.prototype), "initialize", this).call(this, opt);
    // prev history data
    this._prevData = {
      paths: null,
      fill: null,
      stroke: null,
      strokeWidth: null,
      opacity: null
    };

    this.textObj = $("<span class=\"text-obj\"></span>").css({
      position: "absolute",
      "pointer-events": "none",
      "font-size": 10,
      "font-weight": "normal",
      "text-align": "center",
      color: "#000000"
    });

    // type 바인딩
    this.type = "polygon";

    // hex일 경우 rgba로 변환
    this.fill = Color.isHex(opt.fill) ? Color.hexToRgba(opt.fill, opt.opacity) : opt.fill;
  }

  _inherits(Polygon, Base);

  _prototypeProperties(Polygon, null, {
    render: {

      /**
       * rendering
       * @memberof Polygon
       * @function render
       */
      value: function render(ctx) {
        var paths = null,
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
        paths.forEach(function (pos, idx) {
          switch (idx) {
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
      },
      writable: true,
      configurable: true
    },
    addText: {

      /**
       * text를 추가한다.
       * @memberof Polygon
       * @function addText
       * @param {Object} opt 
       */
      value: function addText() {
        var textArea = this.controlBase;

        // text를 보여주는 경우
        if (this.showText) {
          // title이 html인 경우
          if (this.textHtml) {
            // textObj 변경
            this.textObj = $(this.textHtml);
          } else {
            this.textObj.attr("id", "text-" + this.id).attr("group-id", this.group).empty().text(this.name || "unnamed").css({
              left: this.posx,
              top: this.posy
            });
          }
          textArea.append(this.textObj);
        }
      },
      writable: true,
      configurable: true
    },
    select: {

      /**
       * 선택상태에 놓는다.
       * @memberof Polygon
       * @function select
       */
      value: function select() {
        this._prevFill = this.fill;
        this.fill = "#C90000";
      },
      writable: true,
      configurable: true
    },
    unSelect: {

      /**
       * 선택상태를 해제한다.
       * @memberof Polygon
       * @function unSelect
       */
      value: function unSelect() {
        if (this._prevFill) {
          this.fill = this._prevFill;
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Polygon;
})(Base);

module.exports = Polygon;

},{"../../color":2,"../base":3}],7:[function(require,module,exports){
"use strict";

/**
 * Events object
 * @name Event
 * @version  0.1.0
 * @author  HanseungYoo(trustyoo86@linkit.kr)
 */

/**
 * recognize mobile device event
 * @memberof Event
 * @function hasTouch
 */
var hasTouch = (function () {
    var check = false;

    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);

    return check;
})();

/**
 * get event position
 * @memberOf  Event
 * @function getEventPos
 * @param  {Object} evObj event object
 * @returns { Object } event position
 * @return { Number } x event position x
 * @return { Number } y event position y
 */
var getEventPos = function (evObj) {
    var event = null;

    if (hasTouch) {
        // touch event인 경우 첫번째 이벤트 position만 반환
        event = evObj.originalEvent.touches[0];
    } else {
        event = evObj;
    }


    return {
        x: event.pageX ? parseInt(event.pageX) : 0,
        y: event.pageY ? parseInt(event.pageY) : 0
    };
};

/**
 * get event offset positoin
 * @memberOf  Event
 * @function getEventOffset
 * @param  {Object} evObj event object
 * @returns {Object} event offset object
 * @return {Number} x event offset x
 * @return {Number} y event offset y
 */
var getEventOffset = function (evObj) {
    var event = null;

    if (hasTouch) {
        event = evObj.originalEvent.touches[0];
    } else {
        event = evObj;
    }

    return {
        x: event.offsetX ? parseInt(event.offsetX) : 0,
        y: event.offsetY ? parseInt(event.offsetY) : 0
    };
};

module.exports = {
    getEventPost: getEventPos,
    getEventOffset: getEventOffset,
    // const
    HAS_TOUCH: hasTouch,
    START: hasTouch ? "touchstart" : "mousedown", // drag start
    MOVE: hasTouch ? "touchmove" : "mousemove", // drag move
    END: hasTouch ? "touchend" : "mouseup", // drag end
    CANCEL: hasTouch ? "touchcancel" : "mouseup", // drag cancel
    CLICK: "click", // click
    DOUBLE_CLICK: "dblclick", // double click
    OVER: "mouseover", // mouse over
    OUT: "mouseout", // mouse out
    RESIZE: "onorientationchange" in window ? "orientationchange" : "resize",
    URL_CHANGE: "onpopstate" in window ? "popstate" : "hashchange",
    INPUT_CHECK: "blur",
    FILE_CHECK: "change",
    CHANGE: "change",
    REFRESH: "refresh",
    SELECT: "select",
    NOT_EXIST: "notExist",
    DRAG_START: "dragStart",
    DRAG_END: "dragEnd",
    API_COMPLETE: "apiComplete",
    LOAD_COMPLETE: "loadComplete",
    UPLOAD_COMPLETE: "uploadComplete",
    KEY: "keypress",
    ONLOAD: "onload",
    DISPLAY_CHANGE: "onShowHide",
    ZOOM_CHANGE: "changeZoom",
    DRAW_CLICK: "click.draw",
    DRAW_START: hasTouch ? "touchstart.draw" : "mousedown.draw",
    DRAW_MOVE: hasTouch ? "touchmove.draw" : "mousemove.draw",
    DRAW_END: hasTouch ? "touchend.draw" : "mouseup.draw",
    getEventPos: getEventPos,
    getEventOffset: getEventOffset
};

},{}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var iScroll = _interopRequire(require("../lib/iscroll/iScroll-custom"));

// iscroll

// flaats utility
var Event = _interopRequire(require("./events"));

// events
var Layer = _interopRequire(require("./layer"));

var Selector = _interopRequire(require("./selector"));

// array prototype min & max 설정
Array.prototype.max = function () {
  return Math.max.apply(null, this);
};

Array.prototype.min = function () {
  return Math.min.apply(null, this);
};

var iscroll = iScroll.iScroll;

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function ( /* function */callback, /* DOMElement */element) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

window.cancelRequestAnimFrame = (function () {
  return window.cancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout;
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
var Flaats = (function () {
  function Flaats(opt) {
    _classCallCheck(this, Flaats);

    this._palette = null; // palette
    this._base = null; // base
    this._scrollDiv = null; // scroll div
    this._flaatsBase = null; // flaats base
    this._layer = null; // layer
    this._layerList = {}; // layer list
    this._size = { // size
      width: 3000, // width
      height: 2000 // height
    };
    this._scale = null; // scale
    this._zoomLevel = 0; // zoom level
    this._step = 4; // step
    this.mode = "move"; // mode
    this._controlLayer = null;
    this.onInitialize = function () {}; //on initialize
    this._selector = new Selector(); // selector
    // shape
    this._startPos = null; // start position
    this._polygon = null; // polygon
    this._drawingPathArr = []; // polygon path array

    this._initialize(opt);
  }

  _prototypeProperties(Flaats, null, {
    _initialize: {

      /**
       * initialize
       * @memberof Flaats
       * @function _initialize
       * @param {Object} opt option object
       */
      value: function _initialize(opt) {
        var self = this;

        // this object binding
        for (var key in opt) {
          var val = opt[key];

          switch (key) {
            case "base":
              self._base = val;
              break;
            case "layer":
              self._layer = val;
              break;
            case "size":
              self._size = val;
              break;
            case "step":
              self._step = val;
              break;
            case "zoomLevel":
              self._zoomLevel = val;
              break;
            case "scale":
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
            var baseWidth = parseFloat(this._base.width()),
                //base width
            baseHeight = parseFloat(this._base.height()); //base height

            this.setBase(baseWidth, baseHeight, function (layer) {
              var timer = setTimeout(function () {
                clearTimeout(timer);
                self.onInitialize(layer);
              });
            });
          } else {
            throw "base is not defined";
          }
        } catch (e) {
          console.error(e.toString());
        }
      },
      writable: true,
      configurable: true
    },
    setBase: {

      /**
       * set base
       * @memberof Flaats
       * @function setBase
       * @param {Number} width  base width
       * @param {Number} height base height
       * @param {Function} callback callback function
       */
      value: function setBase(width, height, callback) {
        var self = this,
            setPalette = function (imagePath, callback) {
          var baseTmplStr = "";

          // map base setting
          baseTmplStr = "<div class=\"map-base\" style=\"position:absolute;opacity:0.5;top:0px;left:0px;user-select:none;\">";

          // if image path is exist
          if (imagePath) {
            baseTmplStr += "<img src=\"" + imagePath + "\" />";
          }
          // map base setting end
          baseTmplStr += "</div>";

          var baseTmpl = $(baseTmplStr).css({
            width: self._size.width,
            height: self._size.height
          });

          // append map base layer before map base removed
          self._scrollDiv.find(".map-base").remove();
          self._scrollDiv.prepend(baseTmpl).css({
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
            wheelAction: "none"
          });

          // get base scale
          var baseScale = parseFloat((1 / Math.max(self._size.width / width, self._size.height / height)).toFixed(3));

          // if step is not number
          if (typeof self._step != "number") {
            // set default step
            self._step = 4;
          }

          // if scale is not number
          if (typeof self._scale != "number") {
            self._scale = 1.5;
          }

          // zoom value initialize
          self._zoomValue = [];

          for (var idx = 0; idx < self._step; idx++) {
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
          self.setZoom(self._zoomLevel, function () {
            // if layer is not exist
            if (!self._layer) {
              // set default layer
              self._layer = [{
                id: "common-layer",
                name: "공통 레이어",
                type: "canvas"
              }];
            }

            try {
              // set layer loop
              for (var idx = 0; idx < self._layer.length; idx++) {
                var layer = self._layer[idx];

                if (layer.id) {
                  // add layer
                  self.addLayer(layer.id, layer.name, layer.type, idx, function () {
                    // if layer list
                    if (self.getObjSize(self._layerList) == self._layer.length) {
                      // trigger callback
                      typeof callback == "function" && callback(self._flaatsBase);
                    }
                  });
                } else {
                  throw "layer.id is not exist.";
                }
              }
            } catch (e) {
              console.error(e);
              // trigger callback
              typeof callback == "function" && callback(self._flaatsBase);
            }
          });
        };

        // append scrolldiv
        if (!this._scrollDiv) {
          this._scrollDiv = $("<div id=\"map-scroller\" class=\"map-view\" style=\"opacity:0;\"></div>");
          this._base.append(this._scrollDiv);
        }

        try {
          // image가 존재하는 경우
          if (this.image) {
            var image = new Image();

            // image onload function
            image.onload = function () {
              // set base size using image width / height
              self._size.width = image.width;
              self._size.height = image.height;

              // set base and set background images
              setPalette(self.image, function (layer) {
                // trigger callback
                typeof callback == "function" && callback(layer);
              });
            };

            // image on error
            image.onerror = function (err) {
              throw err;
            };

            image.src = this.image;
          } else {
            setPalette(null, callback);
          }
        } catch (e) {
          console.error("set canvas base error: ", e.toString());
        }
      },
      writable: true,
      configurable: true
    },
    getObjSize: {

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
      value: function getObjSize(obj) {
        var cnt = 0;

        // object loop
        for (var key in obj) {
          cnt++;
        }

        return cnt;
      },
      writable: true,
      configurable: true
    },
    moveToEl: {

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
      value: function moveToEl(layerId, separatorName, id) {
        var targetLayer = this.getLayer(layerId),
            elInfo = targetLayer.getShape(separatorName, id);

        var scroller = this._scroll,
            posx = undefined,
            posy = undefined,
            maxx = undefined,
            maxy = undefined;

        // object에 따른 posx, posy 설정
        switch (elInfo.type) {
          // polygon인 경우
          case "polygon":
            posx = elInfo.posx * this._scroll.scale - this._base.width() / 2;
            posy = elInfo.posy * this._scroll.scale - this._base.height() / 2;
            break;
          // image인 경우
          case "image":
            posx = elInfo.posx * this._scroll.scale - this._base.width() / 2;
            posy = elInfo.posy * this._scroll.scale - this._base.height() / 2;
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

        this.setZoom(2, function () {
          // scrolling
          scroller.scrollTo(-1 * posx, -1 * posy);
        });
      },
      writable: true,
      configurable: true
    },
    addShape: {

      /**
       * object들을 추가한다.
       * @memberof Flaats
       * @function addShape
       * @param {String} layerId layerId
       * @param {Object} list    오브젝트 정보 (array 또는 object)
       */
      value: function addShape(layerId, list, callback) {
        var listCnt = 0,
            targetLayer = this.getLayer(layerId) || this.getLayer("common-layer");

        // draw if target layer is exist.
        if (targetLayer) {
          // list가 array인 경우
          if (list.length) {
            // list 길이가 0 이상인 경우
            if (list.length > 0) {
              for (var idx = 0; idx < list.length; idx++) {
                var listItem = list[idx];

                // 추가 형태인지 확인
                var isAdd = targetLayer.addGroup(listItem, listItem.group);

                // 추가가 가능한 경우
                if (isAdd) {
                  listCnt++;

                  // list cnt가 list 길이와 맞닿은 경우
                  if (listCnt == list.length) {
                    targetLayer.drawLayer(function () {
                      typeof callback == "function" && callback(false);
                    });
                  }
                  // error
                } else {
                  typeof callback == "function" && callback(false);
                }
              }
            } else {
              typeof callback == "function" && callback(false);
            }
          } else {
            // Object
            // object가 빈객체가 아닌 경우
            if (JSON.stringify(list) != "{}") {
              for (var key in list) {
                var listItem = list[key];

                // get boolean
                var isAdd = targetLayer.addGroup(listItem, listItem.group);

                // success
                if (isAdd) {
                  listCnt++;

                  if (listCnt == Object.keys(list).length) {
                    targetLayer.drawLayer(function () {
                      typeof callback == "function" && callback(false);
                    });
                  }
                  // error
                } else {
                  typeof callback == "function" && callback(false);
                }
              }
            } else {
              typeof callback == "function" && callback(false);
            }
          }
        } else {
          throw "target layer is not defined";
        }
      },
      writable: true,
      configurable: true
    },
    addLink: {

      /**
       * 링크를 추가한다.
       * @memberof Flaats
       * @function initializeLink
       * @param {String} layerId layer id
       * @param {Array} linkInfo link 정보
       * @param {Function} callback 링크 후의 callback function
       */
      value: function addLink(layerId, linkInfo, opt, callback) {
        var targetLayer = this.getLayer(layerId) || this.getLayer("common-layer");

        if (targetLayer) {
          if (linkInfo.length) {
            if (linkInfo.length > 0) {
              targetLayer.addLink(linkInfo, opt, function () {
                typeof callback == "function" && callback(false);
              });
            } else {
              typeof callback == "function" && callback(false);
            }
          } else {
            if (JSON.stringify(linkInfo) != "{}") {
              targetLayer.addLink(linkInfo, opt, function () {
                typeof callback == "function" && callback(false);
              });
            } else {
              typeof callback == "function" && callback(false);
            }
          }
        } else {
          throw "target layer is not defined";
        }
      },
      writable: true,
      configurable: true
    },
    setSelector: {

      /**
       * set selector
       * @memberof Flaats
       * @function setSelector
       * @param {Function} onSelected 선택 상태가 되었을 때의 function
       */
      value: function setSelector(opt) {
        var self = this,
            doc = $(document);

        var layer = self._controlLayer;

        // 변수 sync 문제 발생 방지를 위해 객체 복사
        var option = Object.assign({}, opt),
            onSelected = option.onSelected || function () {};

        // set control layer if z index is 1
        if (!self._controlLayer) {
          for (var layerId in self._layerList) {
            var layerItem = self._layerList[layerId];

            if (layerItem.zIndex == 1) {
              layer = layerItem;
            }
          }
        }

        this._base.unbind(Event.START).bind(Event.START, function (e) {
          e.stopPropagation();
          layer.unselectShapeAll();

          if (e.button != 0) {
            return;
          }

          // select mode가 true인 경우
          if (self._selectMode) {
            if (!self._selector.enable || layer == void 0) {
              return false;
            }

            // 셀렉터 시작
            self._selector.start(layer.base, layer.layerObj, e, function () {});

            // 드래그 중인 경우
            doc.bind(Event.MOVE, function (e) {
              e.stopPropagation();
              self._selector.draw(layer.layerObj, e, function () {});
            });

            // 드래그가 끝난 경우
            layer.base.one(Event.END, function (ev) {
              ev.stopPropagation();
              doc.unbind(Event.MOVE);

              // selector end function을 호출한다.
              self._selector.end(layer.layerObj, ev, function (x, y, w, h) {
                // 소숫점을 제거한다. (퍼포먼스 및 계산)
                var startx = Math.round(x),
                    starty = Math.round(y),
                    endx = startx + w,
                    endy = starty + h,
                    list = null;

                // 리스트를 받아온다.
                list = layer.searchByPosition(startx, starty, endx, endy);
                // 리스트에 대한 object를 변경한다.
                // resize 및 dnd에 따른 function 을 전달한다.
                layer.selectShape(list, opt.resize || {}, opt.dnd || {});

                typeof onSelected == "function" && onSelected(list);
              });
            });
          }
        });
      },
      writable: true,
      configurable: true
    },
    getZoom: {

      /**
       * get zoom level
       * @memberOf  Flaats
       * @function getZoom
       * @return {Number} this._zoomLevel zoom level
       */
      value: function getZoom() {
        return this._zoomLevel;
      },
      writable: true,
      configurable: true
    },
    setZoom: {

      /**
       * set zoom
       * @memberof  Flaats
       * @function setZoom
       * @param {Number}   level    zoom level
       * @param {Function} callback callback function
       * @param {Number} time zoom delay
       */
      value: function setZoom(level, callback, time) {
        var scroller = this._scroll,
            newScale = this._zoomValue[level];

        if (newScale == scroller.scale) {
          typeof callback == "function" && callback(this._zoomLevel);
        } else {
          // get offset value
          var offset = scroller._offset(scroller.wrapper),
              x = scroller.wrapperW / 2 + offset.left,
              y = scroller.wrapperH / 2 + offset.top;

          // scroller zooming
          scroller.zoom(x, y, newScale, time);

          this.refresh();

          typeof callback == "function" && callback(this._zoomLevel);
        }
      },
      writable: true,
      configurable: true
    },
    refresh: {

      /**
       * map을 갱신한다.
       * @memberof Flaats
       * @function refresh
       */
      value: function refresh() {
        var base = this._base,
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
          "margin-top": Math.max((parentH - scrollH) / 2, 0),
          "margin-left": Math.max((parentW - scrollW) / 2, 0)
        });

        // scroller scrolling
        scroller.scrollTo(x, y);

        // scroll div opacity set 1
        if (this._scrollDiv.css("opacity") != 1) {
          this._scrollDiv.css("opacity", 1);
        }

        // set timer scroller delay
        scaleTimer = setTimeout(function () {
          clearTimeout(scaleTimer);
          scroller.refresh();
        }, 100);
      },
      writable: true,
      configurable: true
    },
    addLayer: {

      /**
       * layer를 추가한다.
       * @memberof Flaats
       * @function addLayer
       * @param {String}   layerId  layer id
       * @param {String}   type     layer type
       * @param {Function} callback callback function after layer setting
       */
      value: function addLayer(layerId, name, type, index, callback) {
        var divW = this._flaatsBase.css("width"),
            divH = this._flaatsBase.css("height");

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
        typeof callback == "function" && callback(layer);
      },
      writable: true,
      configurable: true
    },
    getLayer: {

      /**
       * get layer
       * @memberof Flaats
       * @function getLayer
       * @param  {String} layerId layer id
       * @return {Object} layer   target layer
       */
      value: function getLayer(layerId) {
        return this._layerList[layerId];
      },
      writable: true,
      configurable: true
    },
    getLayerList: {

      /**
       * get layer list
       * @memberof Flaats
       * @function getLayerList
       * @return {Array}  this._layerList
       */
      value: function getLayerList() {
        return this._layerList;
      },
      writable: true,
      configurable: true
    },
    destroyEvent: {

      /**
       * 이벤트를 전체 해제한다.
       * @memberof Flaats
       * @function destroyEvent
       * @param  {Function} callback callback function after destroy event
       */
      value: function destroyEvent(callback) {
        var doc = $(document),
            layers = this._layerList;

        for (var layerId in layers) {
          var layer = layers[layerId];

          // 각 변수들을 초기화 한다.
          layer.initVariables();
          // init한 후 layer를 다시 그린다.
          layer.drawLayer();
          var _scrollDiv = layer.base;

          // control base의 pointer events를 비활성화 한다.
          layer.controlBase.css("pointer-events", "none");

          layer.unselectShapeAll();

          _scrollDiv.unbind(Event.DRAW_START);
          _scrollDiv.unbind(Event.DRAW_MOVE);
          _scrollDiv.unbind(Event.DRAW_END);
          _scrollDiv.removeClass("drawing");
        }

        doc.unbind(Event.DRAW_MOVE);
        doc.unbind(Event.MOVE);

        this._base.removeClass("move");
        this._base.removeClass("selector");
        this._base.unbind(Event.START);
        this._base.unbind(Event.end);

        typeof callback == "function" && callback();
      },
      writable: true,
      configurable: true
    },
    changeMode: {

      /**
       * 모드를 변경한다.
       * @memberof Flaats
       * @function changeMode
       * @param  {String} modeName mode name
       * @param {Object} opt option값 오브젝트
       */
      value: function changeMode(modeName, opt) {
        var self = this,

        // sync 문제 발생할 수 있으므로, 객체를 복사
        option = Object.assign({}, opt),

        // shape가 선택 되었을 때
        onShapeSelected = option.onSelected,

        // mode가 끝났을때
        callback = option.onChangeModeFinished;

        switch (modeName) {
          case "move":
            this.destroyEvent(function () {
              self._selectMode = false;
              // scroll enable
              self._scroll.enable();
              self._selector.enable = false;
              self._base.addClass("move");
            });
            break;
          case "select":
            this.destroyEvent(function () {
              self._selectMode = true;
              self._selector.enable = true;
              self.setSelector(opt);
              // scroll diable
              self._scroll.disable();
            });
            break;
          case "none":
            for (var layerId in this._layerList) {
              var layer = this._layerList[layerId];
              var _scrollDiv = layer.base;
              _scrollDiv.removeClass("drawing");
            }

            this._base.removeClass("move");
            this._selectMode = false;
            self._selector.enable = false;
            // scroll disable
            this._scroll.disable();
            break;
        }

        // callback function 호출
        typeof callback == "function" && callback();
      },
      writable: true,
      configurable: true
    },
    linkShape: {

      /**
       * 
       * @param {Object} linkInfo link info
       */
      value: function linkShape(linkInfo) {
        var layerId = linkInfo.layerId;
        var info = Object.assign({}, linkInfo);
        var targetLayer = undefined;

        // layer id가 존재하지 않는 경우
        if (!layerId) {
          var layerList = this.getLayerList();

          for (var id in layerList) {
            var layer = layerList[id];

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
      },
      writable: true,
      configurable: true
    },
    drawingShape: {

      /**
       * object를 그린다.
       * @memberof Flaats
       * @function drawingObj
       * @param {Object} opt object option
       */
      value: function drawingShape(opt) {
        var _this = this;
        var self = this,
            layerBase = null,
            doc = $(document);

        var optObj = Object.assign({}, opt),
            layerId = optObj.layerId ? optObj.layerId : null,
            isSet = optObj.isSet ? optObj.isSet : true,
            section = optObj.section ? optObj.section : null,
            option = optObj.option ? optObj.option : {},
            moveCallback = optObj.onDragMove || function () {},
            callback = optObj.onFinished || function () {};

        try {
          if (!layerId) {
            throw "layer id is not defined";
          } else {
            // layer의 z-index 변경
            this.changeIdx(layerId, function (layer) {
              // layer base 추출
              layerBase = layer.base;

              layerBase.unbind(Event.DRAW_MOVE);
              layerBase.unbind(Event.DRAW_END);

              if (isSet && section) {
                _this._preMapMode = _this.mode;
                // mode를 none으로 변경한다.
                _this.changeMode("none");

                /**
                 * 드래그 이동 이벤트
                 * @event DRAW_MOVE
                 */
                layerBase.bind(Event.DRAW_MOVE, function (ev) {
                  var position = self.getBasePosition(ev);

                  layer.drawShape(position, option);
                  moveCallback(position);
                });

                layerBase.bind(Event.DRAW_END, function (ev) {
                  var endPosition = self.getBasePosition(ev);

                  layerBase.unbind(Event.DRAW_MOVE);
                  layer.addObj(endPosition, section, option, function () {
                    typeof callback == "function" && callback(endPosition);
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
          console.error("[setting object error]" + e);
        }
      },
      writable: true,
      configurable: true
    },
    drawingPolygon: {

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
      value: function drawingPolygon(opt) {
        var _this = this;
        var self = this,
            layerBase = null,
            doc = $(document);

        var optObj = Object.assign({}, opt),
            layerId = optObj.layerId ? optObj.layerId : null,
            // layer id
        isSet = optObj.isSet ? optObj.isSet : true,
            // is setting
        sectionName = optObj.section ? optObj.section : null,
            // section name
        option = optObj.option ? optObj.option : {},
            // option
        drawStartCallback = optObj.onDrawStart || function () {},
            drawMoveCallback = optObj.onDraw || function () {},
            callback = optObj.onFinished || function () {}; // on finished callback

        try {
          if (!layerId) {
            throw "layer id is not defined";
          } else {
            // change layer index
            this.changeIdx(layerId, function (layer) {
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
                layerBase.removeClass("drawing");
                // pre map mode save
                _this._preMapMode = _this.mode;
                // change map mode none
                _this.changeMode("none");

                // base add class drawing mode
                layerBase.addClass("drawing");
                // draw start event binding
                layerBase.bind(Event.DRAW_START, function (ev) {
                  var pos = self.getBasePosition(ev),
                      pathLen = self._drawingPathArr.length,
                      isStart = pathLen == 0,
                      isFinish = pathLen > 3 && self._startPos != null && Math.sqrt(Math.pow(pos.x - self._startPos.x, 2) + Math.pow(pos.y - self._startPos.y, 2)) <= 3;

                  if (ev.button != 0) {
                    return;
                  }

                  drawStartCallback(pos);

                  // if path length is 0
                  if (isStart) {
                    if (layer.type === "canvas") {
                      self._polygon = {};
                    } else {
                      layer.editPolygon(self._polygon, [pos], option, false, false);
                    }

                    self._drawingPathArr.push(pos);
                    self._startPos = pos;

                    // document move event
                    doc.bind(Event.DRAW_MOVE, function (ev) {
                      var movePos = self.getBasePosition(ev),
                          distance = Math.sqrt(Math.pow(movePos.x - self._startPos.x, 2) + Math.pow(movePos.y - self._startPos.y, 2)),
                          curLen = self._drawingPathArr.length;

                      drawMoveCallback(movePos);

                      // if finish position
                      if (distance <= 3 && curLen > 3) {
                        var pathArr = self._drawingPathArr;
                        // path array push
                        pathArr.push(self._startPos);
                        // polygon add
                        layer.editPolygon(self._polygon, self._drawingPathArr, option, true, false);
                      } else {
                        var paths = [];
                        // finished였다가 아닌 경우 startpos에 해당하는 객체를 삭제한다.
                        for (var idx = 0; idx < self._drawingPathArr.length; idx++) {
                          var path = self._drawingPathArr[idx];

                          // array slice를 통해 삭제
                          if (idx != 0 && path.x != self._startPos && path.y != self._startPos.y) {
                            paths.push(path);
                          } else if (idx == 0) {
                            paths.push(path);
                          }
                        }

                        self._drawingPathArr = paths;

                        var pathArr = [].concat(paths, [movePos]);

                        // path array push
                        // pathArr.push(movePos);
                        // polygon drawing
                        layer.editPolygon(self._polygon, pathArr, option, false, false);
                      }
                    });
                  } else if (isFinish) {
                    // drawing path array push
                    self._drawingPathArr.push(self._startPos);
                    layer.addPolygon(self._polygon, self._drawingPathArr, sectionName, option, function () {
                      console.log("option is: ", option);
                      for (var key in option) {
                        if (key != "fill" && key != "stroke" && key != "strokeWidth" && key != "opacity") {
                          delete option[key];
                        }
                      }

                      typeof callback == "function" && callback(pos);
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
                _this.drawingPolygon(optObj);
              } else {
                return false;
              }
            });
          }
        } catch (e) {}
      },
      writable: true,
      configurable: true
    },
    controlLayerView: {

      /**
       * layer를 show / hide 한다.
       * @param {String} layerId layer id
       * @param {Boolean} isShow show 할지 안할지에 대한 여부
       */
      value: function controlLayerView(layerId, isShow) {
        var targetLayer = this.getLayer(layerId);

        // show 여부에 따른 show/hide
        switch (isShow) {
          case true:
            targetLayer.showLayer();
            break;
          case false:
            targetLayer.hideLayer();
            break;
        }
      },
      writable: true,
      configurable: true
    },
    controlGroupView: {

      /**
       * layer에 해당하는 group을 show / hide한다.
       * @param {String} layerId layer id
       * @param {String} groupId group id
       * @param {Boolean} isShow show 할지에 대한 여부
       */
      value: function controlGroupView(layerId, groupId, isShow) {
        var targetLayer = this.getLayer(layerId);

        switch (isShow) {
          case true:
            targetLayer.showGroup(groupId);
            break;
          case false:
            targetLayer.hideGroup(groupId);
            break;
        }
      },
      writable: true,
      configurable: true
    },
    deleteGroup: {

      /**
       * layer에 해당하는 group을 삭제한다.
       * @param {String} layerId layer id
       * @param {String} groupId group id
       * @param {Function} callback callback function
       */
      value: function deleteGroup(layerId, groupId, callback) {
        var targetLayer = this.getLayer(layerId);

        // 해당 target layer에 group에 대한 정보를 삭제한다.
        targetLayer.deleteGroup(groupId, function () {
          typeof callback == "function" && callback();
        });
      },
      writable: true,
      configurable: true
    },
    getBasePosition: {

      /**
       * get base position
       * @param  {Object} ev event object
       * @return {x} base position x
       * @return {y} base positoin y
       */
      value: function getBasePosition(ev) {
        var basePosX = ev.offsetX,
            basePosY = ev.offsetY;

        return {
          x: parseInt(basePosX),
          y: parseInt(basePosY)
        };
      },
      writable: true,
      configurable: true
    },
    changeIdx: {

      /**
       * change index
       * @param  {String}   layerId  layer id
       * @param  {Function} callback layer id change callback
       */
      value: function changeIdx(layerId, callback) {
        var targetLayer = this.getLayer(layerId),

        // target layer that z-index is 1.
        firstLayer = null;

        for (var layerId in this._layerList) {
          var layer = this._layerList[layerId];

          if (layer.zIndex == 1) {
            firstLayer = layer;
          }
        }

        // if target layer is first layer
        try {
          if (targetLayer) {
            if (targetLayer === firstLayer) {
              typeof callback == "function" && callback(targetLayer);
            } else {
              // change index
              var copyIndex = targetLayer.zIndex;
              targetLayer.changeIndex(firstLayer.zIndex);
              firstLayer.changeIndex(copyIndex);
              copyIndex = null;

              this._controlLayer = targetLayer;

              typeof callback == "function" && callback(targetLayer);
            }
          } else {
            throw "target layer is empty." + layerId;
          }
        } catch (e) {
          console.error("change index error: ", e.toString());
        }
      },
      writable: true,
      configurable: true
    },
    destroy: {

      /**
       * 소멸자
       * @memberof Flaats
       * @function destroy
       */
      value: function destroy() {
        var self = this;

        for (var layerId in this._layerList) {
          var layer = self._layerList[layerId];
          layer.destroy();
        }

        this._palette = null; // palette
        this._base = null; // base
        this._scrollDiv = null; // scroll div
        this._flaatsBase = null; // flaats base
        this._scale = null; // scale
        this._zoomLevel = 0; // zoom level
        this._step = 4; // step
        this.mode = "move"; // mode
        this._controlLayer = null;
        this.onInitialize = function () {}; //on initialize
        this._selector = null; // selector
        // shape
        this._startPos = null; // start position
        this._polygon = null; // polygon
        this._drawingPathArr = []; // polygon path array
      },
      writable: true,
      configurable: true
    }
  });

  return Flaats;
})();

if (module.exports) {
  module.exports = Flaats;
} else {
  window.Flaats = Flaats;
}

},{"../lib/iscroll/iScroll-custom":1,"./events":7,"./layer":9,"./selector":10}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Event = _interopRequire(require("./events"));

// events
var Color = _interopRequire(require("./color"));

// color

var Polygon = _interopRequire(require("./element/canvas/polygon"));

var ImageShape = _interopRequire(require("./element/canvas/Image"));

var Link = _interopRequire(require("./element/canvas/Link"));

/**
 * Flaats layer
 * @name  Layer
 * @version  0.1.0
 * @author  HanseungYoo(trustyoo86@linkit.kr)
 */
var Layer = (function () {
    /**
     * Layer constructor
     * @memberof Layer
     * @param {Object} target layer를 렌더링할 대상 객체
     * @param {Object} opt layer의 option값들을 포함한 객체
     */
    function Layer(target, opt) {
        _classCallCheck(this, Layer);

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
        this.type = opt.type || "canvas"; // type
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

    _prototypeProperties(Layer, null, {
        initialize: {

            /**
             * initialize
             * @memberOf  Layer
             * @function initialize
             */
            value: function initialize() {
                var self = this,

                // 타이틀 등의 text base
                controlBase = $("<div class=\"control-base\"></div>").css({
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    "pointer-events": "none"
                }),

                // layer base
                layerBase = $("<div class=\"layer-base\"></div>").css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    "z-index": self.zIndex,
                    width: self.width,
                    height: self.height
                });
                // text base 바인딩
                this.controlBase = controlBase;

                try {
                    // layer base에 id 설정
                    layerBase.attr("layer-id", this.layerId);

                    // text layer 추가
                    layerBase.append(controlBase);

                    this.target.append(layerBase);

                    // generate layer using type
                    switch (this.type) {
                        case "canvas":
                            // layerObjId making
                            self.layerObjId = "canvas-" + self.layerId;

                            // layer obj generate
                            var canvas = document.createElement("canvas");
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
                        case "svg":
                            break;
                    }

                    this.base = layerBase;
                } catch (e) {
                    console.error("set layer error:", e.toString());
                }
            },
            writable: true,
            configurable: true
        },
        initVariables: {

            /**
             * layer에서 사용되는 this 변수들을 초기화한다.
             * @memberof Layer
             * @function initVariables
             */
            value: function initVariables() {
                // polygon
                this._drawPath = null;
                this._drawStartPos = null;
                this._editPathArr = [];

                // image 객체
                this.imageUrl = null;
                this.image = null;
            },
            writable: true,
            configurable: true
        },
        showLayer: {

            /**
             * layer를 showing 한다.
             * @memberof Layer
             * @function showLayer
             */
            value: function showLayer() {
                this.base.css("display", "");
            },
            writable: true,
            configurable: true
        },
        hideLayer: {

            /**
             * layer를 hide 한다.
             * @memberof Layer
             * @function hideLayer
             */
            value: function hideLayer() {
                this.base.css("display", "none");
            },
            writable: true,
            configurable: true
        },
        showGroup: {

            /**
             * group을 showing 한다.
             * @memberof Layer
             * @function showGroup
             * @param {String} groupId group id
             */
            value: function showGroup(groupId) {
                this._group[groupId].show = true;
                this.controlBase.find(".text-obj[group-id=\"" + groupId + "\"]").css("display", "");
                this.drawLayer();
            },
            writable: true,
            configurable: true
        },
        hideGroup: {

            /**
             * group을 hide 한다.
             * @memberof Layer
             * @function hideGroup
             * @param {String} groupId group id
             */
            value: function hideGroup(groupId) {
                this._group[groupId].show = false;
                this.controlBase.find(".text-obj[group-id=\"" + groupId + "\"]").css("display", "none");
                this.drawLayer();
            },
            writable: true,
            configurable: true
        },
        changeIndex: {

            /**
             * change index
             * @param  {Number} zIndex z-index
             */
            value: function changeIndex(zIndex) {
                this.zIndex = zIndex;
                this.base.css("z-index", zIndex);
            },
            writable: true,
            configurable: true
        },
        linkShape: {

            /**
             * shape를 선으로 연결한다.
             * @memberof Layer
             * @function linkShape
             * @param {Object} target
             * @param {Array} link
             */
            value: function linkShape(target, link, opt) {
                var self = this;

                var linkArr = [];

                for (var idx = 0; idx < link.length; idx++) {
                    var linkObj = link[idx],
                        linkInfo = {
                        id: target.id + "~" + linkObj.id,
                        targetId: target.id,
                        linkId: linkObj.id,
                        layer: self.layerObj,
                        sx: target.posx + target.width / 2,
                        sy: target.posy + target.height / 2,
                        ex: linkObj.posx + linkObj.width / 2,
                        ey: linkObj.posy + linkObj.height / 2
                    };

                    linkInfo = Object.assign(linkInfo, opt);

                    linkArr.push(linkInfo);
                }

                // link info에 같이 merge한다.
                this._linkInfo = [].concat(_toConsumableArray(this._linkInfo), linkArr);
                this.drawLayer();
            },
            writable: true,
            configurable: true
        },
        addLink: {

            /**
             * link를 그린다.
             * @memberof Layer
             * @function addLink
             * @param {Array} linkInfo link 정보
             * @param {Object} opt option object
             * @param {Function} callback callback function
             */
            value: function addLink(linkInfo, opt, callback) {
                var self = this;

                for (var idx in linkInfo) {
                    var linkObj = linkInfo[idx];

                    linkObj.layer = self.layerObj;
                }

                // link info에 merge 한다.
                this._linkInfo = [].concat(_toConsumableArray(this._linkInfo), _toConsumableArray(linkInfo));

                this.drawLink(function () {
                    typeof callback == "function" && callback();
                });
            },
            writable: true,
            configurable: true
        },
        remove: {

            /**
             * remove shape
             * @param  {Object} shape shape object
             */
            value: function remove(shape) {
                // remove object type
                switch (this.type) {
                    case "canvas":
                        //this.layerObj.remove(shape);
                        break;
                    case "svg":
                        break;
                }
            },
            writable: true,
            configurable: true
        },
        searchByPosition: {

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
            value: function searchByPosition(sx, sy, ex, ey) {
                var self = this,
                    list = [];

                // group에서 shape 추출
                for (var groupId in this._group) {
                    var group = self._group[groupId],
                        shapes = group.items;

                    // group 내의 shape들을 loop돌며 비교
                    for (var shapeId in shapes) {
                        var shape = shapes[shapeId].obj;

                        switch (shape.type) {
                            case "polygon":
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
                            case "image":
                                var startx = shape.posx,
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
            },
            writable: true,
            configurable: true
        },
        selectShape: {

            /**
             * shape들을 선택 상태로 변경한다.
             * @memberof Layer
             * @function selectShape
             * @param {Array} list shape list
             * @param {Object} resizeOpt resize 관련 option
             * @param {Object} dndOpt drag drop 관련 option
             */
            value: function selectShape(list, resizeOpt, dndOpt) {
                this._selectedShape = list;

                if (list.length > 0) {
                    for (var idx = 0; idx < list.length; idx++) {
                        var shape = list[idx];
                        shape.select();
                    }

                    // control base의 pointer events를 활성화 한다.
                    this.controlBase.css("pointer-events", "");
                }

                this.drawLayer();
                this.controlHandler(resizeOpt, dndOpt);
            },
            writable: true,
            configurable: true
        },
        getBoundingPosition: {

            /**
             * bounding position 값을 추출한다.
             * @memberof Layer
             * @function getBoundingPosition
             * @param {Object} ev event object
             * @return {Number} x position x
             * @return {Number} y position y
             */
            value: function getBoundingPosition(ev) {
                var boundingBox = this.layerObj.getBoundingClientRect(),
                    x = (ev.clientX - boundingBox.left) * (this.layerObj.width / boundingBox.width),
                    y = (ev.clientY - boundingBox.top) * (this.layerObj.height / boundingBox.height);

                return {
                    x: parseInt(x),
                    y: parseInt(y)
                };
            },
            writable: true,
            configurable: true
        },
        controlHandler: {

            /**
             * control base에서 이벤트를 핸들링한다.
             * @memberof Layer
             * @function controlHandler
             * @param {Object} resizeOpt resize 옵션
             * @param {Object} dndOpt drag drop 옵션
             */
            value: function controlHandler(resizeOpt, dndOpt) {
                var self = this,
                    doc = $(document);

                this.controlBase.unbind(Event.DRAW_START);
                doc.unbind(Event.DRAW_MOVE);
                this.controlBase.unbind(Event.DRAW_END);

                this.controlBase.bind(Event.DRAW_START, function (sv) {
                    var target = $(sv.target),
                        parent = target.closest(".shape-controller");


                    // event의 target이 핸들러인 경우 이벤트 바인딩
                    if (target.hasClass("handler")) {
                        (function () {
                            var boundingPosition = self.getBoundingPosition(sv),
                                targetType = target.attr("handler-type"),
                                targetId = parent.attr("id").split("control-")[1],
                                left = boundingPosition.x,
                                top = boundingPosition.y,
                                width = parseInt(parent.width()),
                                height = parseInt(parent.height()),
                                diffX = undefined,
                                diffY = undefined;

                            switch (targetType) {
                                case "lt":
                                    diffX = left + width;
                                    diffY = top + height;
                                    break;
                                case "lb":
                                    diffX = left + width;
                                    diffY = top - height;
                                    break;
                                case "rt":
                                    diffX = left - width;
                                    diffY = top + height;
                                    break;
                                case "rb":
                                    diffX = left - width;
                                    diffY = top - height;
                                    break;
                            }

                            sv.stopPropagation();
                            doc.bind(Event.DRAW_MOVE, function (mv) {
                                mv.stopPropagation();
                                var movePos = self.getBoundingPosition(mv);

                                switch (targetType) {
                                    // 좌상
                                    case "lt":
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
                                    case "lb":
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
                                    case "rt":
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
                                    case "rb":
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
                                }, function () {
                                    // layer를 다시 그린다.
                                    self.drawLayer();
                                });
                            });

                            typeof resizeOpt.onResize === "function" && resizeOpt.onResize(self.getShape(null, targetId), moveLeft, moveTop, moveWidth, moveHeight);

                            self.controlBase.one(Event.DRAW_END, function (ev) {
                                ev.stopPropagation();
                                var endPos = self.getBoundingPosition(ev);

                                typeof resizeOpt.onEnd === "function" && resizeOpt.onEnd(self.getShape(null, targetId), left, top, width, height);

                                self.controlHandler(resizeOpt, dndOpt);
                            });
                        })();
                    } else if (target.hasClass("controller-wrapper")) {
                        (function () {
                            var targetId = parent.attr("id").split("control-")[1];
                            sv.stopPropagation();
                            var pw = parseInt(parent.width()),
                                ph = parseInt(parent.height());
                            // 드래그 중
                            doc.bind(Event.DRAW_MOVE, function (mv) {
                                mv.stopPropagation();
                                var movePos = self.getBoundingPosition(mv),

                                // 중심점을 이동 점으로 보고 x, y좌표 설정
                                sx = movePos.x - pw / 2,
                                    sy = movePos.y - ph / 2;

                                // 셀렉터에 대한 css를 변경한다.
                                parent.css({
                                    left: sx - 5,
                                    top: sy - 5
                                });

                                typeof dndOpt.onMove === "function" && dndOpt.onMove(self.getShape(null, targetId), sx, sy);

                                // 객체를 선택하고, 변경 값에 따른 오브젝트를 변경한다.
                                self.modifyShape({
                                    left: sx,
                                    top: sy,
                                    id: targetId
                                }, function () {
                                    // layer를 다시 그린다.
                                    self.drawLayer();
                                });
                            });

                            // 드래그 종료
                            self.controlBase.one(Event.DRAW_END, function (ev) {
                                ev.stopPropagation();
                                // 드래그 엔드에 대한 포지션 추출
                                var endPos = self.getBoundingPosition(ev),
                                    sx = endPos.x - pw / 2,
                                    sy = endPos.y - ph / 2;

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
                                }, function () {
                                    // layer를 다시 그린다.
                                    self.drawLayer();
                                    self.controlHandler(resizeOpt, dndOpt);
                                    typeof dndOpt.onEnd === "function" && dndOpt.onEnd(self.getShape(null, targetId), sx, sy);
                                });
                            });
                        })();
                    }
                });
            },
            writable: true,
            configurable: true
        },
        linkMove: {

            /**
             * 연결 정보를 이동 시킨다.
             * @memberof Layer
             * @function linkMove
             * @param {Object} target target
             * @param {Function} callback 호출 후 callback function
             */
            value: function linkMove(target, callback) {
                var self = this;

                for (var idx = 0; idx < this._linkInfo.length; idx++) {
                    var link = self._linkInfo[idx],
                        linkObj = link.obj,
                        type = null,
                        x = target.posx + target.width / 2,
                        y = target.posy + target.height / 2;

                    // targetId가 동일한 경우
                    if (link.targetId === target.id) {
                        type = "start";
                    }

                    if (link.linkId === target.id) {
                        type = "end";
                    }

                    linkObj.modifyPosition(type, x, y);
                }


                typeof callback == "function" && callback();
            },
            writable: true,
            configurable: true
        },
        modifyShape: {

            /**
             * 형태를 변경한다.
             * @memberof Layer
             * @function modifyShape
             * @param {Object} opt option object
             * @param {Function} callback 형태 변경 한 후의 callback function
             */
            value: function modifyShape(opt, callback) {
                var self = this;
                var list = this._selectedShape;

                if (list.length > 0) {
                    for (var idx = 0; idx < list.length; idx++) {
                        (function (idx) {
                            var shape = list[idx];

                            if (shape.id == opt.id) {
                                // 형태 변경
                                shape.modifyShape(opt, function () {
                                    self.linkMove(shape, function () {
                                        typeof callback == "function" && callback();
                                    });
                                });
                            }
                        })(idx);
                    }
                }
            },
            writable: true,
            configurable: true
        },
        unselectShapeAll: {

            /**
             * 선택된 모든 shape들을 해체 상태로 놓는다.
             * @memberof Layer
             * @function unselectShapeAll
             */
            value: function unselectShapeAll() {
                var list = this._selectedShape;

                for (var idx = 0; idx < list.length; idx++) {
                    var shape = list[idx];
                    shape.unSelect();
                }

                this.drawLayer();
            },
            writable: true,
            configurable: true
        },
        addObj: {

            /**
             * 오브젝트를 추가한다.
             * @memberof Layer
             * @function addObj
             * @param {Object} position 위치 객체
             * @param {Object} opt 옵션 객체
             * @param {Function} callback callback function
             */
            value: function addObj(position, section, opt, callback) {
                var option = Object.assign({}, opt);

                if (!this._group[section.id]) {
                    this._group[section.id] = {
                        name: section.name || section.id,
                        show: true,
                        items: {}
                    };
                }

                if (!option.id) {
                    this._uniqueId++;
                    option.id = section.id + "-" + this._uniqueId;
                }

                if (option.type === "image") {
                    var image = new Image();

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

                if (!this._group[section.id].items[option.id]) {
                    this._group[section.id].items[option.id] = option;
                    this.drawLayer(callback);
                }
            },
            writable: true,
            configurable: true
        },
        addPolygon: {

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
            value: function addPolygon(polygon, pathArr, groupId, opt, callback) {
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

                shapeOpt.type = "polygon";

                // obj id
                var objId = null;
                // unique id make     
                if (!shapeOpt.id) {
                    this._uniqueId++;
                    objId = groupId + "_" + this._uniqueId;
                } else {
                    objId = shapeOpt.id;
                }

                // name make
                var objName = null;
                if (!shapeOpt.name) {
                    objName = "unnamed";
                } else {
                    objName = shapeOpt.name;
                }

                var objInfo = this.getObjPolygonInfo(pathArr, shapeOpt);

                // shape option 바인딩
                for (var key in shapeOpt) {
                    objInfo[key] = shapeOpt[key];
                }

                // type 추가
                objInfo.type = "polygon";
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
                if (!this._group[groupId].items[objId]) {
                    this._group[groupId].items[objId] = objInfo;
                    this.drawLayer(callback);
                } else {
                    throw "object is duplicated in this group";
                }
            },
            writable: true,
            configurable: true
        },
        getShape: {

            /**
             * shape 정보를 조회한다.
             * @memberof Layer
             * @function getShape
             * @param {String} separatorName separator 이름
             * @param {String} shapeId shape id
             * @return {Object} obj 조회될 object
             */
            value: function getShape(groupId, shapeId) {
                var obj = null;

                // group이 있는 경우
                if (this._group) {
                    if (groupId != void 0) {
                        // separatorName에 해당하는 group이 있는 경우
                        if (this._group[groupId]) {
                            var targetGroup = this._group[groupId].items;

                            for (var id in targetGroup) {
                                var shape = targetGroup[id];

                                if (id === shapeId) {
                                    obj = shape;
                                }
                            }
                        }
                    } else {
                        var shapeArr = [];
                        // group id가 없는 경우 object를 돌며 확인한다.
                        for (var _id in this._group) {
                            var group = this._group[_id];

                            for (var sid in group.items) {
                                var shape = group.items[sid];

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
            },
            writable: true,
            configurable: true
        },
        addGroup: {

            /**
             * add group
             * @param {Object} item      add object
             * @param {String} groupName group id
             */
            value: function addGroup(item, groupOpt) {
                var groupId = groupOpt.id,
                    groupName = groupOpt.name;

                if (!this._group[groupId]) {
                    this._group[groupId] = {
                        name: groupName ? groupName : groupId, // group name 있는지 여부에 따라 바인딩
                        show: true,
                        items: {}
                    };
                }

                if (!this._group[groupId].items[item.id]) {
                    if (!item.layer || JSON.stringify(item.layer) == "{}") {
                        item.layer = this.layerObj;
                    }

                    if (!item.controlBase || JSON.stringify(item.controlBase) == "{}") {
                        item.controlBase = this.controlBase;
                    }

                    this._group[groupId].items[item.id] = item;
                    return true;
                } else {
                    return false;
                    throw "object is duplicated in this group";
                }
            },
            writable: true,
            configurable: true
        },
        deleteGroup: {

            /**
             * group 및 관련된 데이터를 전체 삭제한다.
             * @param {String} groupId group id
             * @param {Function} callback callback function
             */
            value: function deleteGroup(groupId, callback) {
                if (this._group[groupId]) {
                    delete this._group[groupId];
                }

                // layer 그리고 난 후 callback 트리거
                this.drawLayer(function () {
                    typeof callback == "function" && callback();
                });
            },
            writable: true,
            configurable: true
        },
        drawLink: {

            /**
             * link를 그린다.
             * @memberof Layer
             * @function drawLink
             * @param {Function} callback 그리고 난 후 callback function
             */
            value: function drawLink(callback) {
                var self = this;
                var ctx = this.layerObj.getContext("2d");

                for (var idx = 0; idx < this._linkInfo.length; idx++) {
                    var link = self._linkInfo[idx];

                    if (!link.obj) {
                        link.obj = new Link(link);
                    }

                    var line = link.obj;

                    line.render(ctx);
                }

                typeof callback == "function" && callback();
            },
            writable: true,
            configurable: true
        },
        drawLayer: {

            /**
             * draw layer
             * @memberof Layer
             * @function drawLayer
             * @param  {Function} callback callback after draw layer object
             */
            value: function drawLayer(callback) {
                var self = this,
                    ctx = self.layerObj.getContext("2d"),
                    width = this.width,
                    height = this.height;

                // clear rect
                ctx.clearRect(0, 0, width, height);

                for (var idx = 0; idx < this._linkInfo.length; idx++) {
                    var link = self._linkInfo[idx];

                    if (!link.obj) {
                        link.obj = new Link(link);
                    }

                    var line = link.obj;

                    line.render(ctx);
                }


                // shape 정보 그리기
                for (var id in this._group) {
                    (function () {
                        var group = self._group[id].items;

                        // group에서 show property가 true인 경우에만 렌더링
                        if (self._group[id].show) {
                            for (id in group) {
                                (function () {
                                    var shape = group[id];

                                    switch (shape.type) {
                                        case "polygon":
                                            if (!shape.obj) {
                                                shape.obj = new Polygon(shape, ctx);
                                            }

                                            // obj 추출
                                            var polygon = shape.obj;

                                            polygon.render(ctx);
                                            break;
                                        case "image":
                                            if (!shape.obj) {
                                                shape.obj = new ImageShape(shape, ctx, true);
                                            } else {
                                                var image = shape.obj;

                                                image.render(ctx);
                                            }
                                            break;
                                    }
                                })();
                            }
                        }
                    })();
                }

                typeof callback == "function" && callback();
            },
            writable: true,
            configurable: true
        },
        editPolygon: {

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
            value: function editPolygon(polygon, pathArr, opt, isEnd, isFinish, callback) {
                var self = this;

                this.drawLayer(function () {
                    switch (self.type) {
                        case "canvas":
                            self.drawCanvasPolygon(pathArr, opt, isEnd, isFinish, callback);
                            break;
                        case "svg":
                            break;
                    }
                });
            },
            writable: true,
            configurable: true
        },
        drawShape: {

            /**
             * 오브젝트를 레이어에 그린다.
             * @memberof Layer
             * @function drawObj
             * @param {Object} position 포지션
             * @param {Object} option 오브젝트 옵션
             */
            value: function drawShape(position, option) {
                var self = this;
                this.drawLayer(function () {
                    switch (self.type) {
                        case "canvas":
                            self.drawCanvasObj(position, option);
                            break;
                        case "svg":
                            break;
                    }
                });
            },
            writable: true,
            configurable: true
        },
        drawCanvasObj: {

            /**
             * 레이어에 오브젝트를 그린다.
             * @memberof Layer
             * @function drawCanvasObj
             * @param {Object} position 포지션 객체
             * @param {Object} option 옵션 객체
             */
            value: function drawCanvasObj(position, option) {
                var self = this,
                    layerCanvas = this.layerObj,
                    ctx = layerCanvas.getContext("2d");

                // option type에 따라 분기 처리
                switch (option.type) {
                    case "image":
                        // 이미지인 경우
                        // 현재 설정되어 있는 이미지가 option url이 아닌 경우
                        if (self.imageUrl != option.url) {
                            (function () {
                                self.image = null;

                                var image = new Image();

                                image.onload = function () {
                                    console.log("image onload");
                                    ctx.drawImage(image, position.x, position.y, option.width || 25, option.height || 25);
                                };

                                image.onerror = function (e) {
                                    console.log("e");
                                };

                                image.src = option.url;

                                self.image = image;
                                self.imageUrl = option.url;
                            })();
                        } else {
                            ctx.drawImage(self.image, position.x, position.y, option.width || 25, option.height || 25);
                        }
                        break;
                    case "shape":
                        break;
                }
            },
            writable: true,
            configurable: true
        },
        drawCanvasPolygon: {

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
            value: function drawCanvasPolygon(pathArr, opt, isEnd, isFinish, callback) {
                var self = this,
                    ctx = this.layerObj.getContext("2d");

                if (self._prevData) {
                    ctx.putImageData(self._prevData, 0, 0);
                }

                // set stroke style
                ctx.strokeStyle = opt ? opt.stroke || "#000000" : "#000000";

                // set begin path
                ctx.beginPath();

                // path loop move adn line to
                for (var idx = 0; idx < pathArr.length; idx++) {
                    var pos = pathArr[idx];
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

                    var fillStyle = null;
                    if (opt) {
                        if (opt.fill) {
                            fillStyle = Color.isHex(opt.fill) ? Color.hexToRgba(opt.fill || "#bdbdbd") : opt.fill;
                        } else {
                            fillStyle = Color.hexToRgba("#bdbdbd");
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
                        var pos = pathArr[idx];

                        self.drawCanvasPolygonHandler(ctx, pos);
                    }
                }

                if (isFinish) {
                    ctx.save();
                    typeof callback == "function" && callback();
                }
            },
            writable: true,
            configurable: true
        },
        drawCanvasPolygonHandler: {

            /**
             * draw canvas handler for polygon
             * @param  {Object} ctx context 2d object
             * @param  {Object} pos position object
             */
            value: function drawCanvasPolygonHandler(ctx, pos) {
                // draw arc
                ctx.beginPath();
                ctx.fillStyle = "#000000";
                ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
                // close path
            },
            writable: true,
            configurable: true
        },
        copyCanvasImageData: {

            /**
             * copy canvas image data
             * @memberof Layer
             * @function copyCanvasImageData
             */
            value: function copyCanvasImageData(callback) {
                var layer = this.layerObj,
                    ctx = layer.getContext("2d");

                this._prevData = ctx.getImageData(0, 0, this.width, this.height);

                typeof callback == "function" && callback();
            },
            writable: true,
            configurable: true
        },
        getObjPolygonInfo: {

            /**
             * get canvas path info
             * @memberof Layer
             * @function getObjPolygonInfo
             * @param  {Array} pathArr path array
             */
            value: function getObjPolygonInfo(pathArr) {
                var posxArr = [],
                    posyArr = [];

                // posx, posy making array
                for (var idx = 0; idx < pathArr.length; idx++) {
                    posxArr.push(pathArr[idx].x);
                    posyArr.push(pathArr[idx].y);
                }

                var minx = Math.min.apply(Math, posxArr),
                    // x 최소값
                maxx = Math.max.apply(Math, posxArr),
                    // x 최대값
                miny = Math.min.apply(Math, posyArr),
                    // y 최소값
                maxy = Math.max.apply(Math, posyArr),
                    // y 최대값
                width = Math.abs(maxx - minx),
                    height = Math.abs(maxy - miny);

                var returnObj = {
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
            },
            writable: true,
            configurable: true
        },
        getLayerPosition: {

            /**
             * layer내의 위치를 반환한다.
             * @memberof Layer
             * @function getLayerPosition
             * @param {Object} ev event
             */
            value: function getLayerPosition(ev) {
                var layerPosX = ev.offsetX,
                    layerPosY = ev.offsetY;

                return {
                    x: parseInt(layerPosX),
                    y: parseInt(layerPosY)
                };
            },
            writable: true,
            configurable: true
        },
        destroy: {

            /**
             * 페이지 이동 등, flaats 내에서 layer에 대한 모든 객체를 초기화 하기 위한 소멸자 함수
             * @memberof Layer
             * @function destroy
             */
            value: function destroy() {
                var self = this;

                for (var groupId in this._group) {
                    var group = self._group[groupId];

                    for (var shapeId in group.items) {
                        var shape = group.items[shapeId];

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
            },
            writable: true,
            configurable: true
        }
    });

    return Layer;
})();

module.exports = Layer;

},{"./color":2,"./element/canvas/Image":4,"./element/canvas/Link":5,"./element/canvas/polygon":6,"./events":7}],10:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// import Event from './events';

var dragbox = $("<div class=\"selector-handler\" style=\"position:absolute;top:0;left:0;width:0;height:0;opacity:0.4;z-index:9999;border:1px solid black;background-color:black;\"></div>"),
    initX = 0,
    initY = 0;

/**
 * selector class
 * @name  Selector
 * @version  0.1.0
 * @author  trustyoo86@linkit.kr
 */
var Selector = (function () {
  function Selector() {
    _classCallCheck(this, Selector);

    this.enable = false; // enable selector
  }

  _prototypeProperties(Selector, null, {
    init: {

      /**
       * initialize
       * @memberof Selector
       * @function init
       */
      value: function init() {
        this.enable = false;
        dragbox.remove();
        dragbox = $("<div class=\"selector-handler\" style=\"position:absolute;top:0;left:0;width:0;height:0;opacity:0.4;z-index:9999;border:1px solid black;background-color:black;\"></div>");
      },
      writable: true,
      configurable: true
    },
    start: {

      /**
       * selector start
       * @memberof Selector
       * @function start
       * @param  {Object}   target   target object
       * @param  {Object}   ev        event object
       * @param  {Function} callback [description]
       */
      value: function start(targetDiv, target, ev, callback) {
        if (!this.enable) {
          return;
        }

        var boundingBox = null,
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
          display: "none"
        });

        typeof callback == "function" && callback(initX, initY);

        targetDiv.append(dragbox);
      },
      writable: true,
      configurable: true
    },
    draw: {

      /**
       * selector draw
       * @memberof Selector
       * @function draw
       * @param  {Object}   ev        event object
       * @param  {Function} callback callback function after draw
       */
      value: function draw(target, ev, callback) {
        if (!this.enable) {
          return;
        }

        var boundingBox = null,
            x = null,
            y = null;

        boundingBox = target.getBoundingClientRect();
        x = (ev.clientX - boundingBox.left) * (target.width / boundingBox.width);
        y = (ev.clientY - boundingBox.top) * (target.height / boundingBox.height);

        var posX = Math.min(x, initX),
            posY = Math.min(y, initY),
            boxW = Math.abs(x - initX),
            boxH = Math.abs(y - initY);

        dragbox.css({
          top: posY,
          left: posX,
          width: boxW,
          height: boxH,
          display: "block"
        });

        typeof callback == "function" && callback(posY, posX, boxW, boxH);
      },
      writable: true,
      configurable: true
    },
    end: {

      /**
       * selector drag end
       * @memberof Selector
       * @function end
       * @param  {Function} callback callback function after drag end
       */
      value: function end(target, ev, callback) {
        if (!this.enable) {
          return;
        }

        var boundingBox = null,
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
        var style = dragbox[0].style,
            w = parseInt(style.width),
            h = parseInt(style.height);

        dragbox.remove();

        typeof callback == "function" && callback(x, y, w, h);
      },
      writable: true,
      configurable: true
    }
  });

  return Selector;
})();

module.exports = Selector;

},{}]},{},[8])

//# sourceMappingURL=flaats.js.map
