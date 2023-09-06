# Licenses from open source code reused in this project

## Pygments

The `lpilMagicRunner` makes use of a number of lexers based upon the
[Pygments](https://pygments.org/) collection of lexers.

For example the MetaFunLexer (defined in `./scripts/Lexers.py`) has been
*subclassed* from the Pygments source and extended with a number of the
more heavily used MetaPost/MetaFun keywords.

We have also extracted the `RegexLexer`'s `get_tokens_unprocessed` function to
allow us to write our own `tracing_get_tokens_unprocessed` so we can trace the
"normal" `RegexLexer`'s token processing (in order to help us write our own
Lexer subclassed from `RegexLexer`)

This Pygments code has been used under a BSD License.

-------

Copyright (c) 2006-2022 by the respective authors (see [AUTHORS
file](https://raw.githubusercontent.com/pygments/pygments/master/AUTHORS)). All
rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

--------
