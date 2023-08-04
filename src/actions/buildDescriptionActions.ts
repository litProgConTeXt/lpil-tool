
import fsp  from "fs/promises"
import path from "path"
import yaml from "yaml"

import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Builders                } from "lpil-modules/dist/lib/builders.js"
import { Grammars                } from "lpil-modules/dist/lib/grammars.js"
import { Document, DocumentCache } from "lpil-modules/dist/lib/documents.js"
import { ScopeActions            } from "lpil-modules/dist/lib/scopeActions.js"
import { Structures              } from "lpil-modules/dist/lib/structures.js"

import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
import { BaseConfig } from "lpil-modules/dist/lib/configBase"

const logger : ValidLogger = Logging.getLogger('lpil')

class ChunkCounters {
  counters : Map<string, number> = new Map()

  nextName(codeName : string, docName : string) {
    var chunkName = codeName+'-'+docName
    if (! this.counters.has(chunkName)) {
      this.counters.set(chunkName, 0)
    }
    var chunkNum = this.counters.get(chunkName)
    if (chunkNum === undefined) chunkNum = 0
    chunkNum += 1
    this.counters.set(chunkName, chunkNum)
    const chunkNameArray : Array<string> = []
    chunkNameArray.push(codeName)
    chunkNameArray.push('-')
    chunkNameArray.push(docName)
    chunkNameArray.push('-c')
    const chunkNumStr = "00000"+chunkNum
    chunkNameArray.push(chunkNumStr.substring(chunkNumStr.length-5))
    chunkNameArray.push('.chunk')
    return chunkNameArray.join('')
  }
}

class Requirement {
  objType : string
  objName : string

  constructor(objType : string, objName : string) {
    this.objType = objType
    this.objName = objName
  }
}

class Creation {
  objType : string
  objName : string

  constructor(objType : string, objName : string) {
    this.objType = objType
    this.objName = objName
  }
}

class BuildArtifact {
  name : string
  type : string
  requirements : Array<Requirement>
  creations : Array<Creation>

  constructor(artifactName : string, buildType : string) {
    this.name         = artifactName
    this.type         = buildType
    this.requirements = []
    this.creations    = []
  }

  addRequirement(objType : string, objName : string) {
    this.requirements.push(new Requirement(objType, objName))
  }

  addCreation(objType : string, objName : string) {
    this.creations.push(new Creation(objType, objName))
  }
}

class DocBuilder {
  curDesc   : BuildArtifact | undefined
  artifacts : Array<BuildArtifact> = []
}

class BuildReqs {

  buildInfo : Map<string, DocBuilder> = new Map()

  // We place `docName` as the base index to reduce the rare chance of race
  // conditions when working asynchronously
  //

  _getBuildInfo(docName : string) {
    if (!this.buildInfo.has(docName)) this.buildInfo.set(docName, new DocBuilder() )
    return this.buildInfo.get(docName)
  }

  startBuildArtifact(docName : string, buildName : string, buildType : string) {
    const theInfo = this._getBuildInfo(docName)
    if (theInfo) {
      if (theInfo.curDesc) {
        const aDesc = theInfo.curDesc
        theInfo.artifacts.push(aDesc)
      }
      theInfo.curDesc = new BuildArtifact(buildName, buildType)
    }
  }

  stopBuildArtifact(docName : string, lineNumber : number) {
    const theInfo = this._getBuildInfo(docName)
    if (theInfo) {
      if (!theInfo.curDesc) {
        logger.trace(`WARNING: no start of the current artifact build builddescription in ${docName}`)
        logger.trace(`  ... ignoring the artifact which ends at ${lineNumber}!`)
        return
      }
      const aDesc = theInfo.curDesc
      theInfo.artifacts.push(aDesc)
      delete theInfo.curDesc
    }
  }

  addBuildRequirement(
    docName : string,
    objType : string,
    objName : string,
    lineNumber : number,
  ) {
    const theInfo = this._getBuildInfo(docName)
    if (theInfo) {
      if (!theInfo.curDesc) {
        logger.trace(`WARNING: no start of the current artifact build builddescription in ${docName}`)
        logger.trace(`  ... ignoring the requirement at ${lineNumber}!`)
        return
      }
      theInfo.curDesc.addRequirement(objType, objName)
    }
  }

  addBuildCreation(
    docName : string,
    objType : string,
    objName : string,
    lineNumber : number,
  ) {
    const theInfo = this._getBuildInfo(docName)
    if (theInfo) {
      if (!theInfo.curDesc) {
        logger.trace(`WARNING: no start of the current artifact build builddescription in ${docName}`)
        logger.trace(`  ... ignoring the creation at ${lineNumber}!`)
        return
      }
      theInfo.curDesc.addCreation(objType, objName)
    }
  }

  initialize(config: BuildConfig) {
    logger.warn("Starting LaTeX build artifacts")
    const bConfig = <BaseConfig><any>config // TRUST ME!
    const mainDocPath = bConfig.initialFile
    const docExt = path.extname(mainDocPath)
    const mainPDFPath = mainDocPath.replaceAll(docExt, '.pdf')
    this.startBuildArtifact('baseDoc', mainDocPath, 'LaTeX')
    this.addBuildCreation('baseDoc', 'pdf', mainPDFPath, 0)
    this.addBuildRequirement('baseDoc', 'LaTeX', mainDocPath, 0)
  }
  
  async finalize(config : BuildConfig) {
    logger.warn("Stopping LaTeX build artifacts")
    this.stopBuildArtifact('baseDoc', 0)

    const projDesc : any = {}
    const bInfo = this.buildInfo
    for (const [aDocName, aDocInfo] of bInfo.entries()) {
      const artifacts = aDocInfo.artifacts
      for (const theArtifact of artifacts) {
        const deps : any = {}
        for (const aReq of theArtifact.requirements) {
          if (!deps[aReq.objType]) deps[aReq.objType] = []
          deps[aReq.objType].push(aReq.objName)
        }
        const creates : any = {}
        for (const aCreation of theArtifact.creations) {
          if (!creates[aCreation.objType]) creates[aCreation.objType] = []
          creates[aCreation.objType].push(aCreation.objName)
        }
        projDesc[theArtifact.name] = {
          'taskSnipet'   : theArtifact.type,
          'creates'      : creates,
          'dependencies' : deps
        }
      }
    }

    // ensure the projDesc paths exist...
    const projDescPath = config.replaceTemplate(config.buildProjDescPath)
    const projDescDir  = path.dirname(projDescPath)
    logger.trace(`ENSURING the [${projDescDir}] directory exists`)
    await fsp.mkdir(projDescDir, { recursive: true })
    
    // write out the project builddescription YAML file...
    logger.trace(`WRITING projDesc to [${projDescPath}]`)
    await fsp.writeFile(projDescPath, yaml.stringify({'projects' : projDesc }))
  }
}

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
      buildInfo.addBuildRequirement('baseDoc', 'LaTeX', theFilePath, theLine)
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
        buildInfo.addBuildRequirement('baseDoc', 'diagram', diagramName, theLine)
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