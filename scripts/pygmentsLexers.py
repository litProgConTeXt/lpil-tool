from pygments.token import Name, Keyword
from pygments.lexer import RegexLexer, inherit, words
from pygments.lexers.markup import TexLexer
from pygments.token import *

class MetaFunLexer(TexLexer) :
  """
  Lexer for the MetaPost/MetaFun diagram typesetting langauge.
  """

  name = "MetaFun"

  tokens = {
    'root' : [
      (words(('draw', 'drawarrow'), suffix=r'\b'), Keyword),
      inherit,
    ]
  }