
require "ruby_grammar_builder"

module GPatterns 

  SimpleArg = Pattern.new(/[\[\(\{]/)
    .then(Pattern.new(
      match: /\S+/,
      tag_as: "keyword.control.simple.arg"
    )).then(/[\]\)\}]/)

end