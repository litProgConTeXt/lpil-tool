
require "ruby_grammar_builder"

# QUESTION: How should I deal with optional arguments?

module GPatterns 

  SimpleArg = Pattern.new(/[\[\(\{]/)
    .then(Pattern.new(
      match: /[^\]\)\}]+/,
      tag_as: "keyword.control.simple.arg"
    )).then(/[\]\)\}]/)

end