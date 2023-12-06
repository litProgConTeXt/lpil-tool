# LPiL tool scripts

## LPiL Magic Runner

This simple (single file) Python script takes two arguments:

    1. a (manditory) TeX/LaTeX/ConTeXt/Metafun file to be typeset

    2. an (optional) output directory (in which to save the typeset output)

This script looks for TeX-Magic comments in the top of the file to be typeset
which describe how to typeset the file.

This script understands the following TeX-Magic comments:

  - `% !TEX program = <<aProgram>>`
  - `% !LPiL preamble = <<aPreambleFile>>`
  - `% !LPiL postamble = <<aPostambleFile>>`

The `program` magic comment specifies which "program" to use to typeset the
given document. This "program" must be one which the `lpilMagicRunner` script
knows how to typeset.

At the moment the `lpilMagicRunner` script understands the following "programs":

  - `cmScan` (our own [diSimplex Citation
    Manager](https://github.com/diSimplex/citationManager))

  - `metafun` (essentially [ConTeXt](https://wiki.contextgarden.net/Main_Page)
    running its associated
    [MetaFun](https://wiki.contextgarden.net/MetaFun_-_MetaPost_in_ConTeXt)
    package -- the output of which is converted to
    [eps](https://en.wikipedia.org/wiki/Encapsulated_PostScript) using
    `pdftops`)

  - `lualatex` (the [LuaLaTeX](https://www.luatex.org//) tool required by the
    [lpil-latex](https://github.com/litProgLaTeX/lpil-latex) style.)

  - `pygments` (the [Pygments](https://pygments.org/) code syntax
    highlighter)

The `preamble` and `postamble` magic comments specify LaTeX fragments to be
typeset immediately before or after the given `lualatex` document. This allows
the LPiL Magic Runner to fabricate complete LaTeX documents out of component
parts. This allows small parts of a very much larger document to be developed
more quickly in separation, using for example VSCode's LaTeX-Workshop.

To make use of the `lpilMagicRunner` tool, simply copy it into a directory in
your `$PATH`.
