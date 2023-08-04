import * as path from "path"

import { BaseConfig as Config    } from "lpil-modules/dist/lib/configBase.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"

const logger : ValidLogger = Logging.getLogger('lpil')

class Components {

  pendingComponents : Set<string> = new Set()
  loadedComponents  : Set<string> = new Set()
  preambleLoaded    : boolean     = false
  postambleLoaded   : boolean     = false

  pending(aComponent : string) {
    this.pendingComponents.add(aComponent)
  }

  getPending() {
    return Array.from(this.pendingComponents.values())
  }

  loaded(aComponent : string) {
    if (this.pendingComponents.has(aComponent)) {
      this.pendingComponents.delete(aComponent)
    }
    this.loadedComponents.add(aComponent)
  }
}

export function registerActions(
  config        : Config,
  builders      : Builders,
  documentCache : DocumentCache,
  grammars      : Grammars,
  scopeActions  : ScopeActions,
  structures    : Structures,
  logger        : ValidLogger
) {

  structures.newStructure('components', new Components())

  scopeActions.addScopedAction(
    'keyword.control.amble.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any
    ) {
      logger.debug("----------------------------------------------------------")
      logger.debug("loadPrePostAmble")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.debug(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      const aDocPath = theTokens[1]
      const components = <Components>structures.getStructure('components')
      // ONLY load the first pre/post amble...
      var loadFile = false
      if (theTokens[0].includes('preamble') && !components.preambleLoaded) {
        loadFile = true
        components.preambleLoaded = true
      }
      if (theTokens[0].includes('postamble') && !components.postambleLoaded) {
        loadFile = true
        components.postambleLoaded = true
      }
      if (loadFile) {
        logger.debug("==========================================================")
        logger.debug(`Loading amble: ${theTokens[1]}`)
        components.loaded(aDocPath)
        await grammars.traceParseOf(aDocPath, config)
        logger.debug(`Loaded amble: ${theTokens[1]}`)
        logger.debug("==========================================================")
        logger.debug("----------------------------------------------------------")
      }
    }
  )

  scopeActions.addScopedAction(
    'initialize.control.structure.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("initializeComponents")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")  
    }
  )

  scopeActions.addScopedAction(
    'run.load.components.lpil',
    import.meta.url,
    async function(
      thisScope :string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("runComponent")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const components = <Components>structures.getStructure('components')
      const mainDocPath = theTokens[0]
      components.pending(mainDocPath)
      
      var someComponents = components.getPending()
      while (0 < someComponents.length) {
        logger.trace(someComponents)
        for (const aDocPath of someComponents) {
          components.loaded(aDocPath)
          await grammars.traceParseOf(aDocPath, config)
        }
        someComponents = components.getPending()
      }
    }
  )

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
      logger.trace("loadComponent")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const components = <Components>structures.getStructure('components')
      var theFilePath = theTokens[1]
      if (theFilePath.endsWith('.tex') || theFilePath.endsWith('.sty')) {
        // don't do anything
      } else {
        theFilePath += '.tex'
      }
      components.pending(theFilePath)
    }
  )

  scopeActions.addScopedAction(
    'finalize.control.structure.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("finalizeComponents")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")  
    }
  )

}