
import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { DocumentStructure } from "./documentStructure.js"

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

  structures.newStructure('docStruct', new DocumentStructure())

  scopeActions.addScopedAction(
    'keyword.control.structure.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("latex input component")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      if (theDoc) {
        var theFilePath = theTokens[1]
        if (theFilePath.endsWith('.tex') || theFilePath.endsWith('.sty')) {
          // don't do anything
        } else {
          theFilePath += '.tex'
        }
        const docStruct = <DocumentStructure>structures.getStructure('docStruct')
        docStruct.addFile(
          theDoc.docName,
          theFilePath
        )
      }
    }
  )

scopeActions.addScopedAction(
  'keyword.control.matter.lpil',
  import.meta.url,
  async function(
    thisScope : string,
    theScope  : string,
    theTokens : string[],
    theLine   : number,
    theDoc    : Document | undefined
  ) {
    logger.debug("----------------------------------------------------------")
    logger.debug("latex matter command")
    logger.trace(`   thisScope: ${thisScope}`)
    logger.trace(`    theScope: ${theScope}`)
    logger.debug(`   theTokens: ${theTokens[0].slice(1)}`)
    logger.trace(`     theLine: ${theLine}`)
    if (theDoc) logger.trace(`      theDoc: ${theDoc.docName}`)
    logger.debug("----------------------------------------------------------")
    if (theDoc) {
      const docStruct = <DocumentStructure>structures.getStructure('docStruct')
      docStruct.addSection(
        theDoc.docName,
        theTokens[0].slice(1),
        'theDoc',
        'shortTitle',
        'theTitle'
        )
      }
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.sections.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      var secType    = theTokens[0]
      secType        = secType.slice(5, secType.length-1).toLowerCase()
      var refID      = theTokens[1]
      var shortTitle = theTokens[3]
      var title      = shortTitle
      if (5 < theTokens.length) title = theTokens[5]
      logger.debug("----------------------------------------------------------")
      logger.debug("latex section command")
      logger.trace(`   thisScope: ${thisScope}`)
      logger.trace(`    theScope: ${theScope}`)
      logger.debug(`   theTokens: ${theTokens}`)
      logger.debug(`     secType: ${secType}`)
      logger.debug(`       refID: ${refID}`)
      logger.debug(`  shortTitle: ${shortTitle}`)
      logger.debug(`       title: ${title}`)
      logger.trace(`     theLine: ${theLine}`)
      if (theDoc) logger.trace(`      theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      if (theDoc) {
        const docStruct = <DocumentStructure>structures.getStructure('docStruct')
        docStruct.addSection(
          theDoc.docName,
          secType,
          refID,
          shortTitle,
          title
        )
      }
    }
  )
 
/*
keyword.control.abstract.start.lpil
keyword.control.abstract.stop.lpil
keyword.control.bibliography.lpil
keyword.control.printIndex.lpil
'keyword.control.cite.lpil',
*/
  scopeActions.addScopedAction(
    'keyword.control.defineIndex.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      var refID = theTokens[1]
      var words = refID
      if (3 < theTokens.length) words = theTokens[3]
      logger.debug("----------------------------------------------------------")
      logger.debug("latex labels command")
      logger.trace(`   thisScope: ${thisScope}`)
      logger.trace(`    theScope: ${theScope}`)
      logger.debug(`   theTokens: ${theTokens}`)
      logger.debug(`       refID: ${refID}`)
      logger.debug(`       words: ${words}`)
      logger.trace(`     theLine: ${theLine}`)
      if (theDoc) logger.trace(`      theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      if (theDoc) {
        const docStruct = <DocumentStructure>structures.getStructure('docStruct')
        docStruct.addLabel(
          theDoc.docName,
          words
        )
      }
    }
  )

  scopeActions.addScopedAction(
    'finalize.document.structure',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.debug("finalize Document Structure")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const docStruct = <DocumentStructure>structures.getStructure('docStruct')
      await docStruct.finalize(config)
    }
  )

}