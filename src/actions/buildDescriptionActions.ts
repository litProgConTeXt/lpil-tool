
import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { ChunkCounters, BuildReqs } from "./buildStructures.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
import { BaseConfig } from "lpil-modules/dist/lib/configBase"

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

  structures.newStructure('chunkCounters', new ChunkCounters())
  structures.newStructure('build',         new BuildReqs())

  scopeActions.addScopedAction(
    'initialize.control.builddescription',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("initialize build descriptions")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      //logger.trace(`  theLine: ${theLine}`)
      //logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const buildInfo = <BuildReqs>structures.getStructure('build')
      buildInfo.initialize(config)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.builddescription.start.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("builddescription-start")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")      
      const buildName = theTokens[1]
      const buildType = theTokens[3]
      const buildInfo = <BuildReqs>structures.getStructure('build')
      if (theDoc) 
        buildInfo.startBuildArtifact(theDoc.docName, buildName, buildType)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.builddescription.stop.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("builddescription-stop")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const buildInfo = <BuildReqs>structures.getStructure('build')
      if (theDoc) buildInfo.stopBuildArtifact(theDoc.docName, theLine)
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.requires.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("requires")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const objectType = theTokens[1]
      const objectName = theTokens[3]
      const buildInfo = <BuildReqs>structures.getStructure('build')
      if (theDoc) 
        buildInfo.addBuildRequirement(
          theDoc.docName, objectType, objectName, theLine
        )
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
      logger.trace("add loadComponent LaTeX requirement")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const buildInfo = <BuildReqs>structures.getStructure('build')
      var theFilePath = theTokens[1]
      if (theFilePath.endsWith('.tex') || theFilePath.endsWith('.sty')) {
        // don't do anything
      } else {
        theFilePath += '.tex'
      }
      buildInfo.addBuildRequirement('baseDoc', 'latex', theFilePath, theLine)
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
      if (theDoc) {
        const chunkCounters = <ChunkCounters>structures.getStructure('chunkCounters')
        const nextChunkName = chunkCounters.nextName(codeName, theDoc.docName)
        const buildInfo = <BuildReqs>structures.getStructure('build')
        buildInfo.addBuildRequirement('baseDoc', 'pygments', nextChunkName, theLine)
      }
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.includediagram.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      const diagramName = theTokens[1]
      logger.debug("----------------------------------------------------------")
      logger.debug("startCode")
      logger.trace(`  thisScope: ${thisScope}`)
      logger.trace(`   theScope: ${theScope}`)
      logger.debug(`diagramName: ${diagramName}`)
      logger.debug(`  theTokens: ${theTokens}`)
      logger.trace(`    theLine: ${theLine}`)
      if (theDoc) logger.trace(`     theDoc: ${theDoc.docName}`)
      logger.debug("----------------------------------------------------------")
      if (theDoc) {
        const buildInfo = <BuildReqs>structures.getStructure('build')
        buildInfo.addBuildRequirement('baseDoc', 'diagrams', diagramName, theLine)
      }
    }
  )

  scopeActions.addScopedAction(
    'keyword.control.creates.lpil',
    import.meta.url,
    async function(
      thisScope : string,
      theScope  : string,
      theTokens : string[],
      theLine   : number,
      theDoc    : Document | undefined
    ) {
      logger.trace("----------------------------------------------------------")
      logger.trace("creates")
      logger.trace(`thisScope: ${thisScope}`)
      logger.trace(` theScope: ${theScope}`)
      logger.trace(`theTokens: ${theTokens}`)
      logger.trace(`  theLine: ${theLine}`)
      if (theDoc) logger.trace(`   theDoc: ${theDoc.docName}`)
      logger.trace("----------------------------------------------------------")
      const objectType = theTokens[1]
      const objectName = theTokens[3]
      const buildInfo = <BuildReqs>structures.getStructure('build')
      if (theDoc) 
        buildInfo.addBuildCreation(
          theDoc.docName, objectType, objectName, theLine
        )
    }
  )

  scopeActions.addScopedAction(
    'finalize.control.builddescription',
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
      const buildInfo = <BuildReqs>structures.getStructure('build')
      await buildInfo.finalize(config)
    }
  )

}