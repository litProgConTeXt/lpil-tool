
import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import {CodeTypes, DocCodeChunks } from "./codeStructures.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
const logger : ValidLogger = Logging.getLogger('lpil')

export function registerActions(
  config        : BuildConfig,
  builders      : Builders,
  documentCache : DocumentCache,
  grammars      : Grammars,
  scopeActions  : ScopeActions,
  structures    : Structures,
  logger        : ValidLogger
) {

  structures.newStructure('codeTypes', new CodeTypes())
  structures.newStructure('code',      new DocCodeChunks())

  scopeActions.addScopedAction(
    'keyword.control.newcodetype.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      const codeOptions = theTokens[3]
      logger.debug("----------------------------------------------------------")
      logger.debug("newCodeType")
      logger.trace(`   thisScope: ${thisScope}`)
      logger.trace(`    theScope: ${theScope}`)
      logger.debug(`    codeType: ${codeType}`)
      logger.debug(` codeOptions: ${codeOptions}`)
      logger.debug(`   theTokens: ${theTokens}`)
      logger.trace(`     theLine: ${theLine}`)
      if (theDoc) logger.trace(`      theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const codeTypes = <CodeTypes>structures.getStructure('codeTypes')
      if (theDoc) 
        codeTypes.addCodeType(codeType, codeOptions)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.source.start.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      const codeName = theTokens[3]
      logger.debug("----------------------------------------------------------")
      logger.debug("startCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.debug(` codeType: ${codeType}`)
      logger.debug(` codeName: ${codeName}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const code = <DocCodeChunks>structures.getStructure('code')
      if (theDoc) 
        code.startCodeFor(theDoc.docName, codeType, codeName, theLine)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.source.stop.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const codeType = theTokens[1]
      logger.debug("----------------------------------------------------------")
      logger.debug("stopCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.debug(` codeType: ${codeType}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------") 
      const code = <DocCodeChunks>structures.getStructure('code')
      if (theDoc) 
        code.stopCodeFor(theDoc.docName, codeType, theLine, theDoc.docLines)
    }
  )

  scopeActions.addScopedAction(
    'finalize.control.source',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("finalizeCode")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const code = <DocCodeChunks>structures.getStructure('code')
      await code.finalize(config)
    }
  )

}