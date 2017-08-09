/**
 * color info class
 * @name  Color
 * @version  0.1.0
 * @author  trustyoo86@linkit.kr
 */

export default {
  /**
   * is hex
   * @param  {String}  str string
   * @return {Boolean} isHex is hex string
   */
  isHex(str) {
    let isHex = false;

    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(str)){
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
  hexToRgba(hex, opacity) {
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + (opacity || 0.5) + ')';
    } else {
      throw new Error('Bad Hex'); 
    }
  }
}