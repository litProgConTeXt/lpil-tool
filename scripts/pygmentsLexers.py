from pygments.lexer import TexLexer
from pygments.token import *

class MetaFunLexer(TexLexer) :
  """
  Lexer for the MetaPost/MetaFun diagram typesetting langauge.
  """

  name = "MetaFun"

  tokens = {
    'root' : [
      inherit,
    ]
  }