# Ruby Grammars

We use the Jeff Hykin's
[ruby_grammar_builder](https://github.com/jeff-hykin/ruby_grammar_builder) to
build all of the VSCode/TextMate grammars we *maintain*.

To re-build these grammars yourself, you will need to install both
[Ruby](https://www.ruby-lang.org/en/) and then the [ruby_grammar_builder
gem](https://rubygems.org/gems/ruby_grammar_builder). See these two links for
details on how to install these tools.

Once these tools have been installed to actually (re)compile the gramamrs simply
type:

```
  ./lpil-grammar
```

## Resources

For **local ruby_grammar_builder documentation** type:

```
  gem server -b localhost
```

The "standard" format for **scope selectors** can be found in section 12.4 of
[Textmate Language Grammars](https://macromates.com/manual/en/language_grammars)

Two good guides to writing Textmate Grammars are:

  - [A guide to writing a language grammar (TextMate) in
    Atom](https://gist.github.com/Aerijo/b8c82d647db783187804e86fa0a604a1)

  - [Writing a TextMate Grammar: Some Lessons
    Learned](https://www.apeth.com/nonblog/stories/textmatebundle.html)

The **[oniguruma](https://github.com/kkos/oniguruma) regular expression
[syntax](https://github.com/kkos/oniguruma/blob/master/doc/RE)**

## Converting existing grammars to Ruby Grammar format...

The very crude tool `plist2rbGrammar` in the `OriginalGrammars` directory can be
used to translate an existing grammar (in PList format) into a *rough*
approximation of a Ruby Grammar. Unfortunately any Ruby Grammar created using
the `plist2rbGrammar` tool WILL need editing!

At the moment the only existing grammars we have converted are:

  - `context.tmLanguage` (from the `OriginalGrammars` directory)
