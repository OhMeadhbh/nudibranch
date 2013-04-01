( function () {
  // Convenience Functions
  function _oneOrOther( one, other ) {
    for( var key in other ) {
      this[ key ] = one[ key ] ? one[ key ] : other[ key ];
    }
  }

  // Terminal Frame Buffer
  var TerminalFB_defaults = {
    viewport_extent: [ 80, 24 ],
    buffer_extent: [ 80, 24 ],
    el: 'terminal',
    color: '#00FF00',
    bg: '#000000',
    char_extent: [ 8, 14 ],
    char_offset: [ 0, -3 ],
    font: '14px monospace'
  };

  function TerminalFB( options ) {
    if( options ) {
      var supported = [ 'viewport_extent', 'buffer_extent', 'el', 'color', 'bg', 'char_extent', 'char_offset', 'font' ];
      _oneOrOther.apply( this, [ options, TerminalFB_defaults ] );
      this.buffer_size = this.buffer_extent[0] * this.buffer_extent[1];
      this.buffer = new Uint8Array( this.buffer_size );
      this.attrbuf = new Uint8Array( this.buffer_size );
      this.context = document.getElementById( this.el ).getContext('2d');
      this.reset();
    }
  }

  TerminalFB._ATTR_NONE = 0;
  TerminalFB._ATTR_BOLD = 0x80;
  TerminalFB._ATTR_UNDERLINE = 0x40;
  TerminalFB._ATTR_ITALIC = 0x20;
  TerminalFB._ATTR_INVERSE = 0x10;

  // Clears the buffers, resets the cursor position and default attribute
  TerminalFB.prototype.reset = function () {
    this.showcursor = true;
    this.cursorpos = [0,0];
    this.offset = [0,0];
    this.defaultattr = TerminalFB._ATTR_NONE;
    for( var i = 0, il = this.buffer.length; i < il; i++ ) {
      this.buffer[i] = 0x20;
      this.attrbuf[i] = 0;
    }
  }

  // Positions the cursor within the viewport
  TerminalFB.prototype.gotoxy = function( point ) {
    function _justify ( value, extent ) {
      var rv = value % extent;
      if( rv < 0 ) { rv = rv + extent; }
      return rv;
    }
    this.cursorpos[0] = _justify( point[0], this.viewport_extent[0] );
    this.cursorpos[1] = _justify( point[1], this.viewport_extent[1] );
  };

  // Writes text to the buffer and updates cursor position
  TerminalFB.prototype.print = function( text, position, bounds ) {
    var cursor_moved = _print_write.apply( this, [ text, position, bounds ] );
    this.cursorpos[0] += cursor_moved[0];
    this.cursorpos[1] += cursor_moved[1];
    if( this.cursorpos[0] > this.viewport_extent[0] ) {
      this.cursorpos[1] ++;
      this.cursorpos[0] -= this.viewport_extent[0];
    }
    if( this.cursorpos[1] >= this.viewport_extent[1] ) {
      var lines = this.viewport_extent[1] - this.cursorpos[1] + 1;
      this.offset[1] += lines;
      if( this.offset[1] >= this.buffer_extent[1] ) {
        this.offset[1] = 0;
      }
    }
  };

  // Writes text to the buffer, but doesn't update cursor position
  TerminalFB.prototype.write = function( text, position, bounds ) {
    _print_write.apply( this, [ text, position, bounds ] );
  };

  // Used by .write() and .print(), writes a string into the buffer
  function _print_write( text, position, bounds ) {
    if( ! position ) { position = this.cursorpos; }
    if( ! bounds ) { bounds = this.viewport_extent; };
    for( var c = 0, i = 0, il = text.length; i < il; i += bounds[0], c++ ) {
      var text_array = text
        .substring(i,((i+bounds[0])>text.length?text.length-i:bounds[0]))
        .split('')
        .map( function( i ){ return i.charCodeAt(0); } );

      var offset = ( ( c + position[1] + this.offset[1] ) * this.buffer_extent[0] + position[0] ) % this.buffer_size;
      this.buffer.set( text_array, offset );
      for( var j = 0, jl = text_array.length; j < jl; j++ ) {
        this.attrbuf[ offset + j ] = this.defaultattr;
      }
    }
    return( [text.length % bounds[0], (text.length / bounds[0])|0] );
  }

  // Sets the default attribute (bold, inverse, etc.)
  TerminalFB.prototype.attr = function ( newattr ) {
    this.defaultattr = newattr;
  };

  // Move n characters to the right. negative values go left
  TerminalFB.prototype.right = function () {
    if( ! count ) { count = 1; }
    this.cursorpos[0] = ( this.cursorpos[0] + count );
    while( this.cursorpos[0] > this.viewport_extent[0] ) {
      this.down();
      this.cursorpos[0] -= this.viewport_extent[0];
    }
  };

  // Move n rows down. negative values go up
  TerminalFB.prototype.down = function ( count ) {
    if( ! count ) { count = 1; }
    this.cursorpos[1] = ( this.cursorpos[1] + count ) % this.viewport_extent[1];
    if( this.cursorpos[1] < 0 ) {
      this.cursorpos[1] += this.viewport_extent[1];
    }
  };

  // Scroll n lines down. negative values scroll up
  TerminalFB.prototype.scroll = function ( count ) {
    if( ! count ) { count = 1; }
    this.offset[1] = ( this.offset[1] + count ) % this.viewport_extent[1];
    if( this.offset[1] < 0 ) {
      this.offset[1] = this.offset[1] + this.viewport_extent[1];
    }
  };

  var mask = TerminalFB._ATTR_INVERSE | TerminalFB._ATTR_UNDERLINE;

  TerminalFB.prototype.update = function() {
    var start, atext, astart, alast, text, c;

    for( var i = 0, il = this.viewport_extent[1]; i < il; i++ ) {
      start = ( (i + this.offset[1]) * this.buffer_extent[0] + this.offset[0] ) % this.buffer_size;
      atext = this.attrbuf.subarray( start, start + this.viewport_extent[0] );
      astart = 0;
      alast = atext[0] & mask;

      for( j = 1, jl = this.viewport_extent[0]; j < jl; j++ ) {
        if( ( ( atext[j] & mask ) != alast ) || _cursoring.apply( this, [ j, i ]) ) {
          _draw_attribute_line.apply( this, [ astart, i, j - astart, alast, _cursor.apply( this, [ j,i ] ) ] );
          astart = j;
          alast = atext[j] & mask;
        }
      }
      _draw_attribute_line.apply( this, [ astart, i, j - astart, alast ] );
    }

    function _draw_attribute_line( x, y, width, attr, cursor ) {
      if( cursor ) {
        this.context.fillStyle = ((attr&TerminalFB._ATTR_INVERSE)==0?this.color:this.bg);
      } else {
        this.context.fillStyle = ((attr&TerminalFB._ATTR_INVERSE)==0?this.bg:this.color);
      }
      this.context.fillRect( x * this.char_extent[0], y * this.char_extent[1], width * this.char_extent[0], this.char_extent[1] );
      if( (attr & TerminalFB._ATTR_UNDERLINE ) != 0 ) {
        if( cursor ) {
          this.context.fillStyle = ((attr&TerminalFB._ATTR_INVERSE)==0?this.bg:this.color);
        } else {
          this.context.fillStyle = ((attr&TerminalFB._ATTR_INVERSE)==0?this.color:this.bg);
        }
        this.context.fillRect( x * this.char_extent[0], ( ( y + 1 ) * this.char_extent[1] ) - 2, width * this.char_extent[0], 1 );
      }
    }

    for( var i = 0, il = this.viewport_extent[1]; i < il; i++ ) {
      start = ( (i + this.offset[1]) * this.buffer_extent[0] + this.offset[0] ) % this.buffer_size;
      atext = this.attrbuf.subarray( start, start + this.viewport_extent[0] );
      astart = 0;
      alast = atext[0];
      text = String.fromCharCode.apply( this, this.buffer.subarray( start, start + this.viewport_extent[0] ) );

      for( j = 1, jl = this.viewport_extent[0]; j < jl; j++ ) {
        if( atext[j] != alast ) {
          _draw_text_line.apply( this, [ astart, i, text.substring(astart, j), alast ] );
          astart = j;
          alast = atext[j];
        }
      }
      _draw_text_line.apply( this, [ astart, i, text.substring(astart, j), alast ] );
    }

    function _draw_text_line( x, y, text, attr, cursor ) {
      var style;
      var font = this.font;
      if( ( attr & TerminalFB._ATTR_ITALIC ) != 0 ) {
        font = "italic " + font;
      }
      if( ( attr & TerminalFB._ATTR_BOLD ) != 0 ) {
        font = "bold " + font;
      }
      if( cursor ) {
        style = ((attr&TerminalFB._ATTR_INVERSE)==0?this.bg:this.color);
      } else {
        style = ((attr&TerminalFB._ATTR_INVERSE)==0?this.color:this.bg);
      }
      this.context.font = font;
      this.context.fillStyle = style;
      this.context.fillText( text, x * this.char_extent[0], ( ( y + 1 ) * this.char_extent[1] ) + this.char_offset[1] );
    }

    function _cursoring( x, y ) {
      return this.showcursor &&
        ( ( x == this.cursorpos[0] ) || ( x == ( this.cursorpos[0] + 1 ) ) ) &&
        ( y == this.cursorpos[1] ) ;
    }

    function _cursor( x, y ) {
      return this.showcursor &&
        ( x == ( this.cursorpos[0] + 1 ) ) &&
        ( y == this.cursorpos[1] );
    }

  };

  if( window ) {
    window.TerminalFB = TerminalFB;
  } else if( module && module.exports ) {
    module.exports.TerminalFB = TerminalFB;
  }

} ) ();
