
import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { Logging, ValidLogger    } from "lpil-modules/dist/lib/logging.js"

import { DocCodeChunks           } from "../actions/codeActions.js"

const logger : ValidLogger = Logging.getLogger('lpil')

export function registerBuilders(
  config        : BuildConfig,
  builders      : Builders,
  documentCache : DocumentCache,
  grammars      : Grammars,
  scopeActions  : ScopeActions,
  structures    : Structures,
  logger        : ValidLogger
) {

  builders.addBuilder(
    'keyword.control.source.start.lpil',
    import.meta.url,
    async function(
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      logger.debug("----------------------------------------------------------")
      logger.debug("startCode")
      logger.debug(` codeType: ${codeType}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.debug(`  theLine: ${theLine}`)
      if (theDoc) logger.debug(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const code = <DocCodeChunks>structures.getStructure('code')
      if (theDoc) code.startCodeFor(theDoc.docName, codeType, "unknown", theLine)
    }
  )

}