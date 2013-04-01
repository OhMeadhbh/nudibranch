var c80;
var app;
var interval;

function _onload() {
  c80 = new TerminalFB( { el: 'C80' } );

  var start = new Date();  
  c80.print( " This is an example web terminal. It doesn't do much, but it " );
  c80.attr( TerminalFB._ATTR_ITALIC );
  c80.print( "should" );
  c80.attr( TerminalFB._ATTR_NONE );
  c80.print( " give you an" );
  c80.gotoxy([0,1]);
  c80.print( " idea of what you can do with the Nudibranch Web Terminal package." );

  var attributes = {
    'none': TerminalFB._ATTR_NONE,
    'bold': TerminalFB._ATTR_BOLD,
    'underline': TerminalFB._ATTR_UNDERLINE,
    'italic': TerminalFB._ATTR_ITALIC,
    'inverse': TerminalFB._ATTR_INVERSE
  };
  c80.gotoxy( [1,4] );
  c80.print( 'Supported Text Attributes' );

  var line = 0;
  for( var i in attributes ) {
    c80.gotoxy( [2, line + 6] );
    c80.print( '  ' + i );
    c80.gotoxy( [16, line + 6] );
    c80.attr( attributes[ i ] );
    c80.print( 'Now is the winter of our discontent.' );
    c80.attr( TerminalFB._ATTR_NONE );
    line++;
  }

  c80.gotoxy( [1, 12] );
  c80.print( 'And of course, you can mix attributes:' );
  c80.gotoxy( [4, 14] );
  c80.attr( TerminalFB._ATTR_BOLD | TerminalFB._ATTR_UNDERLINE );
  c80.print( 'a. "To be, or not to be. That is the question."' );
  c80.attr( TerminalFB._ATTR_NONE );
  c80.gotoxy( [4, 15] );
  c80.attr( TerminalFB._ATTR_ITALIC | TerminalFB._ATTR_INVERSE );
  c80.print( "b. \"All the world's a stage, and all the men and women merely players.\"" );
  c80.attr( TerminalFB._ATTR_NONE );
  c80.gotoxy( [4, 16] );
  c80.attr( TerminalFB._ATTR_ITALIC | TerminalFB._ATTR_UNDERLINE );
  c80.print( 'c. "If you prick us do we not bleed?"' );
  c80.attr( TerminalFB._ATTR_NONE );
  c80.gotoxy( [4, 17] );
  c80.attr( TerminalFB._ATTR_BOLD | TerminalFB._ATTR_INVERSE );
  c80.print( "d. \"Though this be madness, yet there is method in 't.\"" );
  c80.attr( TerminalFB._ATTR_NONE );
  c80.update();

  var end = new Date();
  console.log( end - start );

  start = new Date();
  app = new ANSITerminal( { el: 'APP' } );
  app.print( "Hello World.\r\n" );
  end = new Date();
  console.log( end - start );

  var i = 1;
  interval = setInterval( function () {
    app.print( "Line " + i + "\r\n");
    i++;
  }, 500 );
}