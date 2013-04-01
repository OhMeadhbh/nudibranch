// Copyright (c) 2013 Meadhbh S. Hamrick, All Rights Reserved
// License info at https://raw.github.com/OhMeadhbh/nudibranch/master/LICENSE

( function () {

  function ANSITerminal( options ) {
    TerminalFB.apply( this, [ options ] );
  }

  ANSITerminal.prototype = new TerminalFB();

  ANSITerminal.prototype.registerApp = function ( app ) {
    this.app = app;
    document.onkeypress = function( e ) {
      if( 8 != e.which  || 32 != e.which ) {
        app.keypress( e.which );
      }
    };
    document.onkeydown = function( e ) {
      if( 8 == e.which || 32 == e.which ) {
        app.keypress( e.which );
        e.preventDefault();
      }
    };
  };

  ANSITerminal.prototype.print = function ( text ) {
    var start = 0;
    for( var i = 0, il = text.length; i < il; i++ ) {
      switch( text.charCodeAt( i ) ) {
      case 10:
        TerminalFB.prototype.print.apply( this, [ text.substring( start, i ) ] );
        this.down();
        if( 0 == this.cursorpos[1] ) {
          this.scroll();
          this.cursorpos[1] = this.viewport_extent[1] - 1;
          var local_pos = [this.cursorpos[0],this.cursorpos[1]];
          var local_attr = this.defaultattr;
          this.defaultattr = TerminalFB._ATTR_NONE;
          for( var j = 0, jl = this.viewport_extent[0]; j < jl; j++ ) {
            this.gotoxy([j,this.viewport_extent[1]-1]);
            this.write(' ');
          }
          this.cursorpos = local_pos;
          this.defaultattr = local_attr;
        }
        start = i+1;
        break;
      case 13:
        TerminalFB.prototype.print.apply( this, [ text.substring( start, i ) ] );

        this.gotoxy( [ 0, this.cursorpos[1] ] );
        start = i+1;
        break;
      default:
        break;
      }
    }
    TerminalFB.prototype.print.apply( this, [ text.substring( start, text.length ) ] );
    this.update();
  };

  if( window ) {
    window.ANSITerminal = ANSITerminal;
  } else if( module && module.exports ) {
    module.exports.ANSITerminal = ANSITerminal;
  }

} ) ();