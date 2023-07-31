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
  loadedComponents : Set<string>  = new Set()

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
    'initialize.control.structure.context',
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
    'run.load.components.context',
    import.meta.url,
    async function(
      thisScope :string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any) {
      logger.trace("----------------------------------------------------------")
      logger.trace("runComponent")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const components = <Components>structures.getStructure('components')
      for (const aDocPath of theTokens) {
        components.pending(aDocPath)
      }
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
    'keyword.control.structure.context',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any) {
      const components = <Components>structures.getStructure('components')
      components.pending(theTokens[1]+'.tex')
      logger.trace("----------------------------------------------------------")
      logger.trace("loadComponent")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
    }
  )

  scopeActions.addScopedAction(
    'finalize.control.structure.context',
    import.meta.url,
    async function(
      thisScope : string,
      theScope : string,
      theTokens : string[],
      theLine : number,
      theDoc : any) {
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