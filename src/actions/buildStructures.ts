import fsp  from "fs/promises"
import path from "path"
import yaml from "yaml"

import { BuildConfig             } from "lpil-modules/dist/lib/configBuild.js"
import { Logging, ValidLogger  } from "lpil-modules/dist/lib/logging.js"
import { BaseConfig } from "lpil-modules/dist/lib/configBase"

const logger : ValidLogger = Logging.getLogger('lpil')

export class ChunkCounters {
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

function removeLaTeXEscapes(aStr : string) : string {
  return aStr.replaceAll(/\\(.)/g, "$1")
}

export class BuildReqs {

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
    objType = removeLaTeXEscapes(objType)
    objName = removeLaTeXEscapes(objName)

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
    this.startBuildArtifact('baseDoc', mainDocPath, 'typesetLatex')
    this.addBuildCreation('baseDoc', 'pdf', mainPDFPath, 0)
    this.addBuildRequirement('baseDoc', 'latex', mainDocPath, 0)
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
